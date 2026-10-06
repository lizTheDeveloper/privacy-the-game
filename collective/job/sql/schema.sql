-- Reclaim City collective score: our own state, kept out of Umami's schema so
-- Umami migrations never touch it. Idempotent.
CREATE SCHEMA IF NOT EXISTS rc_collective;
CREATE TABLE IF NOT EXISTS rc_collective.counters (
  name  text PRIMARY KEY,
  value bigint NOT NULL DEFAULT 0
);
INSERT INTO rc_collective.counters (name, value) VALUES ('opted_out_total', 0)
  ON CONFLICT (name) DO NOTHING;
-- Early ghosts: went ghost before taking back the whole city, so their rows
-- were purged like an opt-out; only this count of them remains.
INSERT INTO rc_collective.counters (name, value) VALUES ('ghosts_early_total', 0)
  ON CONFLICT (name) DO NOTHING;
-- Sessions that sent their deleted data back (data-restored), all time.
INSERT INTO rc_collective.counters (name, value) VALUES ('restored_total', 0)
  ON CONFLICT (name) DO NOTHING;
CREATE TABLE IF NOT EXISTS rc_collective.runs (
  ran_at timestamptz NOT NULL DEFAULT now(),
  ok     boolean NOT NULL,
  detail text
);
