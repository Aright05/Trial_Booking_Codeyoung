import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectPostgres, query, pool } from '../config/postgres.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';
import { seedPostgresMentors } from '../scripts/seedPostgresMentors.js';
import { createBooking } from '../services/booking.service.js';
import { config } from '../config/env.js';

const ADMIN_KEY = config.adminApiKey || 'codeyoung-admin-secret-dev';

describe('Step 6: Admin Dashboard & Operations Integration Tests', () => {
  beforeAll(async () => {
    await connectPostgres();
    await initPostgresSchema();
    await seedPostgresMentors();
    await query('UPDATE mentors SET is_active = true').catch(() => {});
  });

  afterAll(async () => {
    await query("DELETE FROM bookings WHERE parent_email LIKE '%admintest%'").catch(() => {});
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%admintest%'").catch(() => {});
    if (pool?.end) await pool.end().catch(() => {});
  });

  describe('1. Security & Authentication Authorization', () => {
    it('6. Unauthorized users cannot access protected admin endpoints (missing key)', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('rejects requests with invalid admin API key', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', 'wrong-invalid-secret-key');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows access with valid x-admin-key header', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', ADMIN_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalBookings');
    });

    it('allows access with valid Authorization Bearer token', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${ADMIN_KEY}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Dashboard Statistics Endpoint (GET /api/admin/stats)', () => {
    it('1. Dashboard statistics use real PostgreSQL data', async () => {
      // Create a test booking
      const booking = await createBooking({
        parentName: 'Stats Parent Test',
        parentEmail: 'stats.admintest@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-12-15T14:00:00.000Z',
      });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', ADMIN_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBookings).toBeGreaterThanOrEqual(1);
      expect(res.body.data.confirmedBookings).toBeGreaterThanOrEqual(1);
      expect(res.body.data.activeMentors).toBe(10);
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data.notifications).toHaveProperty('sent');
      expect(res.body.data.notifications).toHaveProperty('pending');
      expect(res.body.data.notifications).toHaveProperty('failed');
    });
  });

  describe('3. Filtered & Paginated Bookings (GET /api/admin/bookings)', () => {
    it('2. Filters bookings by status, search keyword, and mentor', async () => {
      const booking = await createBooking({
        parentName: 'Filter Search UniqueName',
        parentEmail: 'filtersearch.admintest@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-12-16T10:00:00.000Z',
      });

      // Search by parent name
      const searchRes = await request(app)
        .get('/api/admin/bookings')
        .query({ search: 'UniqueName' })
        .set('x-admin-key', ADMIN_KEY);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.success).toBe(true);
      expect(searchRes.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.body.data.bookings[0].parentName).toContain('Filter Search UniqueName');
      expect(searchRes.body.data.bookings[0]).toHaveProperty('parentLocalTime');
      expect(searchRes.body.data.bookings[0]).toHaveProperty('mentorLocalTime');
      expect(searchRes.body.data.bookings[0]).toHaveProperty('notification');

      // Filter by confirmed status
      const statusRes = await request(app)
        .get('/api/admin/bookings')
        .query({ status: 'confirmed' })
        .set('x-admin-key', ADMIN_KEY);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.bookings.every((b) => b.status === 'confirmed')).toBe(true);
    });

    it('3. Pagination works correctly with limit and page navigation', async () => {
      const res = await request(app)
        .get('/api/admin/bookings')
        .query({ page: 1, limit: 2 })
        .set('x-admin-key', ADMIN_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBeLessThanOrEqual(2);
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination).toHaveProperty('totalPages');
    });
  });

  describe('4. Mentor Daily Capacity & Schedule (GET /api/admin/mentors)', () => {
    it('4. Calculates mentor capacity correctly for the specified India calendar day', async () => {
      const targetDate = '2026-12-18';

      // Create a booking on target date
      const booking = await createBooking({
        parentName: 'Mentor Capacity Parent',
        parentEmail: 'mentorcap.admintest@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: '2026-12-18T05:30:00.000Z', // 11:00 AM IST on 2026-12-18
      });

      const res = await request(app)
        .get('/api/admin/mentors')
        .query({ date: targetDate })
        .set('x-admin-key', ADMIN_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe(targetDate);
      expect(res.body.data.maxDailyCapacity).toBe(2);
      expect(Array.isArray(res.body.data.mentors)).toBe(true);
      expect(res.body.data.mentors.length).toBe(10);

      // Find the assigned mentor
      const assignedMentorInReport = res.body.data.mentors.find((m) => m.id === booking.mentor.id);
      expect(assignedMentorInReport).toBeDefined();
      expect(assignedMentorInReport.bookedCountToday).toBeGreaterThanOrEqual(1);
      expect(assignedMentorInReport.remainingCapacity).toBeLessThanOrEqual(1);
      expect(assignedMentorInReport.appointments.length).toBeGreaterThanOrEqual(1);
      expect(assignedMentorInReport.appointments[0].bookingReference).toBe(booking.bookingReference);
    });
  });

  describe('5. Safe Booking Cancellation & Capacity Release', () => {
    it('5. Cancels booking, releases mentor capacity, and blocks double-cancellation', async () => {
      const startAt = '2026-12-20T14:00:00.000Z';
      const booking = await createBooking({
        parentName: 'Cancellation Parent Test',
        parentEmail: 'canceltest.admintest@example.com',
        parentTimezone: 'Europe/London',
        startAt,
      });

      // 1. Cancel the booking
      const cancelRes = await request(app)
        .post(`/api/admin/bookings/${booking.bookingReference}/cancel`)
        .send({ reason: 'Parent requested schedule change' })
        .set('x-admin-key', ADMIN_KEY);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('cancelled');
      expect(cancelRes.body.data.cancellationReason).toBe('Parent requested schedule change');

      // 2. Double cancellation attempt should be rejected with HTTP 400
      const doubleCancelRes = await request(app)
        .post(`/api/admin/bookings/${booking.bookingReference}/cancel`)
        .send({ reason: 'Trying to cancel again' })
        .set('x-admin-key', ADMIN_KEY);

      expect(doubleCancelRes.status).toBe(400);
      expect(doubleCancelRes.body.success).toBe(false);
      expect(doubleCancelRes.body.message).toContain('already cancelled');

      // 3. Verify slot availability is released
      const slotsRes = await request(app)
        .get('/api/slots')
        .query({ date: '2026-12-20', timezone: 'Europe/London' });

      expect(slotsRes.status).toBe(200);
      expect(slotsRes.body.success).toBe(true);
    });
  });

  describe('6. Empty Database / Filter States', () => {
    it('7. Handles empty search results gracefully without crashing', async () => {
      const res = await request(app)
        .get('/api/admin/bookings')
        .query({ search: 'NonExistentParentNameXYZ999' })
        .set('x-admin-key', ADMIN_KEY);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });
});
