-- Reclaim City collective totals. Variables: :website, :k. Runs inside the
-- caller's transaction after purge.sql. Prints one JSON line; figures from
-- fewer than :k players are omitted (jsonb_strip_nulls), never zeroed.

CREATE OR REPLACE FUNCTION pg_temp.rc_slug(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE TEMP TABLE rc_s ON COMMIT DROP AS
SELECT s.session_id,
       upper(coalesce(nullif(trim(s.country), ''), '')) AS country,
       coalesce(nullif(trim(s.region), ''), '')          AS region,
       coalesce(nullif(trim(s.city), ''), '')            AS city,
       lower(coalesce(nullif(trim(s.device), ''), ''))   AS device,
       (SELECT d.string_value
          FROM website_event e JOIN event_data d ON d.website_event_id = e.event_id
         WHERE e.website_id = s.website_id AND e.session_id = s.session_id AND d.data_key = 'pod'
         ORDER BY e.created_at DESC, e.event_id DESC LIMIT 1) AS chosen,
       NULL::text AS city_id,
       NULL::text AS region_id,
       NULL::text AS geo_pod,
       NULL::text AS pod
  FROM session s
 WHERE s.website_id = :'website';

-- Group by slug id, not raw name, so "St. Louis" and "St Louis" merge.
UPDATE rc_s SET region_id = pg_temp.rc_slug(region),
       city_id = CASE WHEN city <> '' AND country <> ''
                      THEN pg_temp.rc_slug(coalesce(nullif(region, ''), country) || '-' || city) END;

CREATE TEMP TABLE rc_pods (
  id text PRIMARY KEY, key text, level text, country text, region text, city text,
  rest boolean DEFAULT false, includes_world boolean DEFAULT false
) ON COMMIT DROP;

-- 1. Cities with >= k players.
INSERT INTO rc_pods (id, key, level, country, region, city)
SELECT city_id, city_id, 'city', min(country), min(region), min(city)
  FROM rc_s WHERE city_id IS NOT NULL
 GROUP BY city_id HAVING count(*) >= :k;
UPDATE rc_s s SET geo_pod = p.id FROM rc_pods p
 WHERE p.level = 'city' AND s.city_id = p.key;

-- 2. Regions, from what the cities left.
INSERT INTO rc_pods (id, key, level, country, region, rest)
SELECT region_id || CASE WHEN bool_or(has_city) THEN '-rest' ELSE '' END, region_id,
       'region', country, min(region), bool_or(has_city)
  FROM (SELECT s.country, s.region, s.region_id,
               EXISTS (SELECT 1 FROM rc_pods c WHERE c.level = 'city' AND c.country = s.country
                          AND pg_temp.rc_slug(c.region) = s.region_id) AS has_city
          FROM rc_s s WHERE s.geo_pod IS NULL AND s.region <> '') x
 GROUP BY country, region_id HAVING count(*) >= :k;
UPDATE rc_s s SET geo_pod = p.id FROM rc_pods p
 WHERE s.geo_pod IS NULL AND p.level = 'region' AND s.country = p.country AND s.region_id = p.key;

-- 3. Countries, from what the regions left.
INSERT INTO rc_pods (id, level, country, rest)
SELECT lower(country) || CASE WHEN bool_or(has_child) THEN '-rest' ELSE '' END, 'country', country, bool_or(has_child)
  FROM (SELECT s.country,
               EXISTS (SELECT 1 FROM rc_pods c WHERE c.level IN ('city', 'region') AND c.country = s.country) AS has_child
          FROM rc_s s WHERE s.geo_pod IS NULL AND s.country <> '') x
 GROUP BY country HAVING count(*) >= :k;
UPDATE rc_s s SET geo_pod = p.id FROM rc_pods p
 WHERE s.geo_pod IS NULL AND p.level = 'country' AND s.country = p.country;

-- 4. Everyone else is the rest of the world; fold it if it is under k.
-- DO blocks cannot see psql variables, so k travels as a setting.
SELECT set_config('rc.k', :'k', true);
UPDATE rc_s SET geo_pod = 'world-rest' WHERE geo_pod IS NULL;
DO $$
DECLARE n bigint; target text;
BEGIN
  SELECT count(*) INTO n FROM rc_s WHERE geo_pod = 'world-rest';
  IF n = 0 THEN RETURN; END IF;
  IF n >= current_setting('rc.k')::int OR NOT EXISTS (SELECT 1 FROM rc_pods) THEN
    INSERT INTO rc_pods (id, level, rest) VALUES ('world-rest', 'world', true);
    RETURN;
  END IF;
  SELECT p.id INTO target FROM rc_pods p JOIN rc_s s ON s.geo_pod = p.id
   GROUP BY p.id, p.level
   ORDER BY (p.level = 'country') DESC, count(*) ASC, p.id LIMIT 1;
  UPDATE rc_s SET geo_pod = target WHERE geo_pod = 'world-rest';
  UPDATE rc_pods SET includes_world = true WHERE id = target;
END $$;

-- 5. Effective pod: a valid choice wins, otherwise geography.
UPDATE rc_s s SET pod = CASE WHEN s.chosen IN (SELECT id FROM rc_pods) THEN s.chosen ELSE s.geo_pod END;

-- Per-event facts.
CREATE TEMP TABLE rc_mc ON COMMIT DROP AS
SELECT e.session_id, e.event_id, e.created_at AS at,
       max(d.string_value) FILTER (WHERE d.data_key = 'mission') AS mission,
       max(d.string_value) FILTER (WHERE d.data_key = 'finding') AS finding,
       max(d.string_value) FILTER (WHERE d.data_key = 'status')  AS status,
       max(d.string_value) FILTER (WHERE d.data_key = 'method')  AS method,
       max(d.string_value) FILTER (WHERE d.data_key = 'same_address') AS same_address
  FROM website_event e JOIN event_data d ON d.website_event_id = e.event_id
 WHERE e.website_id = :'website' AND e.event_name = 'mission-completed'
 GROUP BY e.event_id, e.session_id, e.created_at;

-- Breach checks: an allowlist, never "anything but skip". Only the three
-- breach answers count, and only on the email-address accounts' HIBP checks
-- (HIBP searches by address). Old service "-recon-breach" events (bank,
-- PayPal, LinkedIn...) re-checked the same address, and restore.js resends
-- them from saved games, so they are excluded by mission id; any other
-- finding value (new or malformed) is excluded by value.
-- One check per session and address: the latest filing wins (a restored or
-- refiled check is the same check; a refile to "skip" is no check).
-- Recon X4: Google/Gmail, Apple ID/iCloud and Microsoft/Outlook are nearly
-- always one address. A new "same address" filing sends no finding, so it is
-- no check; an old save may hold both checks of a pair, and they count as one
-- address per player (the later answer), under the first account's id when
-- the player checked it, else under the second's. The second account's own
-- latest answer "different-address" (same_address, tracked since ruling
-- 2026-10-07) makes it a separate address; "same" or missing is one address.
-- Severity of a breach answer, to break a same-instant tie (as calc.js
-- addressChecks does): never by event_id, which is a random uuid.
CREATE OR REPLACE FUNCTION pg_temp.rc_sev(finding text) RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE finding WHEN '3plus-breaches' THEN 3 WHEN '1-2-breaches' THEN 2 WHEN 'no-breaches' THEN 1 ELSE 0 END
$$;

CREATE OR REPLACE FUNCTION pg_temp.rc_pair(acct text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE acct WHEN 'google' THEN 'gmail' WHEN 'apple_id' THEN 'icloud' WHEN 'microsoft' THEN 'outlook' ELSE acct END
$$;

-- Pairs the player split: the second account's latest answer is
-- "different-address", whatever its finding. Both accounts are then separate
-- addresses, each fixed only by its own reset or 2FA (symmetric).
CREATE TEMP TABLE rc_split ON COMMIT DROP AS
SELECT session_id, pg_temp.rc_pair(acct) AS pair
  FROM (SELECT DISTINCT ON (session_id, acct) session_id, acct, same_address
          FROM (SELECT session_id, event_id, at, same_address,
                       left(mission, length(mission) - length('-recon-breach')) AS acct
                  FROM rc_mc WHERE mission IN ('google-recon-breach', 'apple_id-recon-breach', 'microsoft-recon-breach')) c
         ORDER BY session_id, acct, at DESC, event_id DESC) latest
 WHERE same_address = 'different-address';

CREATE TEMP TABLE rc_checks_acct ON COMMIT DROP AS
SELECT l.session_id, l.acct, l.finding, l.at, l.event_id,
       EXISTS (SELECT 1 FROM rc_split x WHERE x.session_id = l.session_id AND x.pair = pg_temp.rc_pair(l.acct)) AS separate
  FROM (SELECT DISTINCT ON (session_id, acct) session_id, acct, finding, at, event_id
          FROM (SELECT session_id, event_id, at, finding,
                       left(mission, length(mission) - length('-recon-breach')) AS acct
                  FROM rc_mc WHERE mission LIKE '%-recon-breach') c
         WHERE acct IN ('gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'google', 'apple_id', 'microsoft')
         ORDER BY session_id, acct, at DESC, pg_temp.rc_sev(finding) DESC, event_id DESC) l
 WHERE l.finding IN ('no-breaches', '1-2-breaches', '3plus-breaches');

ALTER TABLE rc_checks_acct ADD COLUMN addr text;
UPDATE rc_checks_acct SET addr = CASE WHEN separate THEN acct ELSE pg_temp.rc_pair(acct) END;

CREATE TEMP TABLE rc_checks ON COMMIT DROP AS
SELECT DISTINCT ON (c.session_id, c.addr) c.session_id,
       CASE WHEN EXISTS (SELECT 1 FROM rc_checks_acct p WHERE p.session_id = c.session_id AND p.acct = c.addr)
            THEN c.addr ELSE c.acct END AS acct,
       c.finding,
       c.separate
  FROM rc_checks_acct c
 ORDER BY c.session_id, c.addr, c.at DESC, pg_temp.rc_sev(c.finding) DESC, c.event_id DESC;

-- Each session's latest filing of each mission (ruling 2026-10-08: the
-- latest filing wins, as in the save; a reset refiled as skipped is no
-- longer done). On a same-instant tie, completed wins.
CREATE TEMP TABLE rc_latest ON COMMIT DROP AS
SELECT DISTINCT ON (session_id, mission) session_id, mission, status, method
  FROM rc_mc WHERE mission IS NOT NULL
 ORDER BY session_id, mission, at DESC, (status = 'completed') DESC, event_id DESC;

-- What players did: one row per session and mission whose latest filing is
-- completed. Mission ids checked against src/data/missions*.js.
CREATE TEMP TABLE rc_done ON COMMIT DROP AS
SELECT session_id, mission FROM rc_latest WHERE status = 'completed';

-- Fixed by either account of a pair (one address, one password); a separate
-- address only by its own account.
CREATE OR REPLACE FUNCTION pg_temp.rc_members(acct text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE pg_temp.rc_pair(acct) WHEN 'gmail' THEN ARRAY['gmail', 'google'] WHEN 'icloud' THEN ARRAY['icloud', 'apple_id']
              WHEN 'outlook' THEN ARRAY['outlook', 'microsoft'] ELSE ARRAY[acct] END
$$;

CREATE TEMP TABLE rc_breached ON COMMIT DROP AS
SELECT DISTINCT c.session_id, c.acct,
       EXISTS (SELECT 1 FROM rc_done f, unnest(CASE WHEN c.separate THEN ARRAY[c.acct] ELSE pg_temp.rc_members(c.acct) END) a
                WHERE f.session_id = c.session_id
                  AND f.mission IN (a || '-fortify-password', a || '-fortify-2fa')) AS fixed
  FROM rc_checks c WHERE c.finding IN ('1-2-breaches', '3plus-breaches');

CREATE TEMP TABLE rc_ghost ON COMMIT DROP AS
SELECT DISTINCT session_id FROM website_event WHERE website_id = :'website' AND event_name = 'went-ghost';

CREATE TEMP TABLE rc_districts ON COMMIT DROP AS
SELECT session_id FROM website_event WHERE website_id = :'website' AND event_name = 'district-completed';

-- What players did, by kind: one row per session, mission and kind, from
-- rc_done (latest filing completed; a mission sent twice counts once).

CREATE TEMP TABLE rc_kinds ON COMMIT DROP AS
SELECT session_id, mission, 'passwords' AS kind FROM rc_done
 WHERE mission LIKE '%-fortify-password' OR mission LIKE '%-fortify-passwords'
UNION ALL
SELECT session_id, mission, 'twoFactor' FROM rc_done
 WHERE mission LIKE '%-fortify-2fa' OR mission LIKE '%-fortify-twostep' OR mission LIKE '%-fortify-reglock'
UNION ALL
SELECT session_id, mission, 'creditFreezes' FROM rc_done
 WHERE (mission LIKE 'credit\_freeze-fortify-%' AND mission <> 'credit_freeze-fortify-extras')
    OR mission IN ('govt_id_defense-fortify-ssa-lock', 'irs-fortify-ip-pin', 'govt_id_defense-fortify-irs-pin')
UNION ALL
SELECT session_id, mission, 'privacy' FROM rc_done
 WHERE mission LIKE '%-reclaim-privacy%' OR mission LIKE '%-reclaim-app-permissions%'
UNION ALL
SELECT session_id, mission, 'brokerOptOuts' FROM rc_done
 WHERE mission LIKE 'people\_search-fortify-%' OR mission LIKE 'location\_brokers-fortify-%'
    OR mission LIKE 'enterprise\_data-fortify-%' OR mission LIKE 'ad\_trackers-fortify-%'
UNION ALL
SELECT session_id, mission, 'historyReviewed' FROM rc_done
 WHERE mission ~ '-reclaim-(early|middle|recent|history|early-years|middle-years|bulk|review)$'
UNION ALL
-- Accounts whose second step is a passkey or authenticator app: a 2FA
-- mission answered that way, or an upgrade from text/email codes. Keyed by
-- account, so 2FA plus an upgrade on one account counts once. ('not-needed'
-- and every other status but completed never count, here or above.)
SELECT DISTINCT session_id, regexp_replace(mission, '-fortify-2fa(-upgrade)?$', ''), 'passkeyOrApp' FROM rc_latest
 WHERE status = 'completed'
   AND ((mission LIKE '%-fortify-2fa' AND method IN ('passkey', 'authenticator'))
        OR mission LIKE '%-fortify-2fa-upgrade')
UNION ALL
SELECT session_id, mission, 'smsUpgrades' FROM rc_done
 WHERE mission LIKE '%-fortify-2fa-upgrade';

-- Which figures each pod publishes. City figures are built only from pods that
-- publish the same figure, so city minus the sum of pods never reveals a pod
-- that was suppressed.
CREATE TEMP TABLE rc_flags ON COMMIT DROP AS
SELECT s.pod, count(*) AS players,
       count(*) FILTER (WHERE s.session_id IN (SELECT session_id FROM rc_breached)) AS bp,
       count(*) FILTER (WHERE s.session_id IN (SELECT session_id FROM rc_checks)) AS cp,
       count(*) FILTER (WHERE s.session_id IN (SELECT session_id FROM rc_kinds WHERE kind = 'passwords')) AS pw,
       count(*) FILTER (WHERE s.session_id IN (SELECT session_id FROM rc_kinds WHERE kind = 'twoFactor')) AS tf
  FROM rc_s s GROUP BY s.pod;

-- City totals over published pods only. Figures follow each pod's own gates.
CREATE OR REPLACE FUNCTION pg_temp.rc_city(k int) RETURNS jsonb LANGUAGE sql AS $$
  WITH f  AS (SELECT pod, players >= k AS pp, players >= k AND bp >= k AS pf, players >= k AND cp >= k AS pc,
                     players >= k AND pw >= k AS ppw, players >= k AND tf >= k AS ptf FROM rc_flags),
       sp AS (SELECT s.session_id FROM rc_s s JOIN f ON f.pod = s.pod WHERE f.pp),
       sf AS (SELECT s.session_id FROM rc_s s JOIN f ON f.pod = s.pod WHERE f.pf),
       sc AS (SELECT s.session_id FROM rc_s s JOIN f ON f.pod = s.pod WHERE f.pc),
       spw AS (SELECT s.session_id FROM rc_s s JOIN f ON f.pod = s.pod WHERE f.ppw),
       stf AS (SELECT s.session_id FROM rc_s s JOIN f ON f.pod = s.pod WHERE f.ptf),
       chk AS (SELECT c.* FROM rc_checks c JOIN sc USING (session_id)),
       br  AS (SELECT b.* FROM rc_breached b JOIN sf USING (session_id)),
       n   AS (SELECT (SELECT count(*) FROM sp) AS players,
                      (SELECT count(DISTINCT session_id) FROM chk) AS check_players,
                      (SELECT count(DISTINCT session_id) FROM br) AS breached_players)
  SELECT CASE WHEN n.players < k THEN '{}'::jsonb ELSE jsonb_strip_nulls(jsonb_build_object(
    'players', n.players,
    'fortified', CASE WHEN n.breached_players >= k THEN jsonb_build_object(
        'pct', round(100.0 * (SELECT count(*) FILTER (WHERE fixed) FROM br) / nullif((SELECT count(*) FROM br), 0)),
        'fixed', (SELECT count(*) FILTER (WHERE fixed) FROM br),
        'breached', (SELECT count(*) FROM br)) END,
    'breachChecks', CASE WHEN n.check_players >= k THEN (SELECT count(*) FROM chk) END,
    'breachRatePct', CASE WHEN n.check_players >= k THEN
        round(100.0 * (SELECT count(*) FILTER (WHERE finding IN ('1-2-breaches', '3plus-breaches')) FROM chk) / nullif((SELECT count(*) FROM chk), 0)) END,
    'breach3PlusPct', CASE WHEN n.check_players >= k THEN
        round(100.0 * (SELECT count(*) FILTER (WHERE finding = '3plus-breaches') FROM chk) / nullif((SELECT count(*) FROM chk), 0)) END,
    'actions', (SELECT count(*) FROM rc_mc m JOIN sp USING (session_id) WHERE m.status = 'completed'),
    'districts', (SELECT count(*) FROM rc_districts d JOIN sp USING (session_id)),
    'ghosts', (SELECT count(*) FROM rc_ghost g JOIN sp USING (session_id)),
    -- Per-pod figures too: only over pods that publish them (no residual).
    'passwords', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN spw USING (session_id) WHERE kind = 'passwords'),
    'twoFactor', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN stf USING (session_id) WHERE kind = 'twoFactor'),
    -- City-only figures: over published pods, k contributing players.
    'creditFreezes', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN sp USING (session_id) WHERE kind = 'creditFreezes'),
    'privacy', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN sp USING (session_id) WHERE kind = 'privacy'),
    'brokerOptOuts', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN sp USING (session_id) WHERE kind = 'brokerOptOuts'),
    'historyReviewed', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN sp USING (session_id) WHERE kind = 'historyReviewed'),
    'passkeyOrApp', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN sp USING (session_id) WHERE kind = 'passkeyOrApp'),
    'smsUpgrades', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN sp USING (session_id) WHERE kind = 'smsUpgrades'),
    -- A count of places, not people.
    'countries', (SELECT count(DISTINCT s.country) FROM rc_s s JOIN sp USING (session_id) WHERE s.country <> ''),
    'phonePct', (SELECT CASE WHEN count(*) >= k THEN round(100.0 * count(*) FILTER (WHERE s.device = 'mobile') / count(*)) END
                   FROM rc_s s JOIN sp USING (session_id) WHERE s.device <> '')
  )) END
  FROM n
