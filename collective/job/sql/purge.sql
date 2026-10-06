-- Delete every row for sessions whose data is to go, keep only how many there
-- were. Runs inside the caller's transaction. Variable: :website (Umami website id).
-- Session ids carry a monthly salt, so this reaches the current month only.
--
-- A session goes when, by (created_at, event_id):
--   * its latest of (opted-out, opt-out-cancelled) is opted-out, or
--   * its latest of (went-ghost-early, ghost-cancelled) is went-ghost-early.
-- A final-mission `went-ghost` deletes nothing.

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
CREATE TEMP TABLE rc_purge ON COMMIT DROP AS
  SELECT session_id,
         coalesce(optout = 'opted-out', false)       AS opted_out,
         coalesce(ghost = 'went-ghost-early', false) AS ghost_early
    FROM (SELECT session_id,
                 (array_agg(event_name ORDER BY created_at DESC, event_id DESC)
                    FILTER (WHERE event_name IN ('opted-out', 'opt-out-cancelled')))[1] AS optout,
                 (array_agg(event_name ORDER BY created_at DESC, event_id DESC)
                    FILTER (WHERE event_name IN ('went-ghost-early', 'ghost-cancelled')))[1] AS ghost
            FROM website_event
           WHERE website_id = :'website'
             AND event_name IN ('opted-out', 'opt-out-cancelled', 'went-ghost-early', 'ghost-cancelled')
           GROUP BY session_id) latest
   WHERE optout = 'opted-out' OR ghost = 'went-ghost-early';

-- An early ghost who also opted out counts once, as an opt-out.
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
