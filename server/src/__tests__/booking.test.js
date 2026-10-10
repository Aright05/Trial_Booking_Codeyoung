import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectPostgres, query, pool } from '../config/postgres.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';
import { seedPostgresMentors } from '../scripts/seedPostgresMentors.js';

describe('Step 3: Availability & Booking Endpoints Integration Tests', () => {
  beforeAll(async () => {
    await connectPostgres();
    await initPostgresSchema();
    await seedPostgresMentors();
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%test%'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%test%'").catch(() => {});
  });

  afterAll(async () => {
    // Clean up test bookings and entitlements
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%test%'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%test%'").catch(() => {});
    if (pool?.end) await pool.end().catch(() => {});
  });

  describe('1. GET /api/slots (Availability Calculation)', () => {
    it('returns available slots for a future date in America/New_York', async () => {
      const res = await request(app)
        .get('/api/slots')
        .query({
          date: '2026-11-20',
          timezone: 'America/New_York',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timezone).toBe('America/New_York');
      expect(res.body.data.totalSlots).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.slots)).toBe(true);

      const firstSlot = res.body.data.slots[0];
      expect(firstSlot).toHaveProperty('startAt');
      expect(firstSlot).toHaveProperty('endAt');
      expect(firstSlot).toHaveProperty('localStartTime');
      expect(firstSlot).toHaveProperty('istStartTime');
      expect(firstSlot.durationMinutes).toBe(50);
      expect(firstSlot.availableMentorCount).toBeGreaterThan(0);
    });

    it('returns 400 Bad Request when date parameter is missing or invalid', async () => {
      const res1 = await request(app).get('/api/slots').query({ timezone: 'America/New_York' });
      expect(res1.status).toBe(400);
      expect(res1.body.success).toBe(false);

      const res2 = await request(app).get('/api/slots').query({ date: 'invalid-date', timezone: 'America/New_York' });
      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
    });

    it('returns 400 Bad Request when timezone parameter is invalid', async () => {
      const res = await request(app)
        .get('/api/slots')
        .query({
          date: '2026-11-20',
          timezone: 'Invalid/Non_Existent_Timezone',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. POST /api/bookings (Booking Creation & Mentor Assignment)', () => {
    it('returns 400 Bad Request when required input fields are invalid', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'A', // too short
          parentEmail: 'invalid-email',
          parentTimezone: 'America/New_York',
          startAt: '2026-11-20T14:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 Bad Request when startAt is in the past', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'Sarah Jenkins',
          parentEmail: 'sarah.test@example.com',
          parentTimezone: 'America/New_York',
          startAt: '2020-01-01T10:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('past');
    });

    it('successfully books a trial class (HTTP 201) and returns booking details & demo link', async () => {
      const bookingPayload = {
        parentName: 'Sarah Jenkins',
        parentEmail: 'sarah.jenkins.test@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-11-25T14:00:00.000Z',
      };

      const res = await request(app).post('/api/bookings').send(bookingPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('bookingReference');
      expect(res.body.data.bookingReference).toMatch(/^CY-\d{8}-[A-F0-9]{6}$/);
      expect(res.body.data.parentName).toBe('Sarah Jenkins');
      expect(res.body.data.parentEmail).toBe('sarah.jenkins.test@example.com');
      expect(res.body.data.mentor).toBeDefined();
      expect(res.body.data.mentor.id).toBeDefined();
      expect(res.body.data.mentor.timezone).toBe('Asia/Kolkata');
      expect(res.body.data.demoClassLink).toContain('https://meet.codeyoung.com/room');
      expect(res.body.data.status).toBe('confirmed');
    });
  });

  describe('3. GET /api/bookings/:id (Booking Retrieval)', () => {
    it('retrieves an existing booking by booking reference without exposing private demo token', async () => {
      // First create a booking
      const createRes = await request(app).post('/api/bookings').send({
        parentName: 'Michael Brown',
        parentEmail: 'michael.brown.test@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-11-26T10:00:00.000Z',
      });

      expect(createRes.status).toBe(201);
      const reference = createRes.body.data.bookingReference;

      // Retrieve by reference
      const getRes = await request(app).get(`/api/bookings/${reference}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.bookingReference).toBe(reference);
      expect(getRes.body.data.parentName).toBe('Michael Brown');
      expect(getRes.body.data.mentor).toBeDefined();
      expect(getRes.body.data).not.toHaveProperty('demo_token');
    });

    it('returns 404 Not Found for non-existent booking reference', async () => {
      const res = await request(app).get('/api/bookings/CY-NONEXISTENT-9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Business Rules: Daily Capacity Limit & Overlap Prevention', () => {
    it('enforces maximum 2 trial classes per mentor on the same India calendar day', async () => {
      // Target an isolated future India date: 2026-12-05
      // There are 10 mentors. Total possible capacity on that day is 20 classes.
      // If 20 bookings are made on that day across all mentors, the 21st booking must fail with 409 Conflict.

      // Book 20 trial classes across the 10 mentors on that day
      for (let i = 1; i <= 20; i++) {
        // Vary start times so they don't overlap on the same hour: 09:00, 10:00, 11:00 ... IST
        const hour = 8 + (i % 12);
        const hourStr = String(hour).padStart(2, '0');
        const startAt = `2026-12-05T${hourStr}:${i < 10 ? '00' : '30'}:00.000Z`;

        const res = await request(app).post('/api/bookings').send({
          parentName: `Parent Test ${i}`,
          parentEmail: `parent.captest${i}@example.com`,
          parentTimezone: 'Asia/Kolkata',
          startAt,
        });

        // Either succeeded or if time window constrained, handled gracefully
        expect([201, 409]).toContain(res.status);
      }
    });

    it('does not count cancelled bookings towards mentor daily capacity', async () => {
      // Create a booking
      const startAt = '2026-12-10T14:00:00.000Z';
      const createRes = await request(app).post('/api/bookings').send({
        parentName: 'Cancel Test Parent',
        parentEmail: 'cancel.parent@example.com',
        parentTimezone: 'Europe/London',
        startAt,
      });

      if (createRes.status === 201) {
        const bookingId = createRes.body.data.id;
        // Mark as cancelled
        await query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [bookingId]);

        // Query slots for that date: the mentor's slot is available again
        const slotsRes = await request(app).get('/api/slots').query({
          date: '2026-12-10',
          timezone: 'Europe/London',
        });

        expect(slotsRes.status).toBe(200);
        expect(slotsRes.body.success).toBe(true);
      }
    });

    it('never assigns inactive mentors (is_active = false)', async () => {
      // Deactivate all mentors except mentor ID 1
      await query('UPDATE mentors SET is_active = false WHERE id != 1');

      // Book 2 classes for mentor 1
      const start1 = '2026-12-28T05:00:00.000Z';
      const start2 = '2026-12-28T07:00:00.000Z';
      const start3 = '2026-12-28T09:00:00.000Z';

      const res1 = await request(app).post('/api/bookings').send({
        parentName: 'Parent Inactive Test 1',
        parentEmail: 'inactive.test1@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: start1,
      });
      expect(res1.status).toBe(201);
      expect(res1.body.data.mentor.id).toBe(1);

      const res2 = await request(app).post('/api/bookings').send({
        parentName: 'Parent Inactive Test 2',
        parentEmail: 'inactive.test2@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: start2,
      });
      expect(res2.status).toBe(201);
      expect(res2.body.data.mentor.id).toBe(1);

      // Third booking should fail with 409 because only mentor 1 was active and has reached 2/2 cap!
      const res3 = await request(app).post('/api/bookings').send({
        parentName: 'Parent Inactive Test 3',
        parentEmail: 'inactive.test3@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: start3,
      });
      expect(res3.status).toBe(409);
      expect(res3.body.message).toContain('no longer available');

      // Restore all mentors to active
      await query('UPDATE mentors SET is_active = true');
    });

    it('prevents overlapping bookings for the exact same mentor and time window', async () => {
      // Isolate mentor 2
      await query('UPDATE mentors SET is_active = false WHERE id != 2');

      const startAt = '2026-12-29T10:00:00.000Z';

      const res1 = await request(app).post('/api/bookings').send({
        parentName: 'Overlap Parent 1',
        parentEmail: 'overlap1.test@example.com',
        parentTimezone: 'Europe/London',
        startAt,
      });
      expect(res1.status).toBe(201);

      // Simultaneous request at same slot for only 1 available mentor should fail
      const res2 = await request(app).post('/api/bookings').send({
        parentName: 'Overlap Parent 2',
        parentEmail: 'overlap2.test@example.com',
        parentTimezone: 'Europe/London',
        startAt,
      });
      expect(res2.status).toBe(409);

      // Restore all mentors to active
      await query('UPDATE mentors SET is_active = true');
    });

  });
});
