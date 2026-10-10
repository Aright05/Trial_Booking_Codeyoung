import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectPostgres, query, pool } from '../config/postgres.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';
import { seedPostgresMentors } from '../scripts/seedPostgresMentors.js';
import {
  buildParentEmail,
  buildMentorEmail,
  sendBookingNotifications,
  setTestTransporter,
  resetTestTransporter,
} from '../services/email.service.js';
import { createBooking, getBookingByIdOrReference } from '../services/booking.service.js';

describe('Step 5: Email Notifications & Demo-Class Links', () => {
  beforeAll(async () => {
    await connectPostgres();
    await initPostgresSchema();
    await seedPostgresMentors();
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%emailtest%'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%emailtest%'").catch(() => {});
  });

  afterAll(async () => {
    resetTestTransporter();
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%emailtest%'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%emailtest%'").catch(() => {});
    if (pool?.end) await pool.end().catch(() => {});
  });

  beforeEach(async () => {
    resetTestTransporter();
    await query("DELETE FROM free_trial_entitlements WHERE normalized_email LIKE '%emailtest%'").catch(() => {});
    await query("DELETE FROM bookings WHERE parent_email LIKE '%emailtest%'").catch(() => {});
  });

  describe('1. Parent & Mentor Email Content & Timezone Formatting', () => {
    it('1. Parent email content uses the parent\'s selected timezone and includes all mandatory details', () => {
      // Slot: 2026-11-20T14:00:00.000Z (which is 09:00 AM EST in America/New_York)
      const startAt = new Date('2026-11-20T14:00:00.000Z');
      const endAt = new Date('2026-11-20T14:50:00.000Z');

      const email = buildParentEmail({
        parentName: 'Jennifer Miller',
        bookingReference: 'CY-20261120-A1B2C3',
        mentorName: 'Aarav Sharma',
        startAt,
        endAt,
        parentTimezone: 'America/New_York',
        demoClassLink: 'https://meet.codeyoung.com/room/CY-20261120-A1B2C3-test1234',
        durationMinutes: 50,
      });

      expect(email.subject).toContain('CY-20261120-A1B2C3');
      expect(email.subject).toContain('Aarav Sharma');
      
      // Text content checks
      expect(email.text).toContain('Jennifer Miller');
      expect(email.text).toContain('CY-20261120-A1B2C3');
      expect(email.text).toContain('Aarav Sharma');
      expect(email.text).toContain('09:00 AM - 09:50 AM');
      expect(email.text).toContain('America/New_York');
      expect(email.text).toContain('50 Minutes');
      expect(email.text).toContain('https://meet.codeyoung.com/room/CY-20261120-A1B2C3-test1234');
      expect(email.text).toContain('demonstration');

      // HTML content checks
      expect(email.html).toContain('Jennifer Miller');
      expect(email.html).toContain('CY-20261120-A1B2C3');
      expect(email.html).toContain('09:00 AM - 09:50 AM');
    });

    it('2. Mentor email content uses the mentor\'s timezone (Asia/Kolkata) and includes parent contact details', () => {
      // Slot: 2026-11-20T14:00:00.000Z (which is 07:30 PM IST in Asia/Kolkata)
      const startAt = new Date('2026-11-20T14:00:00.000Z');
      const endAt = new Date('2026-11-20T14:50:00.000Z');

      const email = buildMentorEmail({
        mentorName: 'Priya Patel',
        bookingReference: 'CY-20261120-A1B2C3',
        parentName: 'Jennifer Miller',
        parentEmail: 'jennifer.miller@example.com',
        startAt,
        endAt,
        mentorTimezone: 'Asia/Kolkata',
        demoClassLink: 'https://meet.codeyoung.com/room/CY-20261120-A1B2C3-test1234',
        durationMinutes: 50,
      });

      expect(email.subject).toContain('CY-20261120-A1B2C3');
      expect(email.subject).toContain('Jennifer Miller');

      // Text content checks
      expect(email.text).toContain('Priya Patel');
      expect(email.text).toContain('Jennifer Miller');
      expect(email.text).toContain('jennifer.miller@example.com');
      expect(email.text).toContain('07:30 PM - 08:20 PM');
      expect(email.text).toContain('Asia/Kolkata');
      expect(email.text).toContain('50 Minutes');
      expect(email.text).toContain('https://meet.codeyoung.com/room/CY-20261120-A1B2C3-test1234');
    });
  });

  describe('2. Demo-Class Link Uniqueness & Deterministic Consistency', () => {
    it('3. The same booking link is returned consistently on subsequent retrievals', async () => {
      const booking = await createBooking({
        parentName: 'Link Test Parent',
        parentEmail: 'link.emailtest1@example.com',
        parentTimezone: 'America/Chicago',
        startAt: '2026-12-01T15:00:00.000Z',
      });

      const initialLink = booking.demoClassLink;
      expect(initialLink).toBeDefined();
      expect(initialLink).toContain('CY-');

      // Retrieve by ID
      const retrievedById = await getBookingByIdOrReference(booking.id);
      expect(retrievedById.demoClassLink).toBe(initialLink);

      // Retrieve by reference
      const retrievedByRef = await getBookingByIdOrReference(booking.bookingReference);
      expect(retrievedByRef.demoClassLink).toBe(initialLink);
    });

    it('4. Each distinct booking receives a unique, non-guessable demo link', async () => {
      const booking1 = await createBooking({
        parentName: 'Unique Test 1',
        parentEmail: 'unique1.emailtest@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-12-02T14:00:00.000Z',
      });

      const booking2 = await createBooking({
        parentName: 'Unique Test 2',
        parentEmail: 'unique2.emailtest@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-12-02T15:00:00.000Z',
      });

      expect(booking1.demoClassLink).not.toEqual(booking2.demoClassLink);
      expect(booking1.bookingReference).not.toEqual(booking2.bookingReference);
    });
  });

  describe('3. Booking & Email Reliability, Fault Tolerance, and Idempotency', () => {
    it('5. SMTP failure does not roll back or fail a committed booking', async () => {
      // Mock a failing email transporter
      const mockFailingTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP connection refused: connect ECONNREFUSED 127.0.0.1:25')),
      };
      setTestTransporter(mockFailingTransporter);

      // Attempt booking creation
      const res = await request(app)
        .post('/api/bookings')
        .send({
          parentName: 'Fault Tolerance Parent',
          parentEmail: 'fault.emailtest@example.com',
          parentTimezone: 'Europe/London',
          startAt: '2026-12-03T11:00:00.000Z',
        });

      // Booking must still succeed (HTTP 201)
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.bookingReference).toBeDefined();

      // Notification status should reflect the failure safely
      expect(res.body.data.notification.status).toBe('failed');
      expect(res.body.data.notification.parent.status).toBe('failed');
      expect(res.body.data.notification.mentor.status).toBe('failed');

      // Verify booking exists in PostgreSQL
      const bookingInDb = await getBookingByIdOrReference(res.body.data.bookingReference);
      expect(bookingInDb).toBeDefined();
      expect(bookingInDb.status).toBe('confirmed');
    });

    it('6. Notification failure does not create duplicate bookings on retry', async () => {
      // Create initial booking with failing transporter
      const mockFailingTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP timeout')),
      };
      setTestTransporter(mockFailingTransporter);

      const booking = await createBooking({
        parentName: 'Retry Parent',
        parentEmail: 'retry.emailtest@example.com',
        parentTimezone: 'Asia/Kolkata',
        startAt: '2026-12-04T06:00:00.000Z',
      });

      const initialBookingId = booking.id;

      // Re-run notification dispatch after fixing transporter
      const sentEmails = [];
      const mockWorkingTransporter = {
        sendMail: vi.fn().mockImplementation(async (mailOptions) => {
          sentEmails.push(mailOptions);
          return { messageId: `<test-${Date.now()}@codeyoung.com>` };
        }),
      };
      setTestTransporter(mockWorkingTransporter);

      const retryResult = await sendBookingNotifications(booking.id);
      expect(retryResult.status).toBe('sent');
      expect(sentEmails.length).toBe(2); // 1 parent + 1 mentor

      // Verify no duplicate booking records exist for this email
      const dbRes = await query(
        "SELECT COUNT(*) as count FROM bookings WHERE parent_email = 'retry.emailtest@example.com'"
      );
      expect(parseInt(dbRes.rows[0].count, 10)).toBe(1);
    });

    it('7. Notification status is saved correctly in PostgreSQL', async () => {
      const sentEmails = [];
      const mockWorkingTransporter = {
        sendMail: vi.fn().mockImplementation(async (mailOptions) => {
          sentEmails.push(mailOptions);
          return { messageId: `<test-${Date.now()}@codeyoung.com>` };
        }),
      };
      setTestTransporter(mockWorkingTransporter);

      const booking = await createBooking({
        parentName: 'Status Test Parent',
        parentEmail: 'status.emailtest@example.com',
        parentTimezone: 'Europe/London',
        startAt: '2026-12-06T10:00:00.000Z',
      });

      expect(booking.notification.status).toBe('sent');
      expect(booking.notification.parent.status).toBe('sent');
      expect(booking.notification.mentor.status).toBe('sent');

      // Check raw JSONB in database
      const dbRes = await query('SELECT notification FROM bookings WHERE id = $1', [booking.id]);
      const notifJson = dbRes.rows[0].notification;
      expect(notifJson.status).toBe('sent');
      expect(notifJson.parent.status).toBe('sent');
      expect(notifJson.parent.recipient).toBe('status.emailtest@example.com');
      expect(notifJson.mentor.status).toBe('sent');
    });

    it('8. Repeated notification processing does not send duplicate emails (Idempotency)', async () => {
      const sentEmails = [];
      const mockWorkingTransporter = {
        sendMail: vi.fn().mockImplementation(async (mailOptions) => {
          sentEmails.push(mailOptions);
          return { messageId: `<idempotent-${Date.now()}@codeyoung.com>` };
        }),
      };
      setTestTransporter(mockWorkingTransporter);

      const booking = await createBooking({
        parentName: 'Idempotency Parent',
        parentEmail: 'idempotent.emailtest@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-12-07T14:00:00.000Z',
      });

      // First run (during creation): 2 emails sent
      expect(sentEmails.length).toBe(2);

      // Second run: Re-running notifications without force
      const secondRunResult = await sendBookingNotifications(booking.id);
      expect(secondRunResult.status).toBe('sent');
      // No extra emails should have been sent!
      expect(sentEmails.length).toBe(2);
    });

    it('9. GET /api/bookings/:id returns notification delivery status without leaking credentials', async () => {
      const booking = await createBooking({
        parentName: 'Sanitize Parent',
        parentEmail: 'sanitize.emailtest@example.com',
        parentTimezone: 'America/New_York',
        startAt: '2026-12-08T14:00:00.000Z',
      });

      const res = await request(app).get(`/api/bookings/${booking.bookingReference}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('notification');
      expect(res.body.data.notification).toHaveProperty('status');
      expect(res.body.data.notification).toHaveProperty('parent');
      expect(res.body.data.notification).toHaveProperty('mentor');
      expect(res.body.data).not.toHaveProperty('demo_token');
      expect(res.body.data).not.toHaveProperty('smtp');
    });
  });
});
