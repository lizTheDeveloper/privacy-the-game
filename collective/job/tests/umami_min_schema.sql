CREATE TABLE session (
  session_id uuid PRIMARY KEY, website_id uuid NOT NULL,
  browser varchar(20), os varchar(20), device varchar(20), screen varchar(11),
  language varchar(35), country char(2), region varchar(20), city varchar(50),
  created_at timestamptz DEFAULT now(), distinct_id varchar(50)
);
CREATE TABLE website_event (
  event_id uuid PRIMARY KEY, website_id uuid NOT NULL, session_id uuid NOT NULL,
  visit_id uuid, created_at timestamptz DEFAULT now(), url_path varchar(500) DEFAULT '/',
  event_type int DEFAULT 2, event_name varchar(50)
);
CREATE TABLE event_data (
  event_data_id uuid PRIMARY KEY, website_id uuid NOT NULL, website_event_id uuid NOT NULL,
  data_key varchar(500) NOT NULL, string_value varchar(500), number_value numeric(19,4),
  date_value timestamptz, data_type int NOT NULL DEFAULT 1, created_at timestamptz DEFAULT now()
);
CREATE TABLE session_data (
  session_data_id uuid PRIMARY KEY, website_id uuid NOT NULL, session_id uuid NOT NULL,
  data_key varchar(500) NOT NULL, string_value varchar(500), data_type int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE revenue (revenue_id uuid PRIMARY KEY, website_id uuid NOT NULL, session_id uuid NOT NULL);
CREATE TABLE session_replay (id uuid PRIMARY KEY, website_id uuid NOT NULL, session_id uuid NOT NULL);
-- Backups left by the 2026-09-25 property migration; they hold copies of Reclaim City rows.
CREATE TABLE _rc_mig_sessions (LIKE session);
CREATE TABLE _rc_mig_events (LIKE website_event);
CREATE TABLE _rc_mig_event_data (LIKE event_data);
