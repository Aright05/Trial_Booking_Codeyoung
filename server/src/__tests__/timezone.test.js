import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { DateTime } from 'luxon';
import app from '../app.js';
import {
  isValidIanaTimezone,
  getIstDayBoundaries,
  formatLocalizedInterval,
  isNonexistentLocalTime,
  isAmbiguousLocalTime,
  getTimezoneAbbreviation,
} from '../utils/timezone.js';
import { connectPostgres, query, pool } from '../config/postgres.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';
import { seedPostgresMentors } from '../scripts/seedPostgresMentors.js';

describe('Step 4: Robust Timezone Conversion & Daylight-Saving-Time (DST) Tests', () => {
  beforeAll(async () => {
    await connectPostgres();
    await initPostgresSchema();
    await seedPostgresMentors();
  });

  afterAll(async () => {
    await query("DELETE FROM bookings WHERE parent_email LIKE '%tztest%'").catch(() => {});
    if (pool?.end) await pool.end().catch(() => {});
  });

  describe('1. India Timezone Conversion (Asia/Kolkata)', () => {
    it('maintains a constant UTC+5:30 offset (+330 minutes) in both winter and summer without DST', () => {
      // Winter instant: 15 January 2026
      const winterDt = DateTime.fromISO('2026-01-15T12:00:00.000Z', { zone: 'Asia/Kolkata' });
      expect(winterDt.offset).toBe(330);
      expect(winterDt.isInDST).toBe(false);
      expect(getTimezoneAbbreviation(winterDt)).toBe('IST');

      // Summer instant: 15 July 2026
      const summerDt = DateTime.fromISO('2026-07-15T12:00:00.000Z', { zone: 'Asia/Kolkata' });
      expect(summerDt.offset).toBe(330);
      expect(summerDt.isInDST).toBe(false);
      expect(getTimezoneAbbreviation(summerDt)).toBe('IST');
    });
  });

  describe('2. New York Winter and Summer Offsets (America/New_York)', () => {
    it('verifies EST (UTC-5 / -300 min) in winter and EDT (UTC-4 / -240 min) in summer', () => {
      // Winter (EST): 15 January 2026
      const winterDt = DateTime.fromISO('2026-01-15T15:00:00.000Z', { zone: 'America/New_York' });
      expect(winterDt.offset).toBe(-300);
      expect(winterDt.isInDST).toBe(false);
      expect(getTimezoneAbbreviation(winterDt)).toBe('EST');

      // Summer (EDT): 15 July 2026
      const summerDt = DateTime.fromISO('2026-07-15T15:00:00.000Z', { zone: 'America/New_York' });
      expect(summerDt.offset).toBe(-240);
      expect(summerDt.isInDST).toBe(true);
      expect(getTimezoneAbbreviation(summerDt)).toBe('EDT');
    });
  });

  describe('3. London Winter and Summer Offsets (Europe/London)', () => {
    it('verifies GMT (UTC+0 / 0 min) in winter and BST (UTC+1 / +60 min) in summer', () => {
      // Winter (GMT): 15 January 2026
      const winterDt = DateTime.fromISO('2026-01-15T12:00:00.000Z', { zone: 'Europe/London' });
      expect(winterDt.offset).toBe(0);
      expect(winterDt.isInDST).toBe(false);
      expect(getTimezoneAbbreviation(winterDt)).toBe('GMT');

      // Summer (BST): 15 July 2026
      const summerDt = DateTime.fromISO('2026-07-15T12:00:00.000Z', { zone: 'Europe/London' });
      expect(summerDt.offset).toBe(60);
      expect(summerDt.isInDST).toBe(true);
      expect(getTimezoneAbbreviation(summerDt)).toBe('BST');
    });
  });

  describe('4. Los Angeles Winter and Summer Offsets (America/Los_Angeles)', () => {
    it('verifies PST (UTC-8 / -480 min) in winter and PDT (UTC-7 / -420 min) in summer', () => {
      // Winter (PST): 15 January 2026
      const winterDt = DateTime.fromISO('2026-01-15T18:00:00.000Z', { zone: 'America/Los_Angeles' });
      expect(winterDt.offset).toBe(-480);
      expect(winterDt.isInDST).toBe(false);
      expect(getTimezoneAbbreviation(winterDt)).toBe('PST');

      // Summer (PDT): 15 July 2026
      const summerDt = DateTime.fromISO('2026-07-15T18:00:00.000Z', { zone: 'America/Los_Angeles' });
      expect(summerDt.offset).toBe(-420);
      expect(summerDt.isInDST).toBe(true);
      expect(getTimezoneAbbreviation(summerDt)).toBe('PDT');
    });
  });

  describe('5. US Spring-Forward Transition (America/New_York on 2026-03-08)', () => {
    it('detects that clocks jump 02:00 -> 03:00 and local 02:30 AM is nonexistent', () => {
      // 01:59 AM is in EST (UTC-5)
      const beforeJump = DateTime.fromISO('2026-03-08T01:59:00', { zone: 'America/New_York' });
      expect(beforeJump.offset).toBe(-300);
      expect(beforeJump.isInDST).toBe(false);

      // 03:01 AM is in EDT (UTC-4)
      const afterJump = DateTime.fromISO('2026-03-08T03:01:00', { zone: 'America/New_York' });
      expect(afterJump.offset).toBe(-240);
      expect(afterJump.isInDST).toBe(true);

      // 02:30 AM is a nonexistent local time
      expect(isNonexistentLocalTime('2026-03-08', '02:30', 'America/New_York')).toBe(true);
      // 04:00 AM is a valid local time
      expect(isNonexistentLocalTime('2026-03-08', '04:00', 'America/New_York')).toBe(false);
    });
  });

  describe('6. US Fall-Back Transition (America/New_York on 2026-11-01)', () => {
    it('detects that clocks repeat 01:00-02:00 and transition from EDT back to EST', () => {
      // 00:30 AM is in EDT (UTC-4)
      const beforeFallBack = DateTime.fromISO('2026-11-01T00:30:00', { zone: 'America/New_York' });
      expect(beforeFallBack.offset).toBe(-240);
      expect(beforeFallBack.isInDST).toBe(true);

      // 03:30 AM is in EST (UTC-5)
      const afterFallBack = DateTime.fromISO('2026-11-01T03:30:00', { zone: 'America/New_York' });
      expect(afterFallBack.offset).toBe(-300);
      expect(afterFallBack.isInDST).toBe(false);

      // 01:30 AM is ambiguous as it occurs twice during fall-back
      expect(isAmbiguousLocalTime('2026-11-01', '01:30', 'America/New_York')).toBe(true);
    });
  });

  describe('7. UK Spring-Forward Transition (Europe/London on 2026-03-29)', () => {
    it('detects that clocks jump 01:00 -> 02:00 and transition from GMT to BST', () => {
      // 00:59 GMT (UTC+0)
      const beforeJump = DateTime.fromISO('2026-03-29T00:59:00', { zone: 'Europe/London' });
      expect(beforeJump.offset).toBe(0);
      expect(beforeJump.isInDST).toBe(false);

      // 02:01 BST (UTC+1)
      const afterJump = DateTime.fromISO('2026-03-29T02:01:00', { zone: 'Europe/London' });
      expect(afterJump.offset).toBe(60);
      expect(afterJump.isInDST).toBe(true);

      // 01:30 is nonexistent during UK spring-forward
      expect(isNonexistentLocalTime('2026-03-29', '01:30', 'Europe/London')).toBe(true);
    });
  });

  describe('8. UK Fall-Back Transition (Europe/London on 2026-10-25)', () => {
    it('detects that clocks repeat 01:00-02:00 and transition from BST back to GMT', () => {
      // 00:30 BST (UTC+1)
      const beforeFallBack = DateTime.fromISO('2026-10-25T00:30:00', { zone: 'Europe/London' });
      expect(beforeFallBack.offset).toBe(60);
      expect(beforeFallBack.isInDST).toBe(true);

      // 03:30 GMT (UTC+0)
      const afterFallBack = DateTime.fromISO('2026-10-25T03:30:00', { zone: 'Europe/London' });
      expect(afterFallBack.offset).toBe(0);
      expect(afterFallBack.isInDST).toBe(false);

      expect(isAmbiguousLocalTime('2026-10-25', '01:30', 'Europe/London')).toBe(true);
    });
  });

  describe('9. Invalid IANA Timezone Validation & Rejection', () => {
    it('correctly validates valid IANA timezones and rejects invalid strings', () => {
      expect(isValidIanaTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidIanaTimezone('Europe/London')).toBe(true);
      expect(isValidIanaTimezone('America/New_York')).toBe(true);
      expect(isValidIanaTimezone('America/Los_Angeles')).toBe(true);

      expect(isValidIanaTimezone('Invalid/City_Name')).toBe(false);
      expect(isValidIanaTimezone('GMT+5')).toBe(false);
      expect(isValidIanaTimezone('')).toBe(false);
      expect(isValidIanaTimezone(null)).toBe(false);
    });

    it('returns HTTP 400 Bad Request when an invalid timezone is queried on /api/slots', async () => {
      const res = await request(app).get('/api/slots').query({
        date: '2026-11-20',
        timezone: 'Mars/Olympus_Mons',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or unsupported IANA timezone');
    });

    it('returns HTTP 400 Bad Request when an invalid timezone is posted on /api/bookings', async () => {
      const res = await request(app).post('/api/bookings').send({
        parentName: 'Test Parent',
        parentEmail: 'tztest.parent@example.com',
        parentTimezone: 'Invalid/Zone',
        startAt: '2026-11-20T14:00:00.000Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('10. India Midnight Calendar-Day Boundary Handling', () => {
    it('correctly maps late-night slot (23:30 IST) to the current India calendar day limit', () => {
      // 23:30 IST on 2026-12-15 corresponds to 18:00 UTC on 2026-12-15
      const startUtc = new Date('2026-12-15T18:00:00.000Z');
      const { istDate, dayStartUtc, dayEndUtc } = getIstDayBoundaries(startUtc);

      expect(istDate).toBe('2026-12-15');
      expect(dayStartUtc.toISOString()).toBe('2026-12-14T18:30:00.000Z');
      expect(dayEndUtc.toISOString()).toBe('2026-12-15T18:29:59.999Z');
    });

    it('correctly maps post-midnight slot (00:30 IST) to the new India calendar day', () => {
      // 00:30 IST on 2026-12-16 corresponds to 19:00 UTC on 2026-12-15
      const startUtc = new Date('2026-12-15T19:00:00.000Z');
      const { istDate } = getIstDayBoundaries(startUtc);

      expect(istDate).toBe('2026-12-16');
    });
  });

  describe('11. Multi-Timezone Dual Local Time Representation', () => {
    it('represents the identical UTC instant with accurate localized times for both parent and mentor', () => {
      const startUtc = new Date('2026-11-20T14:00:00.000Z');
      const endUtc = new Date('2026-11-20T14:50:00.000Z');

      const parentTimezone = 'America/New_York';
      const mentorTimezone = 'Asia/Kolkata';

      const parentLocal = formatLocalizedInterval(startUtc, endUtc, parentTimezone);
      const mentorLocal = formatLocalizedInterval(startUtc, endUtc, mentorTimezone);

      // In November, New York is in EST (UTC-5): 14:00 UTC = 09:00 AM EST
      expect(parentLocal).toContain('09:00 AM - 09:50 AM EST (20 Nov 2026)');

      // In India (UTC+5:30): 14:00 UTC = 07:30 PM IST
      expect(mentorLocal).toContain('07:30 PM - 08:20 PM IST (20 Nov 2026)');
    });

    it('verifies that booking API returns matching dual localized strings in response', async () => {
      const res = await request(app).post('/api/bookings').send({
        parentName: 'Dual Time Test Parent',
        parentEmail: 'tztest.dual@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-11-22T10:00:00.000Z',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parentLocalTime).toContain('10:00 AM - 10:50 AM GMT');
      expect(res.body.data.mentorLocalTime).toContain('03:30 PM - 04:20 PM IST');
    });
  });
});
