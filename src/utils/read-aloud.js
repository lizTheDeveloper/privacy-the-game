// "Read it to me": the browser's own speech (speechSynthesis). It runs on the device and sends
// nothing anywhere. Returns false where the browser has no voice, so the caller can say so.

let speaking = false;

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

export function speak(text) {
  if (!canSpeak() || !text) return false;
  const synth = window.speechSynthesis;
  // A second tap while it is talking stops it.
  if (speaking || synth.speaking) {
    stopSpeaking();
    return false;
  }
  const u = new window.SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
  u.rate = 0.95;
  u.lang = 'en-US';
  u.onend = () => { speaking = false; };
  u.onerror = () => { speaking = false; };
  speaking = true;
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  speaking = false;
  if (canSpeak()) window.speechSynthesis.cancel();
}
