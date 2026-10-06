-- Same opt-out, for the backup copies left by the 2026-09-25 property migration.
DELETE FROM _rc_mig_event_data
  WHERE website_event_id IN (SELECT event_id FROM _rc_mig_events WHERE session_id IN (SELECT session_id FROM rc_purge));
DELETE FROM _rc_mig_events   WHERE session_id IN (SELECT session_id FROM rc_purge);
DELETE FROM _rc_mig_sessions WHERE session_id IN (SELECT session_id FROM rc_purge);
