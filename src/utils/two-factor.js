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