$$;

-- Totals for a pod.
CREATE OR REPLACE FUNCTION pg_temp.rc_totals(pod_filter text, k int) RETURNS jsonb LANGUAGE sql AS $$
  WITH s AS (SELECT session_id FROM rc_s WHERE pod_filter IS NULL OR pod = pod_filter),
       chk AS (SELECT c.* FROM rc_checks c JOIN s USING (session_id)),
       br  AS (SELECT b.* FROM rc_breached b JOIN s USING (session_id)),
       n   AS (SELECT (SELECT count(*) FROM s) AS players,
                      (SELECT count(DISTINCT session_id) FROM chk) AS check_players,
                      (SELECT count(DISTINCT session_id) FROM br) AS breached_players)
  SELECT CASE WHEN n.players < k THEN '{}'::jsonb ELSE jsonb_strip_nulls(jsonb_build_object(
    'players', n.players,
    'fortified', CASE WHEN n.breached_players >= k THEN jsonb_build_object(
        'pct', round(100.0 * (SELECT count(*) FILTER (WHERE fixed) FROM br) / nullif((SELECT count(*) FROM br), 0)),
        'fixed', (SELECT count(*) FILTER (WHERE fixed) FROM br),
        'breached', (SELECT count(*) FROM br)) END,
    'breachChecks', CASE WHEN n.check_players >= k THEN (SELECT count(*) FROM chk) END,
    'breachRatePct', CASE WHEN n.check_players >= k THEN
        round(100.0 * (SELECT count(*) FILTER (WHERE finding IN ('1-2-breaches', '3plus-breaches')) FROM chk) / nullif((SELECT count(*) FROM chk), 0)) END,
    'breach3PlusPct', CASE WHEN n.check_players >= k THEN
        round(100.0 * (SELECT count(*) FILTER (WHERE finding = '3plus-breaches') FROM chk) / nullif((SELECT count(*) FROM chk), 0)) END,
    'actions', (SELECT count(*) FROM rc_mc m JOIN s USING (session_id) WHERE m.status = 'completed'),
    'districts', (SELECT count(*) FROM rc_districts d JOIN s USING (session_id)),
    'ghosts', (SELECT count(*) FROM rc_ghost g JOIN s USING (session_id)),
    'passwords', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN s USING (session_id) WHERE kind = 'passwords'),
    'twoFactor', (SELECT CASE WHEN count(DISTINCT session_id) >= k THEN count(*) END FROM rc_kinds JOIN s USING (session_id) WHERE kind = 'twoFactor')
  )) END
  FROM n
