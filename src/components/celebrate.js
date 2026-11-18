// A burst of confetti, for good news (Liz 2026-11-18: "we need a little bit more celebration when
// things are good"). Pure CSS: each piece flies out from the top middle and falls. Placed once,
// it plays once; reduced motion shows nothing.
const COLORS = ['var(--lime)', 'var(--cyan)', 'var(--amber)', 'var(--magenta)', '#EDEFF3'];

export function confetti(count = 28) {
  const pieces = Array.from({ length: count }, (_, i) => {
    // Spread evenly round a fan, with a little wobble, so it looks thrown, not gridded.
    const angle = -160 + (140 * i) / (count - 1) + ((i * 37) % 11) - 5;
    const dist = 110 + ((i * 53) % 90);
    const x = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
    const y = Math.round(Math.sin((angle * Math.PI) / 180) * dist);
    const spin = ((i * 97) % 720) - 360;
    const delay = (i % 7) * 30;
    return `<i style="--x: ${x}px; --y: ${y}px; --r: ${spin}deg; --c: ${COLORS[i % COLORS.length]}; animation-delay: ${delay}ms;"></i>`;
  }).join('');
  return `<div class="confetti" aria-hidden="true">${pieces}</div>`;
}
