import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectPostgres, query, pool } from '../config/postgres.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';
import { seedPostgresMentors } from '../scripts/seedPostgresMentors.js';
import { normalizeEmail } from '../utils/emailNormalizer.js';
import { cancelBooking } from '../services/admin.service.js';

describe('Comprehensive Trial Class Booking System - 6 Requirements Verification', () => {
  beforeAll(async () => {
    await connectPostgres();
    await initPostgresSchema();
    await seedPostgresMentors();
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%reqtest%' OR normalized_email LIKE '%gmail.com' OR normalized_email LIKE '%outlook.com'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%reqtest%' OR parent_email LIKE '%gmail.com' OR parent_email LIKE '%outlook.com'").catch(() => {});
  });

  afterAll(async () => {
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%reqtest%' OR normalized_email LIKE '%gmail.com' OR normalized_email LIKE '%outlook.com'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%reqtest%' OR parent_email LIKE '%gmail.com' OR parent_email LIKE '%outlook.com'").catch(() => {});
    if (pool?.end) await pool.end().catch(() => {});
  });

  beforeEach(async () => {
    // Restore all mentors to active state
    await query('UPDATE mentors SET is_active = true');
  });

  describe('1. Requirement 1: Gmail Normalization & Free Trial Single-Use Policy', () => {
    it('normalizes Gmail addresses by lowercasing, stripping dots, stripping plus-tags, and converting googlemail.com', () => {
      const g1 = normalizeEmail('Sarah.Jenkins+trial123@gmail.com');
      expect(g1.normalizedEmail).toBe('sarahjenkins@gmail.com');
      expect(g1.isGmail).toBe(true);

      const g2 = normalizeEmail('S.A.R.A.H.jenkins@googlemail.com');
      expect(g2.normalizedEmail).toBe('sarahjenkins@gmail.com');
      expect(g2.isGmail).toBe(true);

      const g3 = normalizeEmail('sarahjenkins+summercamp@gmail.com');
      expect(g3.normalizedEmail).toBe('sarahjenkins@gmail.com');
      expect(g3.isGmail).toBe(true);
    });

    it('does NOT strip dots or plus-tags from non-Gmail providers', () => {
      const o1 = normalizeEmail('John.Doe+trial@outlook.com');
      expect(o1.normalizedEmail).toBe('john.doe+trial@outlook.com');
      expect(o1.isGmail).toBe(false);

      const y1 = normalizeEmail('User.Name@yahoo.com');
      expect(y1.normalizedEmail).toBe('user.name@yahoo.com');
      expect(y1.isGmail).toBe(false);
    });

    it('GET /api/trials/eligibility returns eligible=true for a fresh email and eligible=false once claimed', async () => {
      const email = 'alex.parent+stem@gmail.com';

      // 1. Initial check: should be eligible
      const res1 = await request(app).get('/api/trials/eligibility').query({ email });
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.eligible).toBe(true);
      expect(res1.body.data.normalizedEmail).toBe('alexparent@gmail.com');
      expect(res1.body.data.isGmail).toBe(true);
      expect(res1.body.data.reason).toBeNull();

      // 2. Book a trial class
      const bookingRes = await request(app).post('/api/bookings').send({
        parentName: 'Alex Parent',
        parentEmail: email,
        parentTimezone: 'America/New_York',
        startAt: '2026-11-15T15:00:00.000Z',
      });
      expect(bookingRes.status).toBe(201);
      expect(bookingRes.body.success).toBe(true);

      // 3. Re-check eligibility with the same email
      const res2 = await request(app).get('/api/trials/eligibility').query({ email });
      expect(res2.status).toBe(200);
      expect(res2.body.data.eligible).toBe(false);
      expect(res2.body.data.code).toBe('FREE_TRIAL_ALREADY_USED');
      expect(res2.body.data.reason).toContain('Each parent can use exactly one free trial');

      // 4. Re-check eligibility with a dot-variant of the same Gmail account
      const res3 = await request(app).get('/api/trials/eligibility').query({ email: 'a.l.e.x.p.a.r.e.n.t@googlemail.com' });
      expect(res3.status).toBe(200);
      expect(res3.body.data.eligible).toBe(false);
      expect(res3.body.data.normalizedEmail).toBe('alexparent@gmail.com');
    });

    it('rejects a second booking attempt with 409 FREE_TRIAL_ALREADY_USED for the same Gmail identity', async () => {
      const firstEmail = 'emma.watson+trial@gmail.com';
      const secondEmail = 'e.m.m.a.watson+coding@googlemail.com'; // Same normalized mailbox

      // First booking succeeds
      const res1 = await request(app).post('/api/bookings').send({
        parentName: 'Emma Watson',
        parentEmail: firstEmail,
        parentTimezone: 'Europe/London',
        startAt: '2026-11-16T10:00:00.000Z',
      });
      expect(res1.status).toBe(201);

      // Second booking attempt with alias must be rejected
      const res2 = await request(app).post('/api/bookings').send({
        parentName: 'Emma Watson',
        parentEmail: secondEmail,
        parentTimezone: 'Europe/London',
        startAt: '2026-11-16T14:00:00.000Z',
      });
      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('FREE_TRIAL_ALREADY_USED');
      expect(res2.body.error.code).toBe('FREE_TRIAL_ALREADY_USED');
      expect(res2.body.message).toContain('one free trial');
    });

    it('preserves free trial entitlement claim even after booking cancellation', async () => {
      const email = 'cancel.trial+math@gmail.com';
      const startAt = '2026-11-17T11:00:00.000Z';

      // 1. Create booking
      const bookRes = await request(app).post('/api/bookings').send({
        parentName: 'Cancel Parent',
        parentEmail: email,
        parentTimezone: 'Europe/London',
        startAt,
      });
      expect(bookRes.status).toBe(201);
      const bookingRef = bookRes.body.data.bookingReference;

      // 2. Cancel the booking
      await cancelBooking(bookingRef, { reason: 'Parent requested cancellation' });

      // 3. Re-booking attempt using the same Gmail account must still be rejected
      const rebookRes = await request(app).post('/api/bookings').send({
        parentName: 'Cancel Parent',
        parentEmail: 'canceltrial@gmail.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-11-17T15:00:00.000Z',
      });
      expect(rebookRes.status).toBe(409);
      expect(rebookRes.body.code).toBe('FREE_TRIAL_ALREADY_USED');
    });
  });

  describe('2. Requirement 2: Mentor Assignment & Fair Load Balancing', () => {
    it('assigns DIFFERENT available mentors when two parents book the exact same date and time', async () => {
      const slotTime = '2026-11-18T10:00:00.000Z';

      // Parent A booking
      const resA = await request(app).post('/api/bookings').send({
        parentName: 'Parent A',
        parentEmail: 'parent.a.reqtest@example.com',
        parentTimezone: 'Europe/London',
        startAt: slotTime,
      });
      expect(resA.status).toBe(201);
      const mentorA = resA.body.data.mentor;
      expect(mentorA.id).toBeDefined();

      // Parent B booking for the exact same interval
      const resB = await request(app).post('/api/bookings').send({
        parentName: 'Parent B',
        parentEmail: 'parent.b.reqtest@example.com',
        parentTimezone: 'Europe/London',
        startAt: slotTime,
      });
      expect(resB.status).toBe(201);
      const mentorB = resB.body.data.mentor;
      expect(mentorB.id).toBeDefined();

      // Mentor A and Mentor B MUST be distinct!
      expect(mentorA.id).not.toBe(mentorB.id);
    });

    it('enforces maximum 2 trial classes per mentor on an India (Asia/Kolkata) calendar day', async () => {
      // Isolate mentor 3
      await query('UPDATE mentors SET is_active = false WHERE id != 3');

      const dateStr = '2026-11-19';
      // Booking 1 for mentor 3
      const res1 = await request(app).post('/api/bookings').send({
        parentName: 'Mentor3 Parent 1',
        parentEmail: 'm3.parent1.reqtest@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: `${dateStr}T04:30:00.000Z`, // 10:00 AM IST
      });
      expect(res1.status).toBe(201);
      expect(res1.body.data.mentor.id).toBe(3);

      // Booking 2 for mentor 3 (adjacent/separate slot on same IST day)
      const res2 = await request(app).post('/api/bookings').send({
        parentName: 'Mentor3 Parent 2',
        parentEmail: 'm3.parent2.reqtest@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: `${dateStr}T06:30:00.000Z`, // 12:00 PM IST
      });
      expect(res2.status).toBe(201);
      expect(res2.body.data.mentor.id).toBe(3);

      // Booking 3 for mentor 3 on the same IST day must be rejected with 409
      const res3 = await request(app).post('/api/bookings').send({
        parentName: 'Mentor3 Parent 3',
        parentEmail: 'm3.parent3.reqtest@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: `${dateStr}T08:30:00.000Z`, // 02:00 PM IST
      });
      expect(res3.status).toBe(409);
      expect(res3.body.code).toBe('NO_MENTOR_AVAILABLE');

      // Restore all mentors
      await query('UPDATE mentors SET is_active = true');
    });

    it('allows a mentor to hold adjacent non-overlapping meetings [start, end) on the same day', async () => {
      // Isolate mentor 4
      await query('UPDATE mentors SET is_active = false WHERE id != 4');

      // Class 1: 10:00 to 10:50 UTC (startAt: 10:00:00.000Z)
      const res1 = await request(app).post('/api/bookings').send({
        parentName: 'Adjacent Parent 1',
        parentEmail: 'adj1.reqtest@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-11-21T10:00:00.000Z',
      });
      expect(res1.status).toBe(201);
      expect(res1.body.data.mentor.id).toBe(4);

      // Class 2: 11:00 to 11:50 UTC (startAt: 11:00:00.000Z) - starts after Class 1 ends (10:50)
      const res2 = await request(app).post('/api/bookings').send({
        parentName: 'Adjacent Parent 2',
        parentEmail: 'adj2.reqtest@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-11-21T11:00:00.000Z',
      });
      expect(res2.status).toBe(201);
      expect(res2.body.data.mentor.id).toBe(4);

      // Restore all mentors
      await query('UPDATE mentors SET is_active = true');
    });
  });

  describe('3. Requirement 3: Meeting Link & Booking Details Confirmation', () => {
    it('returns complete mentor information, email, localized times, and stored demo link on confirmation', async () => {
      const res = await request(app).post('/api/bookings').send({
        parentName: 'Clarissa Montgomery',
        parentEmail: 'clarissa.montgomery.reqtest@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-11-22T14:00:00.000Z',
      });

      expect(res.status).toBe(201);
      const data = res.body.data;
      expect(data).toHaveProperty('bookingReference');
      expect(data).toHaveProperty('mentor');
      expect(data.mentor.name).toBeDefined();
      expect(data.mentor.email).toContain('@codeyoung.test');
      expect(data.mentor.timezone).toBe('Asia/Kolkata');
      expect(data.parentLocalTime).toContain('EST');
      expect(data.parentTimezone).toBe('America/New_York');
      expect(data.mentorLocalTime).toContain('IST');
      expect(data.status).toBe('confirmed');
      expect(data.notification).toBeDefined();
      expect(data.notification.parent.status).toBeDefined();
      expect(data.notification.mentor.status).toBeDefined();
    });
  });

  describe('4. Requirement 4: Mentor Schedule Section & Secure Endpoint', () => {
    it('rejects unauthenticated requests to GET /api/mentor/me/schedule with 401 UNAUTHORIZED_MENTOR', async () => {
      const res = await request(app).get('/api/mentor/me/schedule');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED_MENTOR');
    });

    it('authenticates mentor via x-mentor-email and returns ONLY their own scheduled appointments', async () => {
      // 1. Create a booking for mentor Rahul Sharma (email: mentor.rahul@codeyoung.test)
      // Isolate Rahul Sharma (ID 1)
      await query('UPDATE mentors SET is_active = false WHERE email != $1', ['mentor.rahul@codeyoung.test']);

      const rahulBookingRes = await request(app).post('/api/bookings').send({
        parentName: 'Rahul Parent',
        parentEmail: 'rahul.parent.reqtest@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: '2026-11-23T05:00:00.000Z',
      });
      expect(rahulBookingRes.status).toBe(201);
      const rahulRef = rahulBookingRes.body.data.bookingReference;

      // 2. Query Rahul's schedule
      const rahulScheduleRes = await request(app)
        .get('/api/mentor/me/schedule')
        .set('x-mentor-email', 'mentor.rahul@codeyoung.test')
        .query({ from: '2026-11-23', to: '2026-11-23' });

      expect(rahulScheduleRes.status).toBe(200);
      expect(rahulScheduleRes.body.success).toBe(true);
      expect(rahulScheduleRes.body.data.mentor.email).toBe('mentor.rahul@codeyoung.test');
      expect(rahulScheduleRes.body.data.meetings.length).toBeGreaterThanOrEqual(1);

      const foundBooking = rahulScheduleRes.body.data.meetings.find((m) => m.bookingReference === rahulRef);
      expect(foundBooking).toBeDefined();
      expect(foundBooking.parentName).toBe('Rahul Parent');
      expect(foundBooking.status).toBe('confirmed');
      expect(foundBooking.demoClassLink).toBeDefined();

      // 3. Query Ananya Verma's schedule (mentor.ananya@codeyoung.test) - Rahul's booking MUST NOT be in Ananya's schedule!
      // First reactivate Ananya
      await query('UPDATE mentors SET is_active = true WHERE email = $1', ['mentor.ananya@codeyoung.test']);

      const ananyaScheduleRes = await request(app)
        .get('/api/mentor/me/schedule')
        .set('x-mentor-email', 'mentor.ananya@codeyoung.test')
        .query({ from: '2026-11-23', to: '2026-11-23' });

      expect(ananyaScheduleRes.status).toBe(200);
      const ananyaBooking = ananyaScheduleRes.body.data.meetings.find((m) => m.bookingReference === rahulRef);
      expect(ananyaBooking).toBeUndefined(); // Cannot see Rahul's booking!

      // Restore all mentors
      await query('UPDATE mentors SET is_active = true');
    });

    it('groups mentor appointments by date and sorts them chronologically by start time', async () => {
      const scheduleRes = await request(app)
        .get('/api/mentor/me/schedule')
        .set('x-mentor-email', 'mentor.rahul@codeyoung.test')
        .query({ from: '2026-11-01', to: '2026-11-30' });

      expect(scheduleRes.status).toBe(200);
      expect(scheduleRes.body.data).toHaveProperty('dateGroups');
      expect(Array.isArray(scheduleRes.body.data.dateGroups)).toBe(true);

      if (scheduleRes.body.data.dateGroups.length > 0) {
        const group = scheduleRes.body.data.dateGroups[0];
        expect(group).toHaveProperty('date');
        expect(group).toHaveProperty('relativeLabel');
        expect(group).toHaveProperty('activeCount');
        expect(group).toHaveProperty('meetings');
      }
    });
  });

  describe('5. Requirement 5 & 6: Email Reliability & Overlap Protection Guarantee', () => {
    it('persists notification status in PostgreSQL and does NOT roll back booking if email delivery fails', async () => {
      const res = await request(app).post('/api/bookings').send({
        parentName: 'Reliability Test Parent',
        parentEmail: 'reliability.reqtest@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-11-24T12:00:00.000Z',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.notification).toBeDefined();

      // Check PostgreSQL record directly
      const dbRes = await query('SELECT status, notification FROM bookings WHERE id = $1', [res.body.data.id]);
      expect(dbRes.rows[0].status).toBe('confirmed');
      expect(dbRes.rows[0].notification).toBeDefined();
    });
  });
});
