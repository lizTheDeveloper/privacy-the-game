import { describe, it, expect } from 'vitest';
import { parseRoute } from '../src/router.js';

describe('parseRoute', () => {
  it('parses city map route', () => {
    expect(parseRoute('#/city')).toEqual({ screen: 'city', params: {} });
  });

  it('parses district route', () => {
    expect(parseRoute('#/district/master-keys')).toEqual({
      screen: 'district',
      params: { id: 'master-keys' },
    });
  });

  it('parses district route with tab query parameter', () => {
    expect(parseRoute('#/district/master-keys?tab=fortify')).toEqual({
      screen: 'district',
      params: { id: 'master-keys', tab: 'fortify' },
    });
    expect(parseRoute('#/district/master-keys?tab=reclaim')).toEqual({
      screen: 'district',
      params: { id: 'master-keys', tab: 'reclaim' },
    });
    expect(parseRoute('#/district/master-keys?tab=survey')).toEqual({
      screen: 'district',
      params: { id: 'master-keys', tab: 'survey' },
    });
  });

  it('parses mission briefing route', () => {
    expect(parseRoute('#/mission/gmail-recon-breach/briefing')).toEqual({
      screen: 'briefing',
      params: { id: 'gmail-recon-breach' },
    });
  });

  it('parses mission debrief route', () => {
    expect(parseRoute('#/mission/gmail-recon-breach/debrief')).toEqual({
      screen: 'debrief',
      params: { id: 'gmail-recon-breach' },
    });
  });

  it('parses stats route', () => {
    expect(parseRoute('#/stats')).toEqual({ screen: 'stats', params: {} });
  });

  it('parses milestone route', () => {
    expect(parseRoute('#/milestone/master-keys')).toEqual({
      screen: 'milestone',
      params: { districtId: 'master-keys' },
    });
  });

  it('defaults to city for unknown routes', () => {
    expect(parseRoute('#/unknown')).toEqual({ screen: 'city', params: {} });
    expect(parseRoute('')).toEqual({ screen: 'city', params: {} });
  });
});
