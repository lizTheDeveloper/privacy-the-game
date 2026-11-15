// The Field (chapter 13): one building per unit of the Field Opsec course.
// `playbooks` lists the course playbooks each building's missions come from;
// tests/the-field.test.js checks every playbook 01-29 is covered somewhere.
const occ = 'assets/buildings/iso_occupied.png';
const tower = 'assets/buildings/iso_tower_occ.png';

const b = (name, building, riskLevel, playbooks) => ({
  name, district: 'field', building, buildingDark: building, riskLevel, playbooks,
});

export const FIELD_ACCOUNTS = {
  who_is_after_you: b("Who's After You", tower, 'high', ['01', '02']),
  quiet_lines: b('Quiet Lines', occ, 'high', ['04', '05', '06']),
  the_meet: b('The Meet', tower, 'high', ['07', '08', '09', '10']),
  the_crossing: b('The Crossing', occ, 'high', ['11', '12', '13', '14']),
  hostile_ground: b('Hostile Ground', occ, 'medium', ['15', '16']),
  lockdown: b('Lockdown', tower, 'high', ['03', '17', '18', '19', '20']),
  the_door: b('The Door', occ, 'high', ['21', '22']),
  burn_protocol: b('Burn Protocol', tower, 'high', ['23', '24', '25']),
  the_crew: b('The Crew', occ, 'medium', ['26', '27', '28', '29']),
};