$$;

-- city.ghosts = kept ghosts (went-ghost, counted over published pods only, as
-- above) + ghosts_early_total. Early ghosts' rows were purged, so that part is
-- a city-only counter like optedOut: it has no pod residual to subtract, and
-- city.ghosts minus the sum of pod ghosts is exactly that published counter.
SELECT jsonb_build_object(
  'k', :k,
  'city', c.city
          || jsonb_build_object('ghosts', coalesce((c.city->>'ghosts')::bigint, 0)
                                          + (SELECT value FROM rc_collective.counters WHERE name = 'ghosts_early_total'),
                                'optedOut', (SELECT value FROM rc_collective.counters WHERE name = 'opted_out_total'),
                                'pods', (SELECT count(*) FROM rc_pods),
                                'byAddress', coalesce((
                                  SELECT jsonb_agg(jsonb_build_object('id', acct, 'breachRatePct', pct)
                                                   ORDER BY checks DESC, acct)
                                    FROM (SELECT acct, count(*) AS checks, count(DISTINCT session_id) AS who,
                                                 round(100.0 * count(*) FILTER (WHERE finding IN ('1-2-breaches', '3plus-breaches')) / count(*)) AS pct
                                            FROM rc_checks
                                           WHERE session_id IN (SELECT s.session_id FROM rc_s s JOIN rc_flags f ON f.pod = s.pod
                                                                 WHERE f.players >= :k AND f.cp >= :k)
                                           GROUP BY acct) a
                                   WHERE checks >= :k AND who >= :k), '[]'::jsonb))
          -- Sessions that brought deleted data back (counted by purge.sql
          -- before it deletes the data-restored events); shown from k.
          || jsonb_strip_nulls(jsonb_build_object('restored',
               (SELECT value FROM rc_collective.counters WHERE name = 'restored_total' AND value >= :k))),
  'pods', coalesce((SELECT jsonb_agg(
            jsonb_strip_nulls(jsonb_build_object('id', p.id, 'level', p.level, 'country', nullif(p.country, ''),
                              'region', nullif(p.region, ''), 'city', nullif(p.city, ''),
                              'rest', p.rest, 'includesWorld', p.includes_world))
            || pg_temp.rc_totals(p.id, :k) ORDER BY p.id) FROM rc_pods p), '[]'::jsonb)
)::text
FROM (SELECT pg_temp.rc_city(:k) AS city) c;
