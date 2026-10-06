# Reclaim City collective score

A nightly job that turns Reclaim City's analytics events into one public file, `collective.json`: how players in a place are doing, together. No number is published for a group smaller than K.

## What the job does

`job/run.py` does two things inside one database transaction, so a failure rolls back both:

1. **Purge.** Deletes the rows of every session that sent an `opted-out` event this month (`purge.sql`), and the same sessions' rows in the `_rc_mig_*` migration backup tables while those tables exist (`purge_mig.sql`).
2. **Build.** Computes the totals (`build.sql`) and prints one JSON line.

The runner then adds `asOf` (UTC time) and a human-readable `label` to every pod and every address entry (names come from `job/names.tsv`; unknown codes fall back to the code or id), and replaces `collective.json` atomically. It also refreshes the GeoLite copy in `geo/` from the Umami container, so the lookup service uses the same database Umami does.

## K and pods

K is 50. A pod is a place: a city, a region, a country, or "rest of" a larger place. A pod is published only if it has at least K players; smaller places are folded into the "Rest of ..." pod above them, and the last remainder into "Rest of the World". City figures are counted only over places (pods) where that figure is published, so no published number can be subtracted from another to reveal a group under 50.

## Opting out

- Opting out deletes this device's rows for the current month from the analytics database, including the `_rc_mig_*` migration backups. Hetzner's automatic server backups of the games box (daily, about a week kept) still hold those rows until they roll over.
- Anyone can send an `opted-out` event. Umami derives the session from the sender's own IP and browser, so a forged event only purges the sender's own session (or others sharing the same IP and browser, whom Umami already treats as one). It can inflate the opt-out count.

## Files on the box

All under `/opt/reclaim-city-collective/`:

- `job/` - the code (copied by `install.sh`; tests and systemd units are not copied here)
- `public/collective.json` - the published file
- `geo/GeoLite2-City.mmdb` - GeoLite copy used by the `rc-collective` service
- `job.env` - environment for the job (`GLITCHTIP_DSN`), mode 600

The systemd units `rc-collective-job.service` and `rc-collective-job.timer` live in `/etc/systemd/system/`. The timer runs the service nightly at 04:00 UTC.

## Running tests

Unit tests need no Docker:

    cd collective/job && python3 -m unittest discover -s tests -p 'test_run.py' -v

The SQL tests run Postgres in a throwaway container on the CI VM:

    cd collective/job/tests && RC_TEST_SSH="ssh -i $HOME/.ssh/hetzner_cto_tycoon root@204.168.205.161" python3 -m unittest -v

## Running once

    ssh games systemctl start rc-collective-job
    ssh games journalctl -u rc-collective-job -n 20

Install or update with `collective/job/install.sh`, then `systemctl enable --now rc-collective-job.timer`.

## What a failure looks like

- The unit shows as failed in `systemctl --failed` (the script exits 1).
- Yesterday's `collective.json` is still being served; it is never partially overwritten. The GeoLite copy is refreshed before the new file is published, so a failure there also leaves yesterday's file in place.
- A GlitchTip event with logger `rc-collective-job`.
- A row with `ok = false` and the error in `rc_collective.runs` (best effort: if the database itself is unreachable, the row cannot be written, but the GlitchTip event and the failed unit still appear).

## The rc-collective service

A small service (added separately) reads `public/collective.json` and `geo/GeoLite2-City.mmdb` and exposes two routes. See its own directory for details.
