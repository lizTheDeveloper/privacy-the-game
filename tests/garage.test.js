// UI sweep #10: the garage's "Other" car has a readable name and an honest status; ADD TO
// GARAGE with empty fields says what's missing; THREAT ASSESSMENT says what the car data says.
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderGarage, renderAddForm, renderVehicleCard, threatAssessment, vehicleFromForm } from '../src/screens/garage.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { textOf } from './helpers/on-page.mjs';

const NOW = new Date('2026-11-06T12:00:00Z');

describe('ADD TO GARAGE', () => {
  it('an empty form says what is missing', () => {
    expect(vehicleFromForm({}, NOW).error).toBe('Add a make, the model and the year, then ADD TO GARAGE.');
    expect(vehicleFromForm({ make: 'Honda', model: 'Civic' }, NOW).error).toBe('Add the year, then ADD TO GARAGE.');
    expect(vehicleFromForm({ make: 'Other', model: 'Roadster', year: '2020' }, NOW).error).toBe('Add the make’s name, then ADD TO GARAGE.');
    expect(renderAddForm()).toContain('data-vehicle-msg');
  });

  it('"Other" keeps the make the player typed; a typed make the game knows becomes that make', () => {
    expect(vehicleFromForm({ make: 'Other', otherMake: 'Rivian', model: 'R1T', year: '2023' }, NOW).vehicle)
      .toEqual({ make: 'Rivian', model: 'R1T', year: '2023', nickname: '', otherMake: true });
    expect(vehicleFromForm({ make: 'Other', otherMake: 'honda', model: 'Fit', year: '2019' }, NOW).vehicle.make).toBe('Honda');
  });
});

describe('the Other car card', () => {
  it('shows the typed make, never car_generic, and a status about the broker opt-outs', () => {
    const s = createInitialState();
    const html = renderVehicleCard(s, { make: 'Rivian', model: 'R1T', year: '2023', otherMake: true, addedAt: NOW.toISOString() }, 0);
    const text = textOf(html);
    expect(text).toContain('2023 Rivian R1T');
    expect(text).not.toContain('car_generic');
    expect(text).not.toContain('IN PROGRESS');
    expect(text).toContain('BROKER OPT-OUTS TO DO');
    expect(text).toContain('No maker opt-out in the game for Rivian');
    expect(html).toContain('href="#/district/freeway?tab=fortify"');
  });

  it('finishes when both broker opt-outs are filed', () => {
    const s = createInitialState();
    s.missions['car_broker_lexisnexis-optout'] = { status: 'completed', action: 'action-done' };
    s.missions['car_broker_verisk-optout'] = { status: 'completed', action: 'action-done' };
    const text = textOf(renderVehicleCard(s, { make: 'Rivian', model: 'R1T', year: '2023', otherMake: true, addedAt: NOW.toISOString() }, 0));
    expect(text).toContain('BROKER OPT-OUTS DONE');
  });

  it('an old save\'s literal "Other" reads as an unlisted make', () => {
    const s = createInitialState();
    s.vehicles = [{ make: 'Other', model: 'Roadster', year: '2020', addedAt: NOW.toISOString() }];
    const text = textOf(renderGarage(s));
    expect(text).toContain('2020 Unlisted make Roadster');
    expect(text).not.toContain('car_generic');
  });
});

describe('THREAT ASSESSMENT', () => {
  it('is built from the car data for a listed make', () => {
    const gm = ACCOUNTS.car_gm;
    const t = threatAssessment('Chevrolet');
    expect(t).toContain(`GM collects: ${gm.dataCollected.join(', ')}.`);
    expect(t).toContain(gm.insuranceStep);
    expect(threatAssessment("Honda")).not.toContain("Driver Feedback: Driver Feedback");
    expect(t).toContain('LexisNexis and Verisk');
  });
  it('says so plainly for an unlisted make, and is empty with no make', () => {
    expect(threatAssessment('Rivian')).toMatch(/^Reclaim City has no maker opt-out for this make yet\./);
    expect(threatAssessment('')).toBe('');
  });
});
