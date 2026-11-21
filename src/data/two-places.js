// Passwords saved in two places (Liz 2026-11-18): "don't ask them to do a migration right there
// … just say, okay, you know, we'll remember that it's two places and prompt you to check both
// places." Lots of people keep a copy in two places, often as a backup. The game never asks them
// to move, merge or delete anything; it remembers both and says to update both.
//
// The finder finds two places that don't share only as a phone and a computer, phone first
// (an iPhone and Chrome, an Android phone and a Mac …), so a pair of answers names both.

// The phone, by the password check's answer.
export const PHONE_PLACE = { apple: 'your iPhone', google: 'your Android phone' };
// The computer, by the password check's answer (not the phone's).
export const COMPUTER_PLACE = {
  google: 'Chrome on your computer',
  apple: 'your Mac',
  edge: 'Edge on your computer',
  firefox: 'Firefox on your computer',
};

export const pairKey = (a, b) => `${a}+${b}`;

// Every two places the finder can find: [phone, computer].
export const TWO_PLACE_PAIRS = Object.keys(PHONE_PLACE)
  .flatMap((a) => Object.keys(COMPUTER_PLACE).filter((b) => b !== a).map((b) => [a, b]));

// The two places in words, or null when it isn't a pair the finder finds.
export function twoPlaceNames(places = []) {
  const [a, b] = places;
  if (!PHONE_PLACE[a] || !COMPUTER_PLACE[b] || a === b) return null;
  return [PHONE_PLACE[a], COMPUTER_PLACE[b]];
}

// Each step of a two-places mission says where it happens, as a chip on its card (Liz 2026-11-20:
// the step that only said "your passwords are in two places" had nothing to do on it). `now` is
// the chip on the first step after the place changes, and `line` the plain words under it.
const PHONE_CHIP = { apple: 'your iPhone', google: 'your Android phone' };
const COMPUTER_CHIP = { google: ['In', 'Chrome'], apple: ['On', 'your Mac'], edge: ['In', 'Edge'], firefox: ['In', 'Firefox'] };

export function phonePlace(a) {
  return { kind: 'phone', label: `On ${PHONE_CHIP[a]}`, now: `Now on ${PHONE_CHIP[a]}` };
}

export function computerPlace(b, line) {
  const [on, name] = COMPUTER_CHIP[b];
  return { kind: 'computer', label: `${on} ${name}`, now: `Now ${on.toLowerCase()} ${name}`, line };
}
