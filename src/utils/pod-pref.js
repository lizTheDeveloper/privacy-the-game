// The pod a player chose on "What we know about you". Stored only in this
// browser; track() attaches it to events so the nightly job counts them there.
// Clearing the choice stores the marker 'auto' rather than removing the key:
// the job uses each session's latest pod value, so clearing has to be sent as
// an event of its own ("auto" is not a published pod, so geo takes over).
export const POD_KEY = 'reclaim-city.pod';
export const POD_AUTO = 'auto';

function read() {
  try {
    return localStorage.getItem(POD_KEY) || null;
  } catch {
    return null;
  }
}

export function getChosenPod() {
  const v = read();
  return v === POD_AUTO ? null : v;
}

// True while a cleared choice still needs to reach the job.
export function isPodAuto() {
  return read() === POD_AUTO;
}

export function setChosenPod(id) {
  try {
    localStorage.setItem(POD_KEY, id || POD_AUTO);
  } catch {
    // Storage blocked: the choice just doesn't persist.
  }
}
