// Breaker round 4 for recon Phase 3 (git diff 1207e35..HEAD, plus a sweep of
// typed values: carrier settings, codes, phone numbers, DNS, about: pages,
// app names, opt-out addresses). Sources checked 2026-10-08.
// Passing tests pin what held; failing ones (each commented) describe
// behaviour the breaker believes is wrong.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../../src/data/missions.js';
import { trackNow } from '../../src/utils/analytics.js';

const APP = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');
const SQL = readFileSync(new URL('../../collective/job/sql/build.sql', import.meta.url), 'utf8');
const fixture = JSON.parse(readFileSync(new URL('../fixtures/verified-urls.json', import.meta.url), 'utf8'));

const mission = (id) => MISSIONS.find((m) => m.id === id);
const stepsText = (id) => (mission(id).steps || []).map((s) => s.text).join('\n');

describe('typed values that held', () => {
  it('the DNS allowlist names exactly the hostnames and IPs players are told to type', () => {
    const all = MISSIONS.flatMap((m) => [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})].flat())
      .map((s) => s.text || '').join('\n');
    const ips = new Set(all.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g));
    const allowed = new Set([...Object.keys(fixture.dns.resolvers), ...Object.keys(fixture.dns.routerDefaults)]);
    for (const ip of ips) expect(allowed.has(ip), ip).toBe(true);
    expect(all).not.toMatch(/one\.dot\.one/);
  });

  it('SafeGraph opt-out address is the one on its privacy policy (decoded from the page, 2026-10-08)', () => {
    expect(stepsText('location_brokers-fortify-optout')).toContain('privacy@safegraph.com');
  });

  it('SSA numbers match ssa.gov (1-800-772-1213, TTY 1-800-325-0778)', () => {
    const all = MISSIONS.flatMap((m) => (m.steps || []).map((s) => s.text)).join('\n');
    expect(all).toContain('1-800-772-1213');
    expect(all).toContain('TTY 1-800-325-0778');
  });

  it('T-Mobile PIN steps match T-Mobile support (T-Life, gear icon, Security, T-Mobile ID, 6-15 digits)', () => {
    const t = stepsText('sim_protection-fortify-pin');
    expect(t).toMatch(/T-Life app, Account → gear icon → Security → T-Mobile ID → Account PIN\/Passcode/);
    expect(t).toContain('6–15 digit');
  });

  it('restore sends strictly one at a time, each awaited', () => {
    // Ruling (Phase 3 reviewer I1): restore uses its own confirmed sender.
    const SENDER = readFileSync(new URL('../../src/utils/restore-send.js', import.meta.url), 'utf8');
    expect(SENDER).toMatch(/for \(let i = 0; i < todo\.length; i \+= 1\) \{\s*const ok = await send\(todo\[i\]\.name, todo\[i\]\.data\);/);
    expect(APP).toMatch(/await sendRestore\(events,/);
    expect(APP).not.toMatch(/events\.slice\(i, i \+ 10\)/);
  });

  it('rc_latest breaks a same-instant tie with a NULL-safe completed test', () => {
    expect(SQL).toMatch(/\(coalesce\(status, ''\) = 'completed'\) DESC/);
  });
});

