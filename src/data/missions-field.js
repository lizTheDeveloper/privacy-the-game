// ══════════════════════════════════════════════════════
// CHAPTER 13: THE FIELD  (opt-in)
// Field Opsec: procedures for people whose work makes them a target.
// Source: The Multiverse School's Field Opsec playbooks. Every mission carries
// `playbooks` (which ones it comes from); nothing here is in none of them.
// A mission whose job another district already does lists that mission in
// `shares` and the briefing links to it, so nothing is taught twice.
// ══════════════════════════════════════════════════════

import { FIELD_MISSIONS_A, FIELD_LEADS_A } from './missions-field-a.js';
import { FIELD_MISSIONS_B, FIELD_LEADS_B } from './missions-field-b.js';
import { FIELD_MISSIONS_C, FIELD_LEADS_C } from './missions-field-c.js';

export const FIELD_MISSIONS = [...FIELD_MISSIONS_A, ...FIELD_MISSIONS_B, ...FIELD_MISSIONS_C];
export const FIELD_LEADS = { ...FIELD_LEADS_A, ...FIELD_LEADS_B, ...FIELD_LEADS_C };
