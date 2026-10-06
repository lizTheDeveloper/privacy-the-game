#!/usr/bin/env python3
"""Nightly Reclaim City collective-score job.

In one transaction: purge opted-out sessions, then build totals. Then label the
result and atomically replace collective.json. Any failure leaves yesterday's
file in place, records the failed run, reports to GlitchTip, and exits 1 so it
shows in `systemctl --failed`.
"""
import argparse
import datetime
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = "9a3e18e2-56a6-4b69-90af-d88db951b600"
K = 50
PSQL = ["docker", "exec", "-i", "game-db", "psql", "-U", "umami", "-d", "umami", "-v", "ON_ERROR_STOP=1", "-qAt"]


def load_names(path):
    names = {}
    for line in Path(path).read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        code, _, name = line.partition("\t")
        if name:
            names[code.strip()] = name.strip()
    return names


def _pod_label(p, names):
    level = p.get("level")
    if level == "city":
        label = p.get("city") or p["id"]
    elif level == "region":
        label = names.get(p.get("region"), p.get("region") or p["id"])
    elif level == "country":
        label = names.get(p.get("country"), p.get("country") or p["id"])
    else:
        return "Rest of the World"
    if p.get("rest"):
        label = "Rest of " + label
    if p.get("includesWorld"):
        label += " & the rest of the world"
    return label


def add_labels(doc, names):
    for p in doc.get("pods", []):
        p["label"] = _pod_label(p, names)
    for a in doc.get("city", {}).get("byAddress", []):
        a["label"] = names.get("account:" + a["id"], a["id"])
    return doc


def validate(doc):
    if not isinstance(doc, dict) or not isinstance(doc.get("city"), dict):
        raise ValueError("collective doc has no city object")
    if not isinstance(doc.get("pods"), list):
        raise ValueError("collective doc pods is not a list")
    if doc.get("k") != K:
        raise ValueError(f"collective doc k={doc.get('k')!r}, expected {K}")


def write_atomic(path, text):
    d = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".collective-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def sql_script():
    """schema + purge + build in one transaction. The _rc_mig_* backups may be
    dropped one day; their purge runs only while the tables exist."""
    sql = lambda name: (HERE / "sql" / name).read_text()
    return ("SELECT to_regclass('public._rc_mig_events') IS NOT NULL AS has_mig \\gset\n"
            "BEGIN;\n" + sql("schema.sql") + "\n" + sql("purge.sql") + "\n"
            "\\if :has_mig\n" + sql("purge_mig.sql") + "\n\\endif\n"
            + sql("build.sql") + "\nCOMMIT;\n")


def run_sql():
    r = subprocess.run(PSQL + ["-v", f"website={WEBSITE}", "-v", f"k={K}"],
                       input=sql_script(), capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise RuntimeError("psql failed: " + r.stderr.strip()[-2000:])
    return r.stdout


def record_run(ok, detail):
    detail = detail.replace("'", "''")[:2000]
    subprocess.run(PSQL, input=f"INSERT INTO rc_collective.runs (ok, detail) VALUES ({'true' if ok else 'false'}, '{detail}');",
                   capture_output=True, text=True, timeout=60)


def refresh_geo(dest_dir):
    """Keep our GeoLite copy identical to the one Umami uses."""
    os.makedirs(dest_dir, exist_ok=True)
    tmp = os.path.join(dest_dir, ".GeoLite2-City.mmdb.tmp")
    r = subprocess.run(["docker", "cp", "umami:/app/geo/GeoLite2-City.mmdb", tmp], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("could not copy GeoLite db from umami: " + r.stderr.strip())
    os.chmod(tmp, 0o644)
    os.replace(tmp, os.path.join(dest_dir, "GeoLite2-City.mmdb"))


def glitchtip_endpoint(dsn):
    proto, rest = dsn.split("://", 1)
    key, hostpath = rest.split("@", 1)
    host, project = hostpath.rsplit("/", 1)
    header = f"Sentry sentry_version=7, sentry_key={key}, sentry_client=rc-collective-job/1.0"
    return f"{proto}://{host}/api/{project}/store/", header


def glitchtip_payload(message):
    return {"message": f"rc-collective nightly job failed: {message}", "level": "error",
            "logger": "rc-collective-job", "platform": "python", "tags": {"component": "nightly-job"}}


def report_glitchtip(message):
    dsn = os.environ.get("GLITCHTIP_DSN")
    if not dsn:
        print("GLITCHTIP_DSN not set; not reporting", file=sys.stderr)
        return
    url, header = glitchtip_endpoint(dsn)
    req = urllib.request.Request(url, data=json.dumps(glitchtip_payload(message)).encode(),
                                 headers={"Content-Type": "application/json", "X-Sentry-Auth": header})
    try:
        urllib.request.urlopen(req, timeout=15).read()
    except Exception as e:  # reporting must never mask the original failure
        print(f"GlitchTip report failed: {e}", file=sys.stderr)


def main(argv=None, report=report_glitchtip):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/opt/reclaim-city-collective/public/collective.json")
    ap.add_argument("--names", default=str(HERE / "names.tsv"))
    ap.add_argument("--geo-dir", default="/opt/reclaim-city-collective/geo")
    ap.add_argument("--dry-sql-output", help=argparse.SUPPRESS)  # tests: skip Docker, use this as psql output
    args = ap.parse_args(argv)
    try:
        out = args.dry_sql_output if args.dry_sql_output is not None else run_sql()
        lines = [l for l in out.splitlines() if l.startswith("{")]
        if len(lines) != 1:
            raise ValueError(f"expected one JSON line from build.sql, got {len(lines)}")
        doc = json.loads(lines[0])
        validate(doc)
        doc["asOf"] = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        add_labels(doc, load_names(args.names))
        write_atomic(args.out, json.dumps(doc, separators=(",", ":"), ensure_ascii=False))
        if args.dry_sql_output is None:
            refresh_geo(args.geo_dir)
            record_run(True, f"players={doc['city'].get('players')} pods={len(doc['pods'])}")
        print(f"ok: {len(doc['pods'])} pods, asOf {doc['asOf']}")
        return 0
    except Exception as e:
        msg = f"{type(e).__name__}: {e}"
        print(msg, file=sys.stderr)
        if args.dry_sql_output is None:
            record_run(False, msg)
        report(msg)
        return 1


if __name__ == "__main__":
    sys.exit(main())
