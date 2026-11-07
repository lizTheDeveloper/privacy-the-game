import { ACCOUNTS } from '../data/accounts.js';
import { CAR_MANUFACTURERS } from '../data/accounts-freeway.js';
import { renderHud } from '../components/hud.js';
import { renderBuilding } from '../components/building.js';
import { getBuildingState } from '../utils/calc.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function findManufacturer(make) {
  const name = String(make || '').trim().toLowerCase();
  return CAR_MANUFACTURERS.find((m) =>
    m.makes.some((n) => n.toLowerCase() === name),
  );
}

function allMakes() {
  return CAR_MANUFACTURERS.flatMap((m) => m.makes).sort();
}

const BROKERS = ['car_broker_lexisnexis', 'car_broker_verisk'];
const isSecured = (bState) => bState === 'liberated' || bState === 'liberated-scarred';
// An old save may hold the literal make "Other" (before the form asked for its name).
const makeLabel = (make) => (make === 'Other' ? 'Unlisted make' : make);

function brokerLine() {
  const names = BROKERS.map((id) => ACCOUNTS[id]?.name).filter(Boolean).join(' and ');
  const what = ACCOUNTS[BROKERS[0]]?.dataCollected?.[0];
  return `${names} hold ${what || 'driving data'}; their opt-out missions apply to any car.`;
}

// The THREAT ASSESSMENT box on the add form: what the game's own car data says about this
// make (accounts-freeway.js), or that it has no maker opt-out for it. '' with no make.
export function threatAssessment(make) {
  if (!make) return '';
  const mfr = findManufacturer(make);
  const account = mfr && ACCOUNTS[mfr.id];
  if (!account) {
    return `Reclaim City has no maker opt-out for this make yet. ${brokerLine()}`;
  }
  const parts = [`${account.name} collects: ${account.dataCollected.join(', ')}. Risk: ${String(account.riskLevel).toUpperCase()}.`];
  if (account.insuranceProgram && account.insuranceStep) parts.push(account.insuranceStep.startsWith(account.insuranceProgram) ? account.insuranceStep : `${account.insuranceProgram}: ${account.insuranceStep}`);
  parts.push(brokerLine());
  return parts.join(' ');
}

