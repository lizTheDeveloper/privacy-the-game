import json
import unittest
from pg_harness import PgHarness, SQL_DIR, WEBSITE, q

PG = PgHarness("rc-sqltest-2")
K = 50


def setUpModule():
    PG.start()


def tearDownModule():
    PG.stop()


def build(k=K):
    out = PG.run_files(SQL_DIR / "build.sql", variables={"website": WEBSITE, "k": k})
    lines = [l for l in out.splitlines() if l.startswith("{")]
    assert len(lines) == 1, out
    return json.loads(lines[0])


def players(n, country="US", region="US-IL", city="Chicago"):
    # One round trip for n sessions (per-row ssh inserts are too slow).
    out = PG.sql(
        "INSERT INTO session (session_id, website_id, country, region, city) "
        f"SELECT gen_random_uuid(), '{WEBSITE}', {q(country)}, {q(region)}, {q(city)} "
        f"FROM generate_series(1, {n}) RETURNING session_id;")
    return out.split()


def events(sids, name, data=None):
    """Bulk insert one event (with string data keys) per session in one round trip."""
    ids = ",".join(f"'{s}'" for s in sids)
    data = data or {}
    stmts = [
        "CREATE TEMP TABLE _ev AS SELECT gen_random_uuid() AS eid, s AS sid FROM unnest(ARRAY[" + ids + "]::uuid[]) s;",
        "INSERT INTO website_event (event_id, website_id, session_id, event_name, created_at) "
        f"SELECT eid, '{WEBSITE}', sid, {q(name)}, now() FROM _ev;",
    ]
    for k, v in data.items():
        stmts.append("INSERT INTO event_data (event_data_id, website_id, website_event_id, data_key, string_value) "
                     f"SELECT gen_random_uuid(), '{WEBSITE}', eid, {q(k)}, {q(v)} FROM _ev;")
    PG.sql("\n".join(stmts))


def pods_by_id(doc):
    return {p["id"]: p for p in doc["pods"]}


class PodTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def test_city_of_50_is_a_pod_49_rolls_up(self):
        players(50, city="Chicago")
        players(49, region="US-WA", city="Seattle")
        players(10, region="US-WA", city="Tacoma")
        doc = build()
        ids = pods_by_id(doc)
        self.assertIn("us-il-chicago", ids)
        self.assertNotIn("us-wa-seattle", ids)
        self.assertEqual(ids["us-wa"]["players"], 59)
        self.assertEqual(ids["us-wa"]["level"], "region")
        self.assertFalse(ids["us-wa"]["rest"])

    def test_rest_of_region_is_named_rest_and_parent_never_published(self):
        players(60, city="Chicago")
        players(55, city="Peoria")
        players(50, city="Springfield")  # its own pod
        players(51, city="Evanston")     # its own pod
        players(60, city="Naperville")   # its own pod
        players(30, city="Joliet")
        players(25, city="Elgin")        # 55 left over in US-IL
        doc = build()
        ids = pods_by_id(doc)
        self.assertIn("us-il-rest", ids)
        self.assertEqual(ids["us-il-rest"]["players"], 55)
        self.assertNotIn("us-il", ids)

    def test_pods_never_overlap_and_all_have_k(self):
        players(50, city="Chicago")
        players(70, region="US-WA", city="Seattle")
        players(30, region="US-WA", city="Tacoma")
        players(40, region="US-OR", city="Portland")
        players(45, region="US-NY", city="New York")
        players(20, country="CA", region="CA-ON", city="Toronto")
        players(40, country="GB", region="GB-ENG", city="London")
        players(30, country="DE", region="DE-BE", city="Berlin")
        doc = build()
        total = sum(p["players"] for p in doc["pods"])
        self.assertEqual(total, doc["city"]["players"])
        for p in doc["pods"]:
            self.assertGreaterEqual(p["players"], K, p["id"])

    def test_small_rest_of_world_folds_into_smallest_country_level_pod(self):
        players(120, city="Chicago")
        players(60, region="US-WA", city="Seattle")
        players(30, country="GB", region="GB-ENG", city="London")
        players(25, country="GB", region="GB-SCT", city="Glasgow")   # GB = 55 -> pod "gb"
        players(10, country="FR", region="FR-IDF", city="Paris")      # world-rest of 10 < K
        doc = build()
        ids = pods_by_id(doc)
        self.assertNotIn("world-rest", ids)
        self.assertEqual(ids["gb"]["players"], 65)
        self.assertTrue(ids["gb"]["includesWorld"])

    def test_empty_region_pools_into_country_never_empty_id(self):
        players(30, region="", city="")
        players(30, region="US-IL", city="Chicago")
        doc = build()
        for p in doc["pods"]:
            self.assertRegex(p["id"], r"^[a-z0-9]+(-[a-z0-9]+)*$")
        self.assertEqual(pods_by_id(doc)["us"]["players"], 60)

    def test_chosen_pod_overrides_geo_unknown_pod_ignored(self):
        chi = players(60, city="Chicago")
        players(60, region="US-WA", city="Seattle")
        mover, stray = chi[0], chi[1]
        PG.insert_event(mover, "mission-started", {"pod": "us-wa-seattle"})
        PG.insert_event(stray, "mission-started", {"pod": "atlantis"})
        doc = build()
        ids = pods_by_id(doc)
        self.assertEqual(ids["us-wa-seattle"]["players"], 61)
        self.assertEqual(ids["us-il-chicago"]["players"], 59)

    def test_cleared_choice_marker_auto_falls_back_to_geo_pod(self):
        chi = players(60, city="Chicago")
        players(60, region="US-WA", city="Seattle")
        mover = chi[0]
        PG.insert_event(mover, "mission-started", {"pod": "us-wa-seattle"})
        PG.insert_event(mover, "mission-started", {"pod": "auto"})  # later event: choice cleared
        doc = build()
        ids = pods_by_id(doc)
        self.assertEqual(ids["us-wa-seattle"]["players"], 60)
        self.assertEqual(ids["us-il-chicago"]["players"], 60)

    def test_cities_with_colliding_slugs_merge_into_one_pod(self):
        # Both spellings alone reach K, so the old per-name grouping would have
        # inserted the same id twice and aborted on the primary key.
        players(50, region="US-MO", city="St. Louis")
        players(50, region="US-MO", city="St Louis")
        doc = build()
        matching = [p for p in doc["pods"] if p["id"] == "us-mo-st-louis"]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["players"], 100)

    def test_pod_below_k_after_moves_publishes_no_figures(self):
        chi = players(50, city="Chicago")
        players(60, region="US-WA", city="Seattle")
        PG.insert_event(chi[0], "mission-started", {"pod": "us-wa-seattle"})
        doc = build()
        chicago = pods_by_id(doc)["us-il-chicago"]
        for key in ("players", "fortified", "breachRatePct", "actions", "ghosts"):
            self.assertNotIn(key, chicago)


class TotalsTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def breach(self, sids, acct, finding):
        events(sids, "mission-completed",
               {"mission": f"{acct}-recon-breach", "finding": finding, "status": "completed"})

    def fix(self, sids, acct, kind="password"):
        events(sids, "mission-completed", {"mission": f"{acct}-fortify-{kind}", "status": "completed"})

    def test_fortified_counts_breached_accounts_fixed_by_password_or_2fa(self):
        sids = players(60)
        self.breach(sids[0::2], "gmail", "1-2-breaches")
        self.breach(sids[1::2], "gmail", "3plus-breaches")
        self.fix(sids[:15], "gmail", "password")
        self.fix(sids[15:20], "gmail", "2fa")
        self.fix(sids[:5], "gmail", "2fa")  # both: still one fixed account
        doc = build()
        self.assertEqual(doc["city"]["fortified"], {"pct": 33, "fixed": 20, "breached": 60})
        self.assertEqual(doc["city"]["breachRatePct"], 100)
        self.assertEqual(doc["city"]["breach3PlusPct"], 50)

    def test_skip_answers_are_not_checks(self):
        sids = players(60)
        self.breach(sids, "gmail", "no-breaches")
        self.breach(sids[:10], "yahoo", "skip")
        doc = build()
        self.assertEqual(doc["city"]["breachChecks"], 60)
        self.assertEqual(doc["city"]["breachRatePct"], 0)

    def test_figures_under_k_are_absent_not_zero(self):
        sids = players(60)
        self.breach(sids[:10], "gmail", "1-2-breaches")
        doc = build()
        self.assertNotIn("fortified", doc["city"])
        self.assertNotIn("breachRatePct", doc["city"])
        self.assertEqual(doc["city"]["players"], 60)

    def test_by_address_only_for_types_with_k_checks(self):
        sids = players(60)
        self.breach(sids, "gmail", "3plus-breaches")
        self.breach(sids[:20], "protonmail", "no-breaches")
        doc = build()
        ids = [a["id"] for a in doc["city"]["byAddress"]]
        self.assertEqual(ids, ["gmail"])
        self.assertEqual(doc["city"]["byAddress"][0]["breachRatePct"], 100)
        for entry in doc["city"]["byAddress"]:
            self.assertEqual(set(entry), {"id", "breachRatePct"})

    def test_actions_districts_ghosts_optouts(self):
        sids = players(60)
        events(sids, "mission-completed", {"mission": "gmail-recon-login", "status": "completed"})
        events(sids, "mission-completed", {"mission": "gmail-recon-breach", "status": "skipped", "finding": "skip"})
        events(sids[:3], "district-completed", {"district": "master-keys"})
        PG.insert_event(sids[0], "went-ghost")
        PG.insert_event(sids[0], "went-ghost")
        PG.sql("UPDATE rc_collective.counters SET value = 7 WHERE name = 'opted_out_total';")
        doc = build()
        self.assertEqual(doc["city"]["actions"], 60)
        self.assertEqual(doc["city"]["districts"], 3)
        self.assertEqual(doc["city"]["ghosts"], 1)
        self.assertEqual(doc["city"]["optedOut"], 7)

    def test_city_ghosts_are_kept_ghosts_plus_early_ghosts(self):
        sids = players(60)
        events(sids[:4], "went-ghost")
        PG.sql("UPDATE rc_collective.counters SET value = 9 WHERE name = 'ghosts_early_total';")
        doc = build()
        self.assertEqual(doc["city"]["ghosts"], 13)
        self.assertEqual(pods_by_id(doc)["us-il-chicago"]["ghosts"], 4)  # pods: kept ghosts only

    def test_restored_mission_events_count_in_actions(self):
        sids = players(60)
        events(sids, "mission-completed", {"mission": "gmail-recon-login", "status": "completed", "restored": "1"})
        events(sids[:2], "district-completed", {"district": "master-keys", "restored": "1"})
        doc = build()
        self.assertEqual(doc["city"]["actions"], 60)
        self.assertEqual(doc["city"]["districts"], 2)



class PurgeThenBuildTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def test_opted_out_players_vanish_from_totals_and_count_once(self):
        sids = players(60)
        PG.insert_event(sids[0], "opted-out")
        out = PG.run_files(SQL_DIR / "purge.sql", SQL_DIR / "purge_mig.sql", SQL_DIR / "build.sql",
                           variables={"website": WEBSITE, "k": K})
        doc = json.loads([l for l in out.splitlines() if l.startswith("{")][0])
        self.assertEqual(doc["city"]["players"], 59)
        self.assertEqual(doc["city"]["optedOut"], 1)

    def test_early_ghost_leaves_the_totals_and_joins_the_ghost_count(self):
        sids = players(61)
        events(sids, "mission-completed", {"mission": "gmail-recon-login", "status": "completed"})
        PG.insert_event(sids[0], "went-ghost-early")
        PG.insert_event(sids[1], "went-ghost")
        out = PG.run_files(SQL_DIR / "purge.sql", SQL_DIR / "purge_mig.sql", SQL_DIR / "build.sql",
                           variables={"website": WEBSITE, "k": K})
        doc = json.loads([l for l in out.splitlines() if l.startswith("{")][0])
        self.assertEqual(doc["city"]["players"], 60)
        self.assertEqual(doc["city"]["actions"], 60)
        self.assertEqual(doc["city"]["ghosts"], 2)
        self.assertEqual(doc["city"]["optedOut"], 0)


