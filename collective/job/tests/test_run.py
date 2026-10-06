import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import run  # noqa: E402

NAMES = {"US": "United States", "US-IL": "Illinois", "GB": "United Kingdom", "account:gmail": "Gmail"}


class LabelTest(unittest.TestCase):
    def doc(self, *pods, by_address=()):
        return {"k": 50, "city": {"players": 100, "byAddress": list(by_address)}, "pods": list(pods)}

    def test_labels(self):
        doc = run.add_labels(self.doc(
            {"id": "us-il-chicago", "level": "city", "country": "US", "region": "US-IL", "city": "Chicago", "rest": False},
            {"id": "us-il-rest", "level": "region", "country": "US", "region": "US-IL", "rest": True},
            {"id": "gb", "level": "country", "country": "GB", "rest": False, "includesWorld": True},
            {"id": "us-rest", "level": "country", "country": "US", "rest": True},
            {"id": "fr", "level": "country", "country": "FR", "rest": False},
            {"id": "world-rest", "level": "world", "rest": True},
            by_address=[{"id": "gmail"}, {"id": "hotmail"}]), NAMES)
        labels = [p["label"] for p in doc["pods"]]
        self.assertEqual(labels, ["Chicago", "Rest of Illinois", "United Kingdom & the rest of the world",
                                  "Rest of United States", "FR", "Rest of the World"])
        self.assertEqual([a["label"] for a in doc["city"]["byAddress"]], ["Gmail", "hotmail"])

    def test_load_names(self):
        with tempfile.NamedTemporaryFile("w", suffix=".tsv", delete=False) as f:
            f.write("US\tUnited States\n\n# comment\nUS-IL\tIllinois\n")
        self.assertEqual(run.load_names(f.name), {"US": "United States", "US-IL": "Illinois"})


class WriteTest(unittest.TestCase):
    def test_write_atomic_replaces_and_leaves_no_temp(self):
        d = tempfile.mkdtemp()
        p = os.path.join(d, "collective.json")
        run.write_atomic(p, '{"a":1}')
        run.write_atomic(p, '{"a":2}')
        self.assertEqual(json.load(open(p)), {"a": 2})
        self.assertEqual(os.listdir(d), ["collective.json"])

    def test_validate_rejects_missing_city(self):
        with self.assertRaises(ValueError):
            run.validate({"k": 50, "pods": []})
        with self.assertRaises(ValueError):
            run.validate({"k": 50, "city": {}, "pods": "nope"})
        run.validate({"k": 50, "city": {}, "pods": []})

    def test_failed_run_keeps_previous_file(self):
        d = tempfile.mkdtemp()
        p = os.path.join(d, "collective.json")
        run.write_atomic(p, '{"previous":true}')
        code = run.main(["--out", p, "--names", os.devnull, "--dry-sql-output", "not json"], report=lambda m: None)
        self.assertEqual(code, 1)
        self.assertEqual(json.load(open(p)), {"previous": True})


class GlitchTipTest(unittest.TestCase):
    def test_payload_shape(self):
        body = run.glitchtip_payload("boom")
        self.assertEqual(body["level"], "error")
        self.assertEqual(body["logger"], "rc-collective-job")
        self.assertIn("boom", body["message"])

    def test_auth_header_from_dsn(self):
        url, header = run.glitchtip_endpoint("https://abc123@errors.multiversegames.ai/2")
        self.assertEqual(url, "https://errors.multiversegames.ai/api/2/store/")
        self.assertIn("sentry_key=abc123", header)


if __name__ == "__main__":
    unittest.main()
