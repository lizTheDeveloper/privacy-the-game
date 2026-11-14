// A step's key, for its saved tick: an explicit `key` when the step has one (a step whose words
// change with the save, or a Simplest step standing for one of the mission's own steps),
// else from its words, so a tick survives the step moving and a step whose words change
// starts unticked (it may now ask for something else).
export function stepKey(step) {
  if (step?.key) return String(step.key);
  const t = String(step?.text || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ').trim();
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
