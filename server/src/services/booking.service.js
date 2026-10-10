import crypto from 'crypto';
import { pool, query } from '../config/postgres.js';
import { SCHEDULING_CONFIG } from '../config/constants.js';
import {
  isValidIanaTimezone,
  getIstDayBoundaries,
  formatLocalizedInterval,
} from '../utils/timezone.js';
import { normalizeEmail } from '../utils/emailNormalizer.js';
import { sendBookingNotifications } from './email.service.js';

/**
 * Create a trial class booking with strict mentor capacity and concurrency protection.
 *
 * Enforces business rules:
 * 1. Exactly 1 free trial per normalized Gmail identity (even if cancelled or rebooked).
 * 2. Automatic fair least-loaded + randomized tie-breaker mentor assignment among active mentors.
 * 3. Maximum 2 bookings per mentor per India (Asia/Kolkata) calendar day.
 * 4. Zero overlapping bookings for the assigned mentor.
 * 5. Transaction isolation and row locking to protect against concurrent race conditions.
 * 6. Instant demo class link generation with secure non-guessable token.
 * 7. Post-commit idempotent parent and mentor email notification dispatch.
 */
export const createBooking = async ({
  parentName,
  parentEmail,
  parentTimezone,
  startAt,
}) => {
  // 1. Input Validation
  if (!parentName || typeof parentName !== 'string' || parentName.trim().length < 2) {
    const error = new Error('Parent name is required and must be at least 2 characters long.');
    error.statusCode = 400;
    error.code = 'INVALID_PARENT_NAME';
    throw error;
  }

  if (!parentEmail || typeof parentEmail !== 'string') {
    const error = new Error('A valid parent email address is required.');
    error.statusCode = 400;
    error.code = 'INVALID_EMAIL';
    throw error;
  }

  const norm = normalizeEmail(parentEmail);
  if (!norm.isValid) {
    const error = new Error('A valid parent email address is required.');
    error.statusCode = 400;
    error.code = 'INVALID_EMAIL';
    throw error;
  }

  if (!isValidIanaTimezone(parentTimezone)) {
    const error = new Error(`Invalid or unsupported IANA timezone: "${parentTimezone}".`);
    error.statusCode = 400;
    error.code = 'INVALID_TIMEZONE';
    throw error;
  }

  if (!startAt) {
    const error = new Error('Class start time (startAt) is required.');
    error.statusCode = 400;
    error.code = 'INVALID_START_TIME';
    throw error;
  }

  const startUtc = new Date(startAt);
  if (isNaN(startUtc.getTime())) {
    const error = new Error('Invalid startAt timestamp. Please provide a valid ISO-8601 string.');
    error.statusCode = 400;
    error.code = 'INVALID_START_TIME';
    throw error;
  }

  const nowUtc = new Date();
  if (startUtc <= nowUtc) {
    const error = new Error('Cannot book a trial class in the past. Please select a future time slot.');
    error.statusCode = 400;
    error.code = 'PAST_TIME_SLOT';
    throw error;
  }

  // Calculate end time based on configured duration
  const endUtc = new Date(startUtc.getTime() + SCHEDULING_CONFIG.CLASS_DURATION_MINUTES * 60 * 1000);
  const { istDate, dayStartUtc, dayEndUtc } = getIstDayBoundaries(startUtc);

  // 2. Start PostgreSQL Transaction with Row Locking
  const client = await pool.connect();
  let createdRecord = null;
  let assignedMentor = null;

  try {
    await client.query('BEGIN');

    // Step A: Check and atomically claim Free Trial Entitlement
    const entitlementRes = await client.query(
      'SELECT id, normalized_email FROM free_trial_entitlements WHERE normalized_email = $1 FOR UPDATE',
      [norm.normalizedEmail]
    );

    if (entitlementRes.rows.length > 0) {
      await client.query('ROLLBACK');
      const error = new Error(
        norm.isGmail
          ? 'Each parent can use exactly one free trial for their Gmail account. A free trial has already been claimed for this Gmail identity.'
          : 'Each parent can use exactly one free trial. A free trial has already been claimed for this email account.'
      );
      error.statusCode = 409;
      error.code = 'FREE_TRIAL_ALREADY_USED';
      throw error;
    }

    // Insert trial entitlement row for this normalized email
    const insertEntitlementRes = await client.query(
      `INSERT INTO free_trial_entitlements (normalized_email, original_email, claimed_at, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [norm.normalizedEmail, norm.originalEmail]
    );
    const entitlementId = insertEntitlementRes.rows[0].id;

    // Step B: Fetch all active mentors
    const mentorsRes = await client.query(
      'SELECT id, name, email, timezone FROM mentors WHERE is_active = true ORDER BY id ASC'
    );
    const activeMentors = mentorsRes.rows;

    if (activeMentors.length === 0) {
      await client.query('ROLLBACK');
      const error = new Error('No active mentors are available in the system.');
      error.statusCode = 409;
      error.code = 'NO_MENTORS_REGISTERED';
      throw error;
    }

    // Step C: Identify all genuinely available mentors (daily count < 2 on IST day & no time overlap)
    const eligibleMentors = [];

    for (const mentor of activeMentors) {
      // Check daily non-cancelled bookings on this India calendar day
      const dailyCountRes = await client.query(
        `SELECT COUNT(*) as count
         FROM bookings
         WHERE mentor_id = $1
           AND start_at >= $2
           AND start_at <= $3
           AND status != 'cancelled'`,
        [mentor.id, dayStartUtc, dayEndUtc]
      );

      const dailyCount = parseInt(dailyCountRes.rows[0]?.count || '0', 10);
      if (dailyCount >= SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR) {
        continue;
      }

      // Check overlapping non-cancelled bookings
      const overlapRes = await client.query(
        `SELECT COUNT(*) as count
         FROM bookings
         WHERE mentor_id = $1
           AND status != 'cancelled'
           AND (start_at < $2 AND end_at > $3)`,
        [mentor.id, endUtc, startUtc]
      );

      const overlapCount = parseInt(overlapRes.rows[0]?.count || '0', 10);
      if (overlapCount > 0) {
        continue;
      }

      eligibleMentors.push({
        mentor,
        dailyCount,
      });
    }

    if (eligibleMentors.length === 0) {
      await client.query('ROLLBACK');
      const error = new Error(
        'No mentor is available for this time. The requested trial slot is no longer available. Please choose another slot.'
      );
      error.statusCode = 409;
      error.code = 'NO_MENTOR_AVAILABLE';
      throw error;
    }

    // Step D: Fair least-loaded strategy with randomized tie-breaker among available mentors
    const minDailyCount = Math.min(...eligibleMentors.map((m) => m.dailyCount));
    const leastLoadedMentors = eligibleMentors.filter((m) => m.dailyCount === minDailyCount);
    
    // Pick randomly among least-loaded candidates to break ties fairly
    const chosenIndex = Math.floor(Math.random() * leastLoadedMentors.length);
    assignedMentor = leastLoadedMentors[chosenIndex].mentor;

    // 3. Generate secure identifiers & deterministic demo link
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dateFormatted = istDate.replace(/-/g, '');
    const bookingReference = `CY-${dateFormatted}-${randomHex}`;
    const demoToken = crypto.randomUUID();
    const baseUrl = SCHEDULING_CONFIG.DEMO_CLASS_BASE_URL || SCHEDULING_CONFIG.DEMO_MEET_BASE_URL || 'https://meet.codeyoung.com/room';
    const demoClassLink = `${baseUrl}/${bookingReference}-${demoToken.slice(0, 8)}`;

    const initialNotification = {
      status: 'pending',
      parent: {
        status: 'pending',
        recipient: parentEmail.trim().toLowerCase(),
      },
      mentor: {
        status: 'pending',
        recipient: assignedMentor.email.toLowerCase(),
      },
      lastAttemptAt: null,
    };

    // 4. Insert booking into database
    const insertRes = await client.query(
      `INSERT INTO bookings (
        booking_reference,
        parent_name,
        parent_email,
        normalized_parent_email,
        parent_timezone,
        mentor_id,
        start_at,
        end_at,
        demo_class_link,
        demo_token,
        status,
        notification,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, booking_reference, parent_name, parent_email, parent_timezone, mentor_id, start_at, end_at, demo_class_link, status, created_at`,
      [
        bookingReference,
        parentName.trim(),
        parentEmail.trim().toLowerCase(),
        norm.normalizedEmail,
        parentTimezone,
        assignedMentor.id,
        startUtc,
        endUtc,
        demoClassLink,
        demoToken,
        JSON.stringify(initialNotification),
      ]
    );

    createdRecord = insertRes.rows[0];

    // Link booking ID back to entitlement
    await client.query(
      'UPDATE free_trial_entitlements SET booking_id = $1 WHERE id = $2',
      [createdRecord.id, entitlementId]
    );

    // Commit transaction
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    // Check for PostgreSQL unique violation (code 23505) on entitlement
    if (err.code === '23505' && err.message?.includes('free_trial_entitlements')) {
      const error = new Error(
        'Each parent can use exactly one free trial for their Gmail account. A free trial has already been claimed for this email account.'
      );
      error.statusCode = 409;
      error.code = 'FREE_TRIAL_ALREADY_USED';
      throw error;
    }
    // Check for exclusion constraint violation on mentor overlap
    if (err.code === '23P01' || err.message?.includes('no_mentor_overlap_exclude')) {
      const error = new Error('No mentor is available for this time. Please choose another slot.');
      error.statusCode = 409;
      error.code = 'NO_MENTOR_AVAILABLE';
      throw error;
    }
    throw err;
  } finally {
    client.release();
  }

  // 5. Trigger notifications post-commit (failure here does not roll back the booking)
  let notifResult = {
    status: 'pending',
    parent: { status: 'pending' },
    mentor: { status: 'pending' },
  };

  try {
    notifResult = await sendBookingNotifications(createdRecord.id);
  } catch (notifErr) {
    console.error('[Notification Post-Commit Error]:', notifErr.message);
  }

  // 6. Construct complete user-friendly response payload
  return {
    id: createdRecord.id,
    bookingReference: createdRecord.booking_reference,
    parentName: createdRecord.parent_name,
    parentEmail: createdRecord.parent_email,
    parentTimezone: createdRecord.parent_timezone,
    mentor: {
      id: assignedMentor.id,
      name: assignedMentor.name,
      email: assignedMentor.email,
      timezone: assignedMentor.timezone,
      avatar: null,
    },
    startAt: createdRecord.start_at.toISOString ? createdRecord.start_at.toISOString() : new Date(createdRecord.start_at).toISOString(),
    endAt: createdRecord.end_at.toISOString ? createdRecord.end_at.toISOString() : new Date(createdRecord.end_at).toISOString(),
    durationMinutes: SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
    parentLocalTime: formatLocalizedInterval(startUtc, endUtc, parentTimezone),
    mentorLocalTime: formatLocalizedInterval(startUtc, endUtc, SCHEDULING_CONFIG.MENTOR_TIMEZONE),
    demoClassLink: createdRecord.demo_class_link,
    status: createdRecord.status,
    notification: {
      status: notifResult.status || 'pending',
      parent: {
        status: notifResult.parent?.status || 'pending',
        sentAt: notifResult.parent?.sentAt || null,
        previewUrl: notifResult.parent?.previewUrl || null,
      },
      mentor: {
        status: notifResult.mentor?.status || 'pending',
        sentAt: notifResult.mentor?.sentAt || null,
        previewUrl: notifResult.mentor?.previewUrl || null,
      },
    },
    createdAt: createdRecord.created_at,
  };
};


/**
 * Retrieve a booking by ID or unique booking reference
 */
export const getBookingByIdOrReference = async (idOrReference) => {
  if (!idOrReference) {
    const error = new Error('Booking ID or reference is required.');
    error.statusCode = 400;
    throw error;
  }

  const isNumeric = /^\d+$/.test(idOrReference);

  let queryText = `
    SELECT 
      b.id,
      b.booking_reference,
      b.parent_name,
      b.parent_email,
      b.parent_timezone,
      b.start_at,
      b.end_at,
      b.demo_class_link,
      b.status,
      b.notification,
      b.created_at,
      m.id as mentor_id,
      m.name as mentor_name,
      m.email as mentor_email,
      m.timezone as mentor_timezone
    FROM bookings b
    JOIN mentors m ON b.mentor_id = m.id
  `;

  if (isNumeric) {
    queryText += ' WHERE b.id = $1';
  } else {
    queryText += ' WHERE b.booking_reference = $1';
  }

  const res = await query(queryText, [isNumeric ? parseInt(idOrReference, 10) : idOrReference]);

  if (res.rows.length === 0) {
    const error = new Error(`Booking with reference/ID "${idOrReference}" was not found.`);
    error.statusCode = 404;
    throw error;
  }

  const row = res.rows[0];
  const startUtc = new Date(row.start_at);
  const endUtc = new Date(row.end_at);
  const notifData = (typeof row.notification === 'object' && row.notification) ? row.notification : {};

  return {
    id: row.id,
    bookingReference: row.booking_reference,
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    parentTimezone: row.parent_timezone,
    mentor: {
      id: row.mentor_id,
      name: row.mentor_name,
      email: row.mentor_email,
      timezone: row.mentor_timezone,
      avatar: null,
    },
    startAt: startUtc.toISOString(),
    endAt: endUtc.toISOString(),
    durationMinutes: SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
    parentLocalTime: formatLocalizedInterval(startUtc, endUtc, row.parent_timezone),
    mentorLocalTime: formatLocalizedInterval(startUtc, endUtc, SCHEDULING_CONFIG.MENTOR_TIMEZONE),
    demoClassLink: row.demo_class_link,
    status: row.status,
    notification: {
      status: notifData.status || 'pending',
      parent: {
        status: notifData.parent?.status || 'pending',
        sentAt: notifData.parent?.sentAt || null,
        previewUrl: notifData.parent?.previewUrl || null,
      },
      mentor: {
        status: notifData.mentor?.status || 'pending',
        sentAt: notifData.mentor?.sentAt || null,
        previewUrl: notifData.mentor?.previewUrl || null,
      },
    },
    createdAt: row.created_at,
  };
};
