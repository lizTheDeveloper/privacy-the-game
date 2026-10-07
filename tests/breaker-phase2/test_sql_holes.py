# NOT RUN by the breaker (the SQL suites need the CI VM). Written in the style
# of collective/job/tests/test_build.py; drop it next to that file to run it.
#
# Hole (promise 1): rc_checks is one row per mission-completed EVENT, with no
# DISTINCT on (session, acct). One player whose email check was sent live and
# again by restore.js (restored=1), or who refiled it, counts twice in
# breachChecks, and a refile with a different answer counts both answers in
# breachRatePct and byAddress. rc_done, a few lines below, already collapses
# repeats ("a mission sent twice by one session counts once"); the breach
# figures do not. The test expects one check per player and acct (the latest
# answer is not knowable in SQL without created_at, so the assertion is on the
# count, which must equal the number of players).
import unittest
from test_build import PG, build, players, events


class DuplicateEventsTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def test_a_check_sent_twice_by_one_player_counts_once(self):
        sids = players(60)
        for restored in (None, "1"):
            data = {"mission": "gmail-recon-breach", "finding": "1-2-breaches", "status": "completed"}
            if restored:
                data["restored"] = restored
            events(sids, "mission-completed", data)
        city = build()["city"]
        self.assertEqual(city["breachChecks"], 60)
        self.assertEqual(city["breachRatePct"], 100)
        self.assertEqual([a["id"] for a in city["byAddress"]], ["gmail"])


if __name__ == "__main__":
    unittest.main()
