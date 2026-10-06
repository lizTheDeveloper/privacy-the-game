# Reclaim City collective score

A nightly job that turns Reclaim City's analytics events into one public file, `collective.json`: how players in a place are doing, together. No number is published for a group smaller than K.

## What the job does

`job/run.py` does two things, each in its own database transaction (one psql run). The purge commits first, so deleting opted-out sessions never depends on the build succeeding:

1. **Purge.** Deletes the rows of every session this month that opted out or went ghost early and did not cancel (`purge.sql`, see below), and the same sessions' rows in the `_rc_mig_*` migration backup tables while those tables exist (`purge_mig.sql`). Before that it applies any `data-restored` events (see "Bringing data back").
2. **Build.** Computes the totals (`build.sql`) and prints one JSON line.

The runner then adds `asOf` (UTC time) and a human-readable `label` to every pod and every address entry (names come from `job/names.tsv`; unknown codes fall back to the code or id), and replaces `collective.json` atomically. It also refreshes the GeoLite copy in `geo/` from the Umami container, so the lookup service uses the same database Umami does.

## K and pods

K is 50. A pod is a place: a city, a region, a country, or "rest of" a larger place. A pod is published only if it has at least K players; smaller places are folded into the "Rest of ..." pod above them, and the last remainder into "Rest of the World". City figures are counted only over places (pods) where that figure is published, so no published number can be subtracted from another to reveal a group under 50.

## Going ghost

There are two kinds of ghost, and both switch analytics off in the game:

- **Final-mission ghosts** take back the whole city first, then send `went-ghost`. Nothing is deleted: what they did stays in the totals, and they are counted from their kept `went-ghost` event (city figure over published pods only, like every other city figure; pods publish `ghosts` too).
- **Early ghosts** go ghost before that and send `went-ghost-early`. Tonight's run deletes the session exactly like an opt-out and adds one to the `ghosts_early_total` counter. `city.ghosts` = kept ghosts + `ghosts_early_total`; pod `ghosts` count kept ghosts only (an early ghost's rows, and so their place, are gone). An early ghost who also opted out counts once, as an opt-out.

## Cancelling before the run

Both deletions can be called off until the nightly run, but only from the browser that asked for them:

- When a player turns sharing off (`opted-out`) or goes ghost early (`went-ghost-early`), the game makes a random nonce (16 bytes, `crypto.getRandomValues`), keeps it in that browser, and sends it as event data `nonce`. Its cancel (`opt-out-cancelled` / `ghost-cancelled`) carries the same nonce.
- A session is purged if it has any deletion event whose nonce has no matching cancel of the same kind. Order and timestamps don't matter. A deletion sent without a nonce (older clients) can never be cancelled.
- Umami's session is IP + browser + monthly salt, so people sharing a connection with identical browsers share a session. One person's cancel carries their own nonce and cannot undo another's deletion: shared sessions fail safe (purged).
- Turning sharing back on while an opt-out is pending sends `opt-out-cancelled`; the game waits for `collective.json` first, because its `asOf` decides whether the deletion is still pending (it counts as done only if `asOf` is more than 10 minutes after the deletion, to allow for clock skew).

## Bringing data back

After a deletion went through, the player's browser still holds their whole saved game, and they can send it again:

- The game sends `data-restored` with `kind` = `opted-out` or `ghost-early`, then one `mission-completed` per completed or skipped mission and one `district-completed` per finished district, each with `restored: '1'`. Those restored events are ordinary rows and count in the totals as usual. They arrive in whatever Umami session the browser has now (the same session as before on the same connection in the same month, otherwise a new one); their timestamps are the restore time, not when the mission was played.
- If both an opt-out and an early ghost were deleted, the game sends only `kind: opted-out`, matching how the job counted that person (once, as an opt-out).
- The next run takes one off the matching counter (`opted_out_total` or `ghosts_early_total`) per distinct session that sent `data-restored` with that kind, never below zero, then deletes the `data-restored` events so they are counted once.
- Anyone can send `data-restored`, like `opted-out`: a scripted sender could lower the published opt-out or ghost counts (never below zero), but cannot touch anyone else's data.

## Opting out

- Opting out deletes the rows this browser sent this month from the connection it's on now (Umami's session is the sender's IP, browser and a monthly salt, so that is what the job can find) from the analytics database, including the `_rc_mig_*` migration backups. Hetzner's automatic server backups of the games box (daily, about a week kept) still hold those rows until they roll over.
- Anyone can send an `opted-out` (or `went-ghost-early`) event. Umami derives the session from the sender's own IP and browser, so a forged event only purges the sender's own session (or others sharing the same IP and browser, whom Umami already treats as one). It can inflate the opt-out count.

- `/whoami` (like Umami) trusts client-supplied IP and geo headers: `cf-connecting-ip`, `true-client-ip`, the first hop of `x-forwarded-for`, and provider geo headers. Spoofing them only changes the caller's own echo.

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
- If the build fails, the purge has already committed (it runs in its own transaction before the build), so opted-out sessions are deleted even on a failed night; only the build rolls back.
- Yesterday's `collective.json` is still being served; it is never partially overwritten. The GeoLite copy is refreshed before the new file is published, so a failure there also leaves yesterday's file in place.
- A GlitchTip event with logger `rc-collective-job`.
- A row with `ok = false` and the error in `rc_collective.runs` (best effort: if the database itself is unreachable, the row cannot be written, but the GlitchTip event and the failed unit still appear).

## The rc-collective service

A small service (added separately) reads `public/collective.json` and `geo/GeoLite2-City.mmdb` and exposes two routes. See its own directory for details.
