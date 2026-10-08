// Two-factor: what protects an account. The 2FA debrief asks what the player
// has now ("method"); if nothing, which one they set up ("method_setup").
// The old answer ("action": enabled-2fa / already-enabled / later) is still
// derived so existing screens, findings and analytics keep working.

export const TWO_FA_METHODS = ['passkey', 'authenticator', 'sms', 'email'];
export const STRONG_METHODS = ['passkey', 'authenticator'];
export const CODE_METHODS = ['sms', 'email'];

// The method protecting the account now: 'passkey' | 'authenticator' | 'sms' |
// 'email' | 'none', or undefined for a save from before the question existed.
export function twoFactorMethod(record) {
  const m = record?.method;
  if (!m) return undefined;
  if (m !== 'none') return m;
  return TWO_FA_METHODS.includes(record.method_setup) ? record.method_setup : 'none';
}

export function twoFactorAction(answers) {
  if (TWO_FA_METHODS.includes(answers.method)) return 'already-enabled';
  if (answers.method === 'none') {
    if (TWO_FA_METHODS.includes(answers.method_setup)) return 'enabled-2fa';
    if (answers.method_setup === 'later') return 'later';
  }
  return undefined;
}

// How strong a second step is, weakest first (ruling 2026-10-08). When two
// answers for one account tie (same instant), the weaker one stands: the same
// rule build.sql's rc_method_rank applies. Unknown counts as weakest.
export const METHOD_STRENGTH = { none: 0, sms: 1, email: 1, authenticator: 2, passkey: 3 };

export function methodStrength(method) {
  return METHOD_STRENGTH[method] ?? 0;
}

export function weakerMethod(a, b) {
  return methodStrength(b) < methodStrength(a) ? b : a;
}
