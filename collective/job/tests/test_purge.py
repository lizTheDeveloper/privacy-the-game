import unittest
from pg_harness import PgHarness, SQL_DIR, WEBSITE

PG = PgHarness("rc-sqltest-1")


def setUpModule():
    PG.start()


def tearDownModule():
    PG.stop()


class PurgeTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def purge(self):
        PG.run_files(SQL_DIR / "purge.sql", SQL_DIR / "purge_mig.sql", variables={"website": WEBSITE})

    def counter(self):
        return int(PG.sql("SELECT value FROM rc_collective.counters WHERE name = 'opted_out_total';").strip())

    def test_opted_out_session_is_gone_from_every_table(self):
        sid = PG.insert_session()
        PG.insert_event(sid, "mission-completed", {"mission": "gmail-recon-breach", "finding": "3plus-breaches"})
        PG.insert_event(sid, "opted-out")
        PG.sql(f"INSERT INTO session_data (session_data_id, website_id, session_id, data_key) VALUES (gen_random_uuid(), '{WEBSITE}', '{sid}', 'k');")
        PG.sql(f"INSERT INTO revenue VALUES (gen_random_uuid(), '{WEBSITE}', '{sid}');")
        PG.sql(f"INSERT INTO session_replay VALUES (gen_random_uuid(), '{WEBSITE}', '{sid}');")
        PG.sql(f"INSERT INTO _rc_mig_sessions SELECT * FROM session WHERE session_id = '{sid}';")
        PG.sql(f"INSERT INTO _rc_mig_events SELECT * FROM website_event WHERE session_id = '{sid}';")
        PG.sql("INSERT INTO _rc_mig_event_data SELECT * FROM event_data;")
        self.purge()
        for table in ("session", "website_event", "event_data", "session_data", "revenue", "session_replay",
                      "_rc_mig_sessions", "_rc_mig_events"):
            self.assertEqual(PG.count(table, sid), 0, table)
        self.assertEqual(int(PG.sql("SELECT count(*) FROM _rc_mig_event_data;").strip()), 0)

    def test_counter_rises_by_sessions_not_events(self):
        a = PG.insert_session()
        b = PG.insert_session()
        PG.insert_event(a, "opted-out")
        PG.insert_event(a, "opted-out")  # double click
        PG.insert_event(b, "opted-out")
        self.purge()
        self.assertEqual(self.counter(), 2)
        self.purge()  # nothing left to purge: counter must not move
        self.assertEqual(self.counter(), 2)

    def test_other_sessions_and_ghosts_are_untouched(self):
        keep = PG.insert_session()
        ghost = PG.insert_session()
        PG.insert_event(keep, "mission-completed", {"mission": "gmail-recon-breach"})
        PG.insert_event(ghost, "went-ghost")
        self.purge()
        self.assertEqual(PG.count("website_event", keep), 1)
        self.assertEqual(PG.count("event_data", keep), 1)
        self.assertEqual(PG.count("website_event", ghost), 1)
        self.assertEqual(self.counter(), 0)

    def test_other_websites_are_never_touched(self):
        other = "00000000-0000-0000-0000-000000000001"
        sid = PG.insert_session(website=other)
        PG.insert_event(sid, "opted-out", website=other)
        self.purge()
        self.assertEqual(PG.count("session", sid), 1)
        self.assertEqual(self.counter(), 0)


if __name__ == "__main__":
    unittest.main()
