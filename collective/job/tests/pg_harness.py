"""Throwaway Postgres for the job's SQL tests.

Runs `postgres:18-alpine` in Docker, locally or on another host when
RC_TEST_SSH is set (e.g. RC_TEST_SSH="ssh -i ~/.ssh/hetzner_cto_tycoon root@204.168.205.161").
"""
import os
import shlex
import subprocess
import time
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
SQL_DIR = HERE.parent / "sql"
WEBSITE = "9a3e18e2-56a6-4b69-90af-d88db951b600"


class PgHarness:
    def __init__(self, name="rc-sqltest"):
        self.name = name
        self.ssh = shlex.split(os.environ.get("RC_TEST_SSH", ""))

    def _sh(self, args, stdin=None, check=True):
        cmd = self.ssh + [shlex.join(args)] if self.ssh else args
        r = subprocess.run(cmd, input=stdin, capture_output=True, text=True)
        if check and r.returncode != 0:
            raise RuntimeError(f"{args[:3]} failed: {r.stderr.strip()}")
        return r

    def start(self):
        self._sh(["docker", "rm", "-f", self.name], check=False)
        self._sh(["docker", "run", "-d", "--name", self.name,
                  "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_USER=umami",
                  "-e", "POSTGRES_DB=umami", "postgres:18-alpine"])
        for _ in range(60):
            if self._sh(["docker", "exec", self.name, "pg_isready", "-U", "umami"], check=False).returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError("postgres did not become ready")
        time.sleep(1)
        self.reset()

    def stop(self):
        self._sh(["docker", "rm", "-f", self.name], check=False)

    def sql(self, text, variables=None):
        args = ["docker", "exec", "-i", self.name, "psql", "-U", "umami", "-d", "umami",
                "-v", "ON_ERROR_STOP=1", "-qAt"]
        for k, v in (variables or {}).items():
            args += ["-v", f"{k}={v}"]
        return self._sh(args, stdin=text).stdout

    def run_files(self, *paths, variables=None, wrap_transaction=True):
        body = "\n".join(Path(p).read_text() for p in paths)
        if wrap_transaction:
            body = "BEGIN;\n" + body + "\nCOMMIT;\n"
        return self.sql(body, variables)

    def reset(self):
        self.sql("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS rc_collective CASCADE; CREATE SCHEMA public;")
        self.sql((HERE / "umami_min_schema.sql").read_text())
        self.sql((SQL_DIR / "schema.sql").read_text())

    def insert_session(self, country="US", region="US-IL", city="Chicago", website=WEBSITE):
        sid = str(uuid.uuid4())
        self.sql("INSERT INTO session (session_id, website_id, country, region, city) "
                 f"VALUES ('{sid}', '{website}', {q(country)}, {q(region)}, {q(city)});")
        return sid

    def insert_event(self, session_id, name, data=None, website=WEBSITE, at="now()"):
        eid = str(uuid.uuid4())
        stmts = [f"INSERT INTO website_event (event_id, website_id, session_id, event_name, created_at) "
                 f"VALUES ('{eid}', '{website}', '{session_id}', {q(name)}, {at});"]
        for k, v in (data or {}).items():
            stmts.append("INSERT INTO event_data (event_data_id, website_id, website_event_id, data_key, string_value) "
                         f"VALUES ('{uuid.uuid4()}', '{website}', '{eid}', {q(k)}, {q(v)});")
        self.sql("\n".join(stmts))
        return eid

    def count(self, table, session_id):
        col = "session_id"
        if table == "event_data":
            return int(self.sql(f"SELECT count(*) FROM event_data d JOIN website_event e ON e.event_id = d.website_event_id WHERE e.session_id = '{session_id}';").strip())
        return int(self.sql(f"SELECT count(*) FROM {table} WHERE {col} = '{session_id}';").strip())


def q(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"
