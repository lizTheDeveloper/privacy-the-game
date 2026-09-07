export function renderScout(message, options = {}) {
  const action = options.actionText && options.actionHref
    ? `<a href="${options.actionHref}" style="flex-shrink: 0; display: inline-block; border: 1px solid var(--cyan); padding: 10px 18px; font-family: var(--font-display); font-size: 9px; font-weight: 700; color: var(--cyan); text-decoration: none; white-space: nowrap; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0,229,255,0.4); box-shadow: 0 0 12px rgba(0,229,255,0.15), inset 0 0 12px rgba(0,229,255,0.05);">${options.actionText}</a>`
    : '';
  return `
  <div style="background: linear-gradient(180deg, transparent 0%, rgba(9,11,16,0.92) 25%, rgba(9,11,16,0.99) 100%); padding: 18px 20px 14px; border-top: 1px solid rgba(0,229,255,0.08);">
    <div style="display: flex; gap: 14px; align-items: flex-end;">
      <div style="flex-shrink: 0; text-align: center;">
        <img src="assets/characters/scout_0.png" style="width: 64px; height: 64px; filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));">
        <div style="font-family: var(--font-display); font-size: 7px; font-weight: 700; color: var(--cyan); margin-top: 3px; letter-spacing: 2px; text-shadow: 0 0 6px rgba(0,229,255,0.4);">SCOUT</div>
      </div>
      <div style="flex: 1; background: rgba(26,31,43,0.9); border: 1px solid rgba(0,229,255,0.25); padding: 12px 16px; position: relative; box-shadow: 0 0 15px rgba(0,229,255,0.05), inset 0 0 30px rgba(0,229,255,0.02);">
        <div style="font-size: 14px; color: var(--offwhite); line-height: 1.6;">${message}</div>
        <div style="position: absolute; bottom: 8px; right: 12px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid var(--cyan);"></div>
      </div>
      ${action}
    </div>
  </div>`;
}
