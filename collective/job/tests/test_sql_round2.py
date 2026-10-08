# Breaker round 2, unrun SQL cases (copy next to test_build.py to run).
#
# Hole: an unsplit pair where both accounts' latest checks carry the SAME
# created_at (a restore resends a whole save in one burst; Umami stamps
# milliseconds, and a bulk insert or a retried batch can share one).
# build.sql orders rc_checks by "at DESC, event_id DESC", and event_id is a
# random uuid, so which answer the address publishes under is arbitrary: the
# same save can publish a breached address in one run and a clean one in the
# next. The local side (calc.js addressChecks) deliberately breaks such a tie
# by taking the more severe answer, and the ledger says so ("more severe when
# there's no time to tell them apart"). Expected here: the address is
# breached, whichever account's event has the larger uuid. Both orders are
# built so one of them fails whatever the uuids happen to be.
import unittest
from test_build import PG, build, players, events


def setUpModule():
    PG.start()


def tearDownModule():
    PG.stop()


class SameInstantPairTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def _tie(self, first, second, first_finding, second_finding):
        sids = players(60)
        at = "timestamptz '2026-10-01 12:00:00+00'"
        events(sids, "mission-completed",
               {"mission": f"{first}-recon-breach", "finding": first_finding, "status": "completed"}, at=at)
        events(sids, "mission-completed",
               {"mission": f"{second}-recon-breach", "finding": second_finding, "status": "completed"}, at=at)
        return build()["city"]

    def test_tie_prefers_the_more_severe_answer_first_account_clean(self):
        city = self._tie("gmail", "google", "no-breaches", "3plus-breaches")
        self.assertEqual(city["breachChecks"], 60)
        self.assertEqual(city["breachRatePct"], 100)

    def test_tie_prefers_the_more_severe_answer_second_account_clean(self):
        city = self._tie("gmail", "google", "3plus-breaches", "no-breaches")
        self.assertEqual(city["breachChecks"], 60)
        self.assertEqual(city["breachRatePct"], 100)


if __name__ == "__main__":
    unittest.main()
