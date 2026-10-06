// The pod a player chose on "What we know about you". Stored only in this
// browser; track() attaches it to events so the nightly job counts them there.
export const POD_KEY = 'reclaim-city.pod';

export function getChosenPod() {
  try {
    return localStorage.getItem(POD_KEY) || null;
  } catch {
    return null;
  }
}

export function setChosenPod(id) {
  try {
    if (id) localStorage.setItem(POD_KEY, id);
    else localStorage.removeItem(POD_KEY);
  } catch {
    // Storage blocked: the choice just doesn't persist.
  }
}
