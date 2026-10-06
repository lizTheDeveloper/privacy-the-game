-- Delete every row for sessions that opted out, keep only how many there were.
-- Runs inside the caller's transaction. Variable: :website (Umami website id).
-- Session ids carry a monthly salt, so this reaches the current month only.
CREATE TEMP TABLE rc_purge ON COMMIT DROP AS
  SELECT DISTINCT session_id FROM website_event
  WHERE website_id = :'website' AND event_name = 'opted-out';

UPDATE rc_collective.counters
  SET value = value + (SELECT count(*) FROM rc_purge)
  WHERE name = 'opted_out_total';

DELETE FROM event_data
  WHERE website_id = :'website'
    AND website_event_id IN (SELECT event_id FROM website_event
                             WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge));
DELETE FROM session_data   WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM revenue        WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM session_replay WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM website_event  WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM session        WHERE website_id = :'website' AND session_id IN (SELECT session_id FROM rc_purge);
