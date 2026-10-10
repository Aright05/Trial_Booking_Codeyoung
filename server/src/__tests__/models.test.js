import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { Mentor } from '../models/Mentor.js';
import { Booking } from '../models/Booking.js';
import { SAMPLE_MENTORS } from '../scripts/seedMentors.js';

describe('Mentor Model Validation Tests', () => {
  it('validates a correct mentor document', async () => {
    const mentor = new Mentor({
      name: 'Mentor Rahul',
      email: 'mentor.rahul@codeyoung.test',
      timezone: 'Asia/Kolkata',
      isActive: true,
    });

    let validationError = null;
    try {
      await mentor.validate();
    } catch (err) {
      validationError = err;
    }

    expect(validationError).toBeNull();
    expect(mentor.timezone).toBe('Asia/Kolkata');
  });

  it('fails validation when name or email is missing', async () => {
    const mentor = new Mentor({});
    let err = null;
    try {
      await mentor.validate();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors['name']).toBeDefined();
    expect(err.errors['email']).toBeDefined();
  });

  it('fails validation on invalid email format', async () => {
    const mentor = new Mentor({
      name: 'Test Mentor',
      email: 'invalid-email-string',
      timezone: 'Asia/Kolkata',
    });

    let err = null;
    try {
      await mentor.validate();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors['email']).toBeDefined();
  });

  it('fails validation on invalid IANA timezone', async () => {
    const mentor = new Mentor({
      name: 'Test Mentor',
      email: 'test@codeyoung.test',
      timezone: 'Invalid/Non_Existent_Timezone',
    });

    let err = null;
    try {
      await mentor.validate();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors['timezone']).toBeDefined();
  });
});

describe('Booking Model Validation Tests', () => {
  it('validates a correct booking document with valid dates', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const startAt = new Date('2026-10-15T10:00:00.000Z');
    const endAt = new Date('2026-10-15T11:00:00.000Z');

    const booking = new Booking({
      parentName: 'Sarah Jenkins',
      parentEmail: 'sarah@example.com',
      parentTimezone: 'America/New_York',
      mentor: mentorId,
      startAt,
      endAt,
      demoClassLink: 'https://meet.google.com/abc-defg-hij',
      status: 'confirmed',
    });

    let validationError = null;
    try {
      await booking.validate();
    } catch (err) {
      validationError = err;
    }

    expect(validationError).toBeNull();
    expect(booking.status).toBe('confirmed');
  });

  it('fails validation if endAt is before startAt', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const startAt = new Date('2026-10-15T12:00:00.000Z');
    const endAt = new Date('2026-10-15T11:00:00.000Z'); // Invalid: end before start

    const booking = new Booking({
      parentName: 'Sarah Jenkins',
      parentEmail: 'sarah@example.com',
      parentTimezone: 'America/New_York',
      mentor: mentorId,
      startAt,
      endAt,
    });

    let err = null;
    try {
      await booking.validate();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors['endAt']).toBeDefined();
  });

  it('fails validation on invalid booking status', async () => {
    const mentorId = new mongoose.Types.ObjectId();
    const booking = new Booking({
      parentName: 'Sarah Jenkins',
      parentEmail: 'sarah@example.com',
      parentTimezone: 'America/New_York',
      mentor: mentorId,
      startAt: new Date('2026-10-15T10:00:00.000Z'),
      endAt: new Date('2026-10-15T11:00:00.000Z'),
      status: 'invalid-status',
    });

    let err = null;
    try {
      await booking.validate();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors['status']).toBeDefined();
  });
});

describe('Mentor Seed Data Quality Tests', () => {
  it('contains exactly 10 distinct mentors', () => {
    expect(SAMPLE_MENTORS.length).toBe(10);
  });

  it('ensures all 10 mentors have unique lowercase emails and IST timezone', () => {
    const emails = SAMPLE_MENTORS.map(m => m.email.toLowerCase());
    const uniqueEmails = new Set(emails);

    expect(uniqueEmails.size).toBe(10);
    SAMPLE_MENTORS.forEach((m) => {
      expect(m.timezone).toBe('Asia/Kolkata');
      expect(m.isActive).toBe(true);
      expect(m.name.length).toBeGreaterThan(2);
    });
  });
});