describe('carrier lock steps', () => {
  // FAILS. Believed wrong: sim_protection-fortify-pin (missions-perimeter.js:53)
  // says AT&T "Extra Security" "requires the passcode for ALL account changes".
  // AT&T's own page (att.com/support/article/my-account/KM1159574) says the
  // extra security passcode "is used when signing in to your wireless account
  // online". It does not gate account changes or port-outs. The feature that
  // does ("disable some transactions and account changes", number port-outs,
  // device upgrades) is Wireless Account Lock (myAT&T app: Services > Mobile
  // Security > Wireless Account Lock). A player following this step believes
  // their number is port-out locked when it is not, in the mission whose whole
  // point is SIM-swap protection.
  it('the AT&T step does not claim Extra Security covers all account changes', () => {
    const att = (mission('sim_protection-fortify-pin').steps.find((s) => /^AT&T/.test(s.text)) || {}).text || '';
    expect(att).not.toMatch(/ALL account changes/);
  });

  it('the AT&T step names Wireless Account Lock, AT&T\'s real port-out and account-change lock', () => {
    // FAILS. Same source and reason as above: without it no step gives an AT&T
    // customer the port-out lock the briefing promises.
    expect(stepsText('sim_protection-fortify-pin')).toMatch(/Wireless Account Lock/);
  });

  // FAILS. Believed wrong: the Verizon step says "Account → Security → set an
  // Account PIN. Then enable 'Number Lock' on the same page." Verizon's own
  // pages say Number Lock is a separate switch (My Verizon app: Me tab > Edit
  // profile and settings > Security > Number Lock) and that the Account PIN is
  // set at vzw.com/PIN (a 4-digit PIN). Menu labels the player is told to tap
  // ("Account → Security") and "the same page" don't match; a player hunting for
  // the switch on the PIN page will not find it and may stop with the number
  // unlocked.
  it('the Verizon step does not put Number Lock on the Account PIN page', () => {
    const vz = (mission('sim_protection-fortify-pin').steps.find((s) => /^Verizon/.test(s.text)) || {}).text || '';
    expect(vz).not.toMatch(/same page/);
  });

  it('the Verizon step tells the player where Number Lock really is', () => {
    // FAILS. Same source and reason as above.
    const vz = (mission('sim_protection-fortify-pin').steps.find((s) => /^Verizon/.test(s.text)) || {}).text || '';
    expect(vz).toMatch(/Edit profile and settings/);
  });
});

describe('app names and menus', () => {
  // FAILS. Believed wrong: health-insurance-data-permissions (missions-clinic.js:389)
  // sends Android players to "Settings > Apps > Google Fit > review connected apps
  // and permissions". On Android the connected-apps hub is Health Connect
  // (Settings > Apps > Health Connect on Android 14+, or Privacy > Permission
  // manager > Health Connect); the Google Fit app's App info page lists only the
  // OS permissions of Fit itself, not which apps read health data, and Google moved
  // developers off the Fit APIs to Health Connect (deadline 30 June 2025,
  // 9to5google / Android Developers). The step and its link (myaccount.google.com/
  // permissions, third-party access to the Google account) do not lead to the
  // health data hub the briefing describes.
  it('the Android health permission step points at Health Connect', () => {
    expect(stepsText('health-insurance-data-permissions')).toMatch(/Health Connect/);
  });
});

describe('restore delivery order', () => {
  // FAILS. Believed wrong: restoreData() claims "A send that times out doesn't
  // stop the rest or change their order", but trackNow() abandons a send after
  // 1500 ms without cancelling it. On a slow connection the abandoned request is
  // still in flight when the next one goes, and Umami stamps created_at on
  // arrival, so the first event arrives AFTER the second. The collective job's
  // "latest filing wins" (and the pair rule that takes the later of two
  // answers) then reads the save in the wrong order, which is exactly what the
  // sequential rewrite was meant to prevent. Simulated here with a tracker whose
  // first send takes 4 s to land and the second 10 ms.
  it('an event whose send timed out still arrives before the next event is sent', async () => {
    vi.useFakeTimers();
    const arrived = [];
    const delays = { first: 4000, second: 10 };
    globalThis.umami = {
      track: (name) => new Promise((resolve) => setTimeout(() => { arrived.push(name); resolve(); }, delays[name])),
    };
    try {
      const run = (async () => {
        await trackNow('first', {});
        await trackNow('second', {});
      })();
      await vi.advanceTimersByTimeAsync(10000);
      await run;
      expect(arrived).toEqual(['first', 'second']);
    } finally {
      delete globalThis.umami;
      vi.useRealTimers();
    }
  });
});