class NoResidualTest(unittest.TestCase):
    """City figure minus the sum of published pod figures must never reveal a suppressed pod."""

    def setUp(self):
        PG.reset()

    def test_city_equals_sum_of_pods_that_publish_the_figure(self):
        chi = players(50, city="Chicago")
        sea = players(60, region="US-WA", city="Seattle")
        pdx = players(70, region="US-OR", city="Portland")
        den = players(80, region="US-CO", city="Denver")
        # One Chicagoan moves to Seattle: Chicago (49) drops under K and publishes nothing.
        events([chi[0]], "mission-started", {"pod": "us-wa-seattle"})
        def breach(sids, finding):
            events(sids, "mission-completed",
                   {"mission": "gmail-recon-breach", "finding": finding, "status": "completed"})
        def fix(sids):
            events(sids, "mission-completed", {"mission": "gmail-fortify-password", "status": "completed"})
        breach(chi, "1-2-breaches")                       # includes the mover (lands in Seattle)
        fix(chi[:30])
        breach(sea, "3plus-breaches")
        fix(sea[:10])
        breach(pdx[:25], "no-breaches")                   # Portland: 55 checks (>=K) but only 30 breached (<K)
        breach(pdx[25:55], "1-2-breaches")
        fix(pdx[25:35])
        breach(den[:60], "1-2-breaches")
        fix(den[:20])
        events(chi[:5] + sea[:3] + den[:2], "district-completed", {"district": "master-keys"})
        events(chi[:2] + pdx[:2] + den[:1], "went-ghost")
        doc = build()
        by = pods_by_id(doc)
        self.assertNotIn("players", by["us-il-chicago"])
        self.assertNotIn("fortified", by["us-or-portland"])
        self.assertIn("breachChecks", by["us-or-portland"])
        self.assertEqual(doc["city"]["players"], 61 + 70 + 80)
        for key in ("players", "actions", "districts", "ghosts", "breachChecks"):
            self.assertEqual(doc["city"][key], sum(p[key] for p in doc["pods"] if key in p), key)
        for key in ("fixed", "breached"):
            self.assertEqual(doc["city"]["fortified"][key],
                             sum(p["fortified"][key] for p in doc["pods"] if "fortified" in p), key)
        self.assertGreater(doc["city"]["fortified"]["breached"], 0)


class RunnerScriptTest(unittest.TestCase):
    def setUp(self):
        PG.reset()

    def test_runner_script_runs_with_and_without_mig_tables(self):
        import sys
        sys.path.insert(0, str(SQL_DIR.parent))
        import run
        players(60)
        out = PG.sql(run.sql_script(), variables={"website": WEBSITE, "k": K})
        self.assertEqual(len([l for l in out.splitlines() if l.startswith("{")]), 1)
        PG.sql("DROP TABLE _rc_mig_event_data, _rc_mig_events, _rc_mig_sessions;")
        out = PG.sql(run.sql_script(), variables={"website": WEBSITE, "k": K})
        self.assertEqual(len([l for l in out.splitlines() if l.startswith("{")]), 1)

    def test_failed_build_still_commits_the_purge(self):
        import sys
        from pathlib import Path
        sys.path.insert(0, str(SQL_DIR.parent))
        import run
        sid = PG.insert_session()
        PG.insert_event(sid, "mission-started")
        PG.insert_event(sid, "opted-out")
        real = Path.read_text
        Path.read_text = lambda self, *a, **kw: "SELECT 1/0;" if self.name == "build.sql" else real(self, *a, **kw)
        try:
            script = run.sql_script()
        finally:
            Path.read_text = real
        with self.assertRaises(RuntimeError):
            PG.sql(script, variables={"website": WEBSITE, "k": K})
        self.assertEqual(PG.count("session", sid), 0)
        self.assertEqual(PG.count("website_event", sid), 0)
        self.assertEqual(int(PG.sql("SELECT value FROM rc_collective.counters WHERE name = 'opted_out_total';").strip()), 1)


if __name__ == "__main__":
    unittest.main()
