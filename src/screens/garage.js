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

function findManufacturer(make) {
  return CAR_MANUFACTURERS.find((m) =>
    m.makes.some((name) => name.toLowerCase() === make.toLowerCase()),
  );
}

function allMakes() {
  return CAR_MANUFACTURERS.flatMap((m) => m.makes).sort();
}

function renderVehicleCard(state, vehicle, index) {
  const mfr = findManufacturer(vehicle.make);
  const accountId = mfr?.id || 'car_generic';
  const bState = getBuildingState(state, accountId);
  const secured = bState === 'liberated' || bState === 'liberated-scarred';

  return `
  <div style="background: rgba(26,31,43,0.5); border: 1px solid ${secured ? 'rgba(198,255,0,0.25)' : 'rgba(0,229,255,0.2)'}; padding: 20px; position: relative;">
    ${secured
      ? '<div style="position: absolute; top: 12px; right: 12px;"><span style="font-family: \'JetBrains Mono\', monospace; font-size: 9px; font-weight: 600; padding: 3px 8px; border: 1px solid rgba(198,255,0,0.2); color: #C6FF00; background: rgba(198,255,0,0.1);">SECURED</span></div>'
      : '<div style="position: absolute; top: 12px; right: 12px;"><span style="font-family: \'JetBrains Mono\', monospace; font-size: 9px; font-weight: 600; padding: 3px 8px; border: 1px solid rgba(255,159,0,0.2); color: #FF9F00; background: rgba(255,159,0,0.1);">IN PROGRESS</span></div>'
    }
    <div style="text-align: center; margin-bottom: 12px;">
      ${renderBuilding(accountId, bState, 64)}
    </div>
    <div style="text-align: center;">
      <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #EDEFF3; letter-spacing: 1px;">${esc(vehicle.year)} ${esc(vehicle.make)} ${esc(vehicle.model)}</div>
      ${vehicle.nickname ? `<div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: rgba(0,229,255,0.6); margin-top: 4px;">"${esc(vehicle.nickname)}"</div>` : ''}
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: rgba(237,239,243,0.3); margin-top: 4px;">Added ${new Date(vehicle.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
    </div>
    <div style="margin-top: 14px; display: flex; gap: 8px; justify-content: center;">
      <a href="#/district/freeway?tab=recon" style="font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #00E5FF; padding: 6px 12px; border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08);">MISSIONS</a>
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
      </div>
      <div>
        <label style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">MODEL</label>
        <input id="vehicle-model" type="text" placeholder="e.g. Civic, Camry, Model 3" style="width: 100%; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3;">
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px;">
      <div>
        <label style="font-family: 'Orbitron', sans-serif; font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">YEAR</label>
        <input id="vehicle-year" type="number" min="2010" max="2027" placeholder="2024" style="width: 100%; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #EDEFF3;">
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
