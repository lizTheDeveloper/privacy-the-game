-- Delete every row for sessions whose data is to go, keep only how many there
-- were. Runs inside the caller's transaction. Variable: :website (Umami website id).
-- Session ids carry a monthly salt, so this reaches the current month only.
--
-- A session goes if it has ANY deletion event (opted-out, went-ghost-early)
-- that no cancel matches. The game sends a random `nonce` with each deletion
-- and the same nonce with its cancel (opt-out-cancelled, ghost-cancelled), so
-- only the browser that asked for the deletion can call it off: on a shared
-- connection with identical browsers (one Umami session) another person's
-- cancel carries another nonce and the session is still purged. Order and
-- timestamps don't matter. A deletion with no nonce (older clients) can never
-- be cancelled. A final-mission `went-ghost` deletes nothing.

-- 1. Restores. A player whose data was deleted sent their saved game again,
-- with `data-restored` {kind}: they are no longer an opt-out / early ghost, so
-- take one off that counter per distinct session, never below zero. The
-- data-restored events are then deleted so tomorrow's run does not count them
-- again. Anyone can send one (same trust model as opted-out): a scripted
-- sender could lower the counts, never another player's data.
CREATE TEMP TABLE rc_restored ON COMMIT DROP AS
  SELECT DISTINCT e.session_id, d.string_value AS kind
    FROM website_event e JOIN event_data d ON d.website_event_id = e.event_id
   WHERE e.website_id = :'website' AND e.event_name = 'data-restored'
     AND d.data_key = 'kind' AND d.string_value IN ('opted-out', 'ghost-early');

UPDATE rc_collective.counters
  SET value = greatest(0, value - (SELECT count(*) FROM rc_restored WHERE kind = 'opted-out'))
  WHERE name = 'opted_out_total';
UPDATE rc_collective.counters
  SET value = greatest(0, value - (SELECT count(*) FROM rc_restored WHERE kind = 'ghost-early'))
  WHERE name = 'ghosts_early_total';

DELETE FROM event_data
  WHERE website_id = :'website'
    AND website_event_id IN (SELECT event_id FROM website_event
                             WHERE website_id = :'website' AND event_name = 'data-restored');
DELETE FROM website_event WHERE website_id = :'website' AND event_name = 'data-restored';

-- 2. Who goes tonight.
CREATE TEMP TABLE rc_del ON COMMIT DROP AS
  SELECT e.session_id, e.event_name,
         (SELECT nullif(d.string_value, '') FROM event_data d
           WHERE d.website_event_id = e.event_id AND d.data_key = 'nonce' LIMIT 1) AS nonce
    FROM website_event e
   WHERE e.website_id = :'website'
     AND e.event_name IN ('opted-out', 'opt-out-cancelled', 'went-ghost-early', 'ghost-cancelled');

CREATE TEMP TABLE rc_purge ON COMMIT DROP AS
  SELECT session_id,
         bool_or(event_name = 'opted-out')        AS opted_out,
         bool_or(event_name = 'went-ghost-early') AS ghost_early
    FROM rc_del d
   WHERE d.event_name IN ('opted-out', 'went-ghost-early')
     AND (d.nonce IS NULL OR NOT EXISTS (
           SELECT 1 FROM rc_del c
            WHERE c.nonce = d.nonce
              AND c.event_name = CASE d.event_name WHEN 'opted-out' THEN 'opt-out-cancelled'
                                                   ELSE 'ghost-cancelled' END))
   GROUP BY session_id;

-- Counted by uncancelled deletions only. An early ghost who also has an
-- uncancelled opt-out counts once, as an opt-out.
UPDATE rc_collective.counters
  SET value = value + (SELECT count(*) FROM rc_purge WHERE opted_out)
  WHERE name = 'opted_out_total';
UPDATE rc_collective.counters
  SET value = value + (SELECT count(*) FROM rc_purge WHERE ghost_early AND NOT opted_out)
  WHERE name = 'ghosts_early_total';

DELETE FROM event_data
  WHERE website_id = :'website'
    AND website_event_id IN (SELECT event_id FROM website_event
                             WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge));
DELETE FROM session_data   WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM revenue        WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM session_replay WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM website_event  WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM session        WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
