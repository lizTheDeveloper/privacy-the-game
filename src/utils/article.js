// "a" or "an" for a phrase, by how it sounds, not how it is spelled.
// - An acronym read as letters (an all-caps run of 2-5, or dotted like U.S.) goes by its
//   first letter's name: A E F H I L M N O R S X start with a vowel sound ("an HBO", "an NSA",
//   "a USB", "a BMW").
// - Acronyms said as words ("a SIM", "a NASA") and words whose first letter misleads
//   ("a unicorn", "a one-time", "an hour") are listed below.

const LETTER_AN = new Set('AEFHILMNORSX');
// Acronyms said as words: the word's own first sound.
const SAID_AS_WORDS = { SIM: 'a', NASA: 'a', GIF: 'a', PIN: 'a', FAQ: 'an', ISA: 'an', OPEC: 'an' };
// Vowel letters with a consonant sound, and a silent h.
const A_BEFORE = /^(uni|use|usu|uti|ura|uro|euro|eu|ewe|one|once)/i;
const AN_BEFORE = /^(hour|honest|honou?r|heir)/i;

export function indefinite(phrase) {
  const word = String(phrase ?? '').trim().split(/[\s/-]+/)[0] ?? '';
  if (Object.hasOwn(SAID_AS_WORDS, word)) return SAID_AS_WORDS[word];
  if (/^([A-Z]\.){2,}/.test(word) || /^[A-Z]{2,5}$/.test(word)) return LETTER_AN.has(word[0]) ? 'an' : 'a';
  if (A_BEFORE.test(word)) return 'a';
  if (AN_BEFORE.test(word)) return 'an';
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

export const withArticle = (phrase) => `${indefinite(phrase)} ${phrase}`;
