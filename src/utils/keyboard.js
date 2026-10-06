// Spans and divs that act as buttons (role="button" + data-action) activate on
// Enter and Space, like a real button. Returns the element to activate, or null.
export function keyActivationTarget(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return null;
  return e.target?.closest?.('[role="button"][data-action]') || null;
}
