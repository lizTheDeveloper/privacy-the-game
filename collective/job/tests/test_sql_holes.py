# Phase 3 breaker's SQL hole, moved here from tests/breaker-phase3/ and run
# on the CI VM with test_build (the assertions are unedited).
#
# Hole (promise 1, build.sql rc_breached): a Google / Apple ID / Microsoft
# account the player said is a DIFFERENT address is its own address, "fixed
# only by its own reset or 2FA" (the Phase 3 ruling, and
# test_different_address_is_fixed_only_by_its_own_account covers gmail's reset
# NOT fixing google). The rule is not symmetric. For the first account of the
# pair (gmail), rc_checks sets separate = false, so rc_breached uses
# rc_members('gmail') = ['gmail', 'google'] and counts a completed
# google-fortify-password / -2fa as fixing the GMAIL address, even though the
# player said google is another address. A player with a breached Gmail who
# resets only their other Google address's password is published as "fixed".
# Expected here: the breached gmail address is not fixed (fixed = 0 of 60).
# Same for apple_id/icloud and microsoft/outlook.
import unittest
from test_build import PG, build, players, events


def setUpModule():
    PG.start()


def tearDownModule():
    PG.stop()


class SeparateAddressFixTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def _pair(self, first, second):
        sids = players(60)
        events(sids, "mission-completed",
               {"mission": f"{first}-recon-breach", "finding": "3plus-breaches", "status": "completed"})
        events(sids, "mission-completed",
               {"mission": f"{second}-recon-breach", "finding": "no-breaches",
                "status": "completed", "same_address": "different-address"})
        # The player resets only the password of the OTHER address.
        events(sids, "mission-completed", {"mission": f"{second}-fortify-password", "status": "completed"})
        return build()["city"]

    def test_google_reset_does_not_fix_a_breached_gmail_when_google_is_a_different_address(self):
        city = self._pair("gmail", "google")
        self.assertEqual(city["fortified"], {"pct": 0, "fixed": 0, "breached": 60})

    def test_apple_id_reset_does_not_fix_a_breached_icloud_when_it_is_a_different_address(self):
        city = self._pair("icloud", "apple_id")
        self.assertEqual(city["fortified"], {"pct": 0, "fixed": 0, "breached": 60})

    def test_microsoft_reset_does_not_fix_a_breached_outlook_when_it_is_a_different_address(self):
        city = self._pair("outlook", "microsoft")
        self.assertEqual(city["fortified"], {"pct": 0, "fixed": 0, "breached": 60})


if __name__ == "__main__":
    unittest.main()
