import { describe, it, expect } from 'vitest';
import { fieldCourseNote } from '../src/screens/briefing.js';
import { FIELD_MISSIONS } from '../src/data/missions-field.js';
import { FIELD_PLAYBOOK_TITLES, FIELD_KIT_URL } from '../src/data/missions-field-shared.js';
import { MISSIONS } from '../src/data/missions.js';

describe('Field missions link back to the Field Opsec Kit', () => {
  it('has a kit title for every playbook 01-29', () => {
    const ids = Array.from({ length: 29 }, (_, i) => String(i + 1).padStart(2, '0'));
    expect(Object.keys(FIELD_PLAYBOOK_TITLES).sort()).toEqual(ids);
  });

  it('every Field mission links each of its playbooks to its kit bench', () => {
    for (const m of FIELD_MISSIONS) {
      const html = fieldCourseNote(m);
      for (const id of m.playbooks) expect(html, m.id).toContain(`${FIELD_KIT_URL}#p${id}`);
    }
  });

  it('opens off-site links in a new tab with no referrer', () => {
    const html = fieldCourseNote(FIELD_MISSIONS[0]);
    const links = html.match(/<a [^>]*>/g);
    expect(links.length).toBeGreaterThan(1);
    for (const a of links) expect(a).toContain('rel="noopener noreferrer"');
  });

  it('says nothing on missions outside The Field', () => {
    const other = MISSIONS.find((m) => !m.playbooks);
    expect(fieldCourseNote(other)).toBe('');
  });
});
