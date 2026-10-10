import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_TIMEZONES,
  getTimezoneDisplayInfo,
  formatDateInZone,
  convertTimeBetweenZones,
} from '../utils/timezones.js';

describe('Client Timezone Utility Tests', () => {
  it('supports the 4 required global timezone regions', () => {
    const ids = SUPPORTED_TIMEZONES.map((tz) => tz.id);
    expect(ids).toContain('Asia/Kolkata');
    expect(ids).toContain('Europe/London');
    expect(ids).toContain('America/New_York');
    expect(ids).toContain('America/Los_Angeles');
  });

  it('calculates display info with current time and offset for Asia/Kolkata', () => {
    const info = getTimezoneDisplayInfo('Asia/Kolkata');
    expect(info.zoneId).toBe('Asia/Kolkata');
    expect(info.offset).toContain('+05:30');
    expect(info.isDST).toBe(false);
  });

  it('formats dates accurately in target timezone', () => {
    const formatted = formatDateInZone('2026-11-20T14:00:00.000Z', 'America/New_York');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Nov');
  });

  it('converts time cleanly between fromZone and toZone', () => {
    // 09:00 AM New York time to London time (usually +5 hours in winter)
    const res = convertTimeBetweenZones('2026-11-20', '09:00', 'America/New_York', 'Europe/London');
    expect(res).toHaveProperty('targetTime');
    expect(res).toHaveProperty('targetDate');
    expect(res.targetTime).toBe('02:00 PM');
  });
});