// ADD TO GARAGE: the vehicle, or what's missing. "Other" needs the make's name typed in;
// a typed name the game knows becomes that make.
export function vehicleFromForm({ make, otherMake, model, year, nickname } = {}, now = new Date()) {
  const typed = String(otherMake || '').trim();
  const chosen = make === 'Other' ? (findManufacturer(typed)?.makes.find((n) => n.toLowerCase() === typed.toLowerCase()) || typed) : String(make || '').trim();
  const y = Number(String(year || '').trim());
  const missing = [];
  if (!make) missing.push('a make');
  else if (!chosen) missing.push('the make’s name');
  if (!String(model || '').trim()) missing.push('the model');
  if (!Number.isInteger(y) || y < 1900 || y > now.getFullYear() + 1) missing.push('the year');
  if (missing.length) {
    const list = missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}` : missing[0];
    return { error: `Add ${list}, then ADD TO GARAGE.` };
  }
  const vehicle = { make: chosen, model: String(model).trim(), year: String(y), nickname: String(nickname || '').trim() };
  if (!findManufacturer(chosen)) vehicle.otherMake = true;
  return { vehicle };
}

function badge(text, rgb, color) {
  return `<div style="position: absolute; top: 12px; right: 12px;"><span data-vehicle-status style="font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; padding: 3px 8px; border: 1px solid rgba(${rgb},0.2); color: ${color}; background: rgba(${rgb},0.1);">${text}</span></div>`;
}

export function renderVehicleCard(state, vehicle, index) {
  const mfr = findManufacturer(vehicle.make);
  let picture;
  let status;
  let note = '';
  let missionsHref = '#/district/freeway?tab=recon';
  let secured;
  if (mfr) {
    const bState = getBuildingState(state, mfr.id);
    secured = isSecured(bState);
    picture = renderBuilding(mfr.id, bState, 64);
    status = secured ? badge('SECURED', '198,255,0', '#C6FF00') : badge('IN PROGRESS', '255,159,0', '#FF9F00');
  } else {
    // No maker in the game: what's left to do is the two broker opt-outs, so the card says that.
    secured = BROKERS.every((id) => isSecured(getBuildingState(state, id)));
    picture = `<img src="assets/buildings/car_generic${secured ? '' : '_dark'}.png" alt="" style="display: block; margin: 0 auto; width: 64px; height: auto; filter: brightness(${secured ? 1.1 : 0.5});">`;
    status = secured ? badge('BROKER OPT-OUTS DONE', '198,255,0', '#C6FF00') : badge('BROKER OPT-OUTS TO DO', '255,159,0', '#FF9F00');
    note = `<div data-vehicle-note style="font-size: 11px; color: rgba(237,239,243,0.5); line-height: 1.5; margin-top: 8px;">No maker opt-out in the game for ${esc(makeLabel(vehicle.make))}. ${esc(brokerLine())}</div>`;
    missionsHref = '#/district/freeway?tab=fortify';
  }

  return `
  <div style="background: rgba(26,31,43,0.5); border: 1px solid ${secured ? 'rgba(198,255,0,0.25)' : 'rgba(0,229,255,0.2)'}; padding: 20px; position: relative;">
    ${status}
    <div style="text-align: center; margin-bottom: 12px; margin-top: 12px;">
      ${picture}
    </div>
    <div style="text-align: center;">
      <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #EDEFF3; letter-spacing: 1px;">${esc(vehicle.year)} ${esc(makeLabel(vehicle.make))} ${esc(vehicle.model)}</div>
      ${vehicle.nickname ? `<div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: rgba(0,229,255,0.6); margin-top: 4px;">"${esc(vehicle.nickname)}"</div>` : ''}
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: rgba(237,239,243,0.3); margin-top: 4px;">Added ${new Date(vehicle.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      ${note}
    </div>
    <div style="margin-top: 14px; display: flex; gap: 8px; justify-content: center;">
      <a href="${missionsHref}" style="font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #00E5FF; padding: 6px 12px; border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08);">MISSIONS</a>
      <span data-action="remove-vehicle" data-index="${index}" style="cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 1px; color: rgba(237,239,243,0.3); padding: 6px 12px; border: 1px solid rgba(255,255,255,0.08);">REMOVE</span>
    </div>
  </div>`;
}

function renderAddCard() {
  return `
  <div data-action="show-add-vehicle" style="background: rgba(26,31,43,0.3); border: 2px dashed rgba(0,229,255,0.2); padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 240px; cursor: pointer;">
    <div style="width: 64px; height: 64px; border: 2px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.04); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <line x1="16" y1="6" x2="16" y2="26" stroke="#00E5FF" stroke-width="2" stroke-linecap="round"></line>
        <line x1="6" y1="16" x2="26" y2="16" stroke="#00E5FF" stroke-width="2" stroke-linecap="round"></line>
      </svg>
    </div>
    <div style="font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700; color: #00E5FF; letter-spacing: 2px;">ADD VEHICLE</div>
    <div style="font-size: 11px; color: rgba(237,239,243,0.35); margin-top: 8px; text-align: center; line-height: 1.5;">Select your car's make and model to start reclaiming your data.</div>
  </div>`;
}

export function renderAddForm() {
  const makes = allMakes();
  const options = makes.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('');

  return `
  <div id="add-vehicle-form" style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.25); padding: 24px; margin-top: 16px; box-shadow: 0 0 30px rgba(0,229,255,0.05);">
    <div style="font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700; color: #00E5FF; letter-spacing: 3px; margin-bottom: 20px;">ADD A VEHICLE</div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px;">
      <div>
        <label style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">MAKE</label>
        <select id="vehicle-make" style="width: 100%; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3; appearance: none;">
          <option value="">Select make...</option>
          ${options}
          <option value="Other">Other</option>
        </select>
        <input id="vehicle-make-other" type="text" hidden placeholder="Type the make" aria-label="The make, if it isn’t listed" style="width: 100%; margin-top: 8px; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3;">
      </div>
      <div>
        <label style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">MODEL</label>
        <input id="vehicle-model" type="text" placeholder="e.g. Civic, Camry, Model 3" style="width: 100%; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3;">
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px;">
      <div>
        <label style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">YEAR</label>
        <input id="vehicle-year" type="number" min="1900" max="${new Date().getFullYear() + 1}" placeholder="2024" style="width: 100%; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3;">
      </div>
      <div>
        <label style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">NICKNAME <span style="color: rgba(237,239,243,0.25);">(OPTIONAL)</span></label>
        <input id="vehicle-nickname" type="text" placeholder='e.g. "Daily Driver"' style="width: 100%; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.15); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3;">
      </div>
    </div>
    <div id="threat-preview" hidden style="background: rgba(255,45,155,0.04); border: 1px solid rgba(255,45,155,0.15); padding: 14px 16px; margin-bottom: 20px;">
      <div style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(255,45,155,0.6); margin-bottom: 8px;">THREAT ASSESSMENT</div>
      <div id="threat-text" style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.6;"></div>
    </div>
    <div data-vehicle-msg role="status" hidden style="font-size: 13px; color: var(--amber); line-height: 1.6; margin-bottom: 12px;"></div>
    <div style="display: flex; gap: 16px; align-items: center;">
      <span data-action="add-vehicle" style="cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #090B10; background: #00E5FF; padding: 14px 28px; letter-spacing: 2px; box-shadow: 0 0 20px rgba(0,229,255,0.35), 0 4px 0 #009bb3;">ADD TO GARAGE</span>
      <span data-action="cancel-add-vehicle" style="cursor: pointer; font-size: 13px; color: rgba(237,239,243,0.35);">CANCEL</span>
    </div>
  </div>`;
}

export function renderGarage(state) {
  const vehicles = state.vehicles || [];

  const cards = vehicles.map((v, i) => renderVehicleCard(state, v, i)).join('');

  return `
  <div class="scanlines" style="min-height: 100vh; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state)}
    <div style="padding: 20px 24px 0;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <a href="#/district/freeway" style="flex-shrink: 0; padding: 8px 14px; font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 600; color: #00E5FF; background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); letter-spacing: 1px; text-decoration: none;">&#8592; DISTRICT</a>
        <div style="flex: 1;">
          <div style="font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 800; color: #00E5FF; letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">VEHICLE GARAGE</div>
          <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">Your connected vehicles. Add cars to see what data they share and opt out.</div>
        </div>
      </div>
    </div>
    <div style="padding: 24px;">
      <div style="font-family: 'Orbitron', sans-serif; font-size: 8px; font-weight: 600; letter-spacing: 3px; color: rgba(0,229,255,0.4); margin-bottom: 16px;">YOUR VEHICLES ${vehicles.length > 0 ? `(${vehicles.length})` : ''}</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
        ${cards}
        ${renderAddCard()}
      </div>
      <div id="add-form-container"></div>
    </div>
  </div>`;
}
