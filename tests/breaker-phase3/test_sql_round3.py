# Breaker phase 3 round 3's SQL cases, UNRUN (written, not executed). To run:
# copy next to collective/job/tests/test_build.py and run on the CI VM.
#
# Case 1 is a believed hole (low severity); case 2 pins the residual rule
# against the new "latest filing" counts and is expected to pass.
import unittest
from test_build import PG, build, players, events


def setUpModule():
    PG.start()


def tearDownModule():
    PG.stop()


class LatestFilingEdgeTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    # Hole: rc_latest orders a same-instant tie by "(status = 'completed') DESC".
    # For an event with no status key, status is NULL, the comparison is NULL,
    # and in Postgres NULL sorts FIRST under DESC. A status-less event (the app
    # sent none before `status` was added, and any malformed or third-party
    # event) beats a completed filing at the same created_at, and the mission
    # stops counting as done: the opposite of the documented "on a same-instant
    # tie, completed wins". Expected: the completed filing wins (fixed 60 of
    # 60). Fix: (coalesce(status, '') = 'completed') DESC, or NULLS LAST.
    def test_a_status_less_event_never_beats_a_completed_one_at_the_same_instant(self):
        sids = players(60)
        at = "timestamptz '2026-10-01 12:00:00+00'"
        events(sids, "mission-completed", {"mission": "gmail-recon-breach", "finding": "1-2-breaches",
                                           "status": "completed"}, at=at)
        events(sids, "mission-completed", {"mission": "gmail-fortify-password", "status": "completed"}, at=at)
        events(sids, "mission-completed", {"mission": "gmail-fortify-password"}, at=at)   # no status key
        city = build()["city"]
        self.assertEqual(city["fortified"]["fixed"], 60)

    # Residual rule: a refile to skipped can drop a pod under k. The pod then
    # stops publishing `passwords`, and the city must drop that pod's players
    # too (city minus the pods never reveals the suppressed one). Chicago has 60
    # players, 50 with a completed password reset; one refiles as skipped, so 49
    # are left. Seattle has 60 players, 55 with one. Expected: Chicago has no
    # `passwords`, the city counts Seattle's 55 only.
    def test_a_refile_that_drops_a_pod_under_k_removes_it_from_the_city_too(self):
        chi = players(60, region="US-IL", city="Chicago")
        sea = players(60, region="US-WA", city="Seattle")
        events(chi[:50], "mission-completed", {"mission": "gmail-fortify-password", "status": "completed"},
               at="now() - interval '1 hour'")
        events(chi[:1], "mission-completed", {"mission": "gmail-fortify-password", "status": "skipped"})
        events(sea[:55], "mission-completed", {"mission": "gmail-fortify-password", "status": "completed"})
        doc = build()
        chicago = next(p for p in doc["pods"] if p.get("city") == "Chicago")
        self.assertNotIn("passwords", chicago)
        self.assertEqual(doc["city"]["passwords"], 55)


if __name__ == "__main__":
    unittest.main()
