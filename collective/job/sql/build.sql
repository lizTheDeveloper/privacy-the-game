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
       (SELECT d.string_value
          FROM website_event e JOIN event_data d ON d.website_event_id = e.event_id
         WHERE e.website_id = s.website_id AND e.session_id = s.session_id AND d.data_key = 'pod'
         ORDER BY e.created_at DESC LIMIT 1)            AS chosen,
       NULL::text AS geo_pod,
       NULL::text AS pod
  FROM session s
 WHERE s.website_id = :'website';

CREATE TEMP TABLE rc_pods (
  id text PRIMARY KEY, level text, country text, region text, city text,
  rest boolean DEFAULT false, includes_world boolean DEFAULT false
) ON COMMIT DROP;

-- 1. Cities with >= k players.
INSERT INTO rc_pods (id, level, country, region, city)
SELECT pg_temp.rc_slug(coalesce(nullif(region, ''), country) || '-' || city), 'city', country, region, city
  FROM rc_s WHERE city <> '' AND country <> ''
 GROUP BY country, region, city HAVING count(*) >= :k;
UPDATE rc_s s SET geo_pod = p.id FROM rc_pods p
 WHERE p.level = 'city' AND (s.country, s.region, s.city) = (p.country, p.region, p.city);

-- 2. Regions, from what the cities left.
INSERT INTO rc_pods (id, level, country, region, rest)
SELECT pg_temp.rc_slug(region) || CASE WHEN bool_or(has_city) THEN '-rest' ELSE '' END,
       'region', country, region, bool_or(has_city)
  FROM (SELECT s.country, s.region,
               EXISTS (SELECT 1 FROM rc_pods c WHERE c.level = 'city' AND c.region = s.region) AS has_city
          FROM rc_s s WHERE s.geo_pod IS NULL AND s.region <> '') x
 GROUP BY country, region HAVING count(*) >= :k;
UPDATE rc_s s SET geo_pod = p.id FROM rc_pods p
 WHERE s.geo_pod IS NULL AND p.level = 'region' AND s.region = p.region;

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
SELECT e.session_id,
       max(d.string_value) FILTER (WHERE d.data_key = 'mission') AS mission,
       max(d.string_value) FILTER (WHERE d.data_key = 'finding') AS finding,
       max(d.string_value) FILTER (WHERE d.data_key = 'status')  AS status
  FROM website_event e JOIN event_data d ON d.website_event_id = e.event_id
 WHERE e.website_id = :'website' AND e.event_name = 'mission-completed'
 GROUP BY e.event_id, e.session_id;

CREATE TEMP TABLE rc_checks ON COMMIT DROP AS
SELECT session_id, left(mission, length(mission) - length('-recon-breach')) AS acct, finding
  FROM rc_mc WHERE mission LIKE '%-recon-breach' AND finding IS NOT NULL AND finding <> 'skip';

CREATE TEMP TABLE rc_breached ON COMMIT DROP AS
SELECT DISTINCT c.session_id, c.acct,
       EXISTS (SELECT 1 FROM rc_mc f WHERE f.session_id = c.session_id AND f.status = 'completed'
                 AND f.mission IN (c.acct || '-fortify-password', c.acct || '-fortify-2fa')) AS fixed
  FROM rc_checks c WHERE c.finding IN ('1-2-breaches', '3plus-breaches');

CREATE TEMP TABLE rc_ghost ON COMMIT DROP AS
SELECT DISTINCT session_id FROM website_event WHERE website_id = :'website' AND event_name = 'went-ghost';

CREATE TEMP TABLE rc_districts ON COMMIT DROP AS
SELECT session_id FROM website_event WHERE website_id = :'website' AND event_name = 'district-completed';

-- Totals for any set of sessions (a pod, or the city).
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
        round(100.0 * (SELECT count(*) FILTER (WHERE finding <> 'no-breaches') FROM chk) / nullif((SELECT count(*) FROM chk), 0)) END,
    'breach3PlusPct', CASE WHEN n.check_players >= k THEN
        round(100.0 * (SELECT count(*) FILTER (WHERE finding = '3plus-breaches') FROM chk) / nullif((SELECT count(*) FROM chk), 0)) END,
    'actions', (SELECT count(*) FROM rc_mc m JOIN s USING (session_id) WHERE m.status = 'completed'),
    'districts', (SELECT count(*) FROM rc_districts d JOIN s USING (session_id)),
    'ghosts', (SELECT count(*) FROM rc_ghost g JOIN s USING (session_id))
  )) END
  FROM n
$$;

SELECT jsonb_build_object(
  'k', :k,
  'city', pg_temp.rc_totals(NULL, :k)
          || jsonb_build_object('optedOut', (SELECT value FROM rc_collective.counters WHERE name = 'opted_out_total'),
                                'pods', (SELECT count(*) FROM rc_pods),
                                'byAddress', coalesce((
                                  SELECT jsonb_agg(jsonb_build_object('id', acct, 'checks', checks, 'breachRatePct', pct)
                                                   ORDER BY checks DESC, acct)
                                    FROM (SELECT acct, count(*) AS checks, count(DISTINCT session_id) AS who,
                                                 round(100.0 * count(*) FILTER (WHERE finding <> 'no-breaches') / count(*)) AS pct
                                            FROM rc_checks GROUP BY acct) a
                                   WHERE checks >= :k AND who >= :k), '[]'::jsonb)),
  'pods', coalesce((SELECT jsonb_agg(
            jsonb_strip_nulls(jsonb_build_object('id', p.id, 'level', p.level, 'country', nullif(p.country, ''),
                              'region', nullif(p.region, ''), 'city', nullif(p.city, ''),
                              'rest', p.rest, 'includesWorld', p.includes_world))
            || pg_temp.rc_totals(p.id, :k) ORDER BY p.id) FROM rc_pods p), '[]'::jsonb)
)::text;
