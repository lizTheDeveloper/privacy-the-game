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
