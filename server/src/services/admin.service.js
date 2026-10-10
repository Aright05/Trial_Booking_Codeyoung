import { query, pool } from '../config/postgres.js';
import { SCHEDULING_CONFIG } from '../config/constants.js';
import {
  formatLocalizedInterval,
  isValidDateFormat,
  getParentDayBoundaries,
} from '../utils/timezone.js';
import { DateTime } from 'luxon';
import { sendBookingNotifications } from './email.service.js';

/**
 * Fetch high-level operational statistics directly from PostgreSQL
 */
export const getAdminStats = async () => {
  const statsQuery = `
    SELECT
      COUNT(*) AS total_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed' AND (notification->>'status' = 'failed' OR notification->>'status' = 'partial')) AS failed_notifications,
      COUNT(*) FILTER (WHERE status = 'confirmed' AND (notification->>'status' = 'pending' OR notification IS NULL OR notification = '{}'::jsonb)) AS pending_notifications,
      COUNT(*) FILTER (WHERE status = 'confirmed' AND notification->>'status' = 'sent') AS sent_notifications
    FROM bookings;
  `;

  const mentorCountQuery = `
    SELECT
      COUNT(*) AS total_mentors,
      COUNT(*) FILTER (WHERE is_active = true) AS active_mentors
    FROM mentors;
  `;

  const [bookingsRes, mentorsRes] = await Promise.all([
    query(statsQuery),
    query(mentorCountQuery),
  ]);

  const bRow = bookingsRes.rows[0] || {};
  const mRow = mentorsRes.rows[0] || {};

  return {
    totalBookings: parseInt(bRow.total_bookings || '0', 10),
    confirmedBookings: parseInt(bRow.confirmed_bookings || '0', 10),
    cancelledBookings: parseInt(bRow.cancelled_bookings || '0', 10),
    completedBookings: parseInt(bRow.completed_bookings || '0', 10),
    activeMentors: parseInt(mRow.active_mentors || '0', 10),
    totalMentors: parseInt(mRow.total_mentors || '0', 10),
    notifications: {
      sent: parseInt(bRow.sent_notifications || '0', 10),
      pending: parseInt(bRow.pending_notifications || '0', 10),
      failed: parseInt(bRow.failed_notifications || '0', 10),
      attentionRequired: parseInt(bRow.failed_notifications || '0', 10) + parseInt(bRow.pending_notifications || '0', 10),
    },
  };
};

/**
 * Fetch paginated and filtered bookings with mentor and notification metadata
 */
export const getAdminBookings = async ({
  status,
  mentorId,
  date,
  search,
  page = 1,
  limit = 10,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const whereClauses = [];
  const params = [];
  let paramIdx = 1;

  if (status && status !== 'all') {
    whereClauses.push(`b.status = $${paramIdx++}`);
    params.push(status);
  }

  if (mentorId && mentorId !== 'all') {
    whereClauses.push(`b.mentor_id = $${paramIdx++}`);
    params.push(parseInt(mentorId, 10));
  }

  if (date) {
    if (isValidDateFormat(date)) {
      // Filter by parent day window in UTC
      const { dayStartUtc, dayEndUtc } = getParentDayBoundaries(date, 'UTC');
      whereClauses.push(`b.start_at >= $${paramIdx++} AND b.start_at <= $${paramIdx++}`);
      params.push(dayStartUtc, dayEndUtc);
    }
  }

  if (search && search.trim()) {
    const searchVal = `%${search.trim().toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(b.booking_reference) LIKE $${paramIdx} OR
      LOWER(b.parent_name) LIKE $${paramIdx} OR
      LOWER(b.parent_email) LIKE $${paramIdx} OR
      LOWER(m.name) LIKE $${paramIdx}
    )`);
    params.push(searchVal);
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 1. Total count query
  const countSql = `
    SELECT COUNT(*) AS total
    FROM bookings b
    JOIN mentors m ON b.mentor_id = m.id
    ${whereSql}
  `;

  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Data query
  const dataSql = `
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
      b.cancellation_reason,
      b.cancelled_at,
      b.notification,
      b.created_at,
      b.updated_at,
      m.id AS mentor_id,
      m.name AS mentor_name,
      m.email AS mentor_email,
      m.timezone AS mentor_timezone
    FROM bookings b
    JOIN mentors m ON b.mentor_id = m.id
    ${whereSql}
    ORDER BY b.start_at DESC, b.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const dataParams = [...params, limitNum, offset];
  const dataRes = await query(dataSql, dataParams);

  const bookings = dataRes.rows.map((row) => {
    const startUtc = new Date(row.start_at);
    const endUtc = new Date(row.end_at);
    const notif = typeof row.notification === 'object' && row.notification ? row.notification : {};

    return {
      id: row.id,
      bookingReference: row.booking_reference,
      parentName: row.parent_name,
      parentEmail: row.parent_email,
      parentTimezone: row.parent_timezone,
      startAt: startUtc.toISOString(),
      endAt: endUtc.toISOString(),
      durationMinutes: SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
      parentLocalTime: formatLocalizedInterval(startUtc, endUtc, row.parent_timezone),
      mentorLocalTime: formatLocalizedInterval(startUtc, endUtc, row.mentor_timezone || SCHEDULING_CONFIG.MENTOR_TIMEZONE),
      demoClassLink: row.demo_class_link,
      status: row.status,
      cancellationReason: row.cancellation_reason || null,
      cancelledAt: row.cancelled_at || null,
      notification: {
        status: notif.status || 'pending',
        parent: {
          status: notif.parent?.status || 'pending',
          sentAt: notif.parent?.sentAt || null,
          previewUrl: notif.parent?.previewUrl || null,
          error: notif.parent?.error || null,
        },
        mentor: {
          status: notif.mentor?.status || 'pending',
          sentAt: notif.mentor?.sentAt || null,
          previewUrl: notif.mentor?.previewUrl || null,
          error: notif.mentor?.error || null,
        },
      },
      mentor: {
        id: row.mentor_id,
        name: row.mentor_name,
        email: row.mentor_email,
        timezone: row.mentor_timezone,
      },
      createdAt: row.created_at,
    };
  });

  return {
    bookings,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
};

/**
 * Fetch mentors overview along with calculated daily capacity for a specified India calendar day
 */
export const getAdminMentorsOverview = async (targetDateStr) => {
  // If date not provided, default to current date in IST
  const effectiveDateStr = targetDateStr && isValidDateFormat(targetDateStr)
    ? targetDateStr
    : DateTime.now().setZone(SCHEDULING_CONFIG.MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');

  // Compute India day boundaries
  const { dayStartUtc, dayEndUtc } = getParentDayBoundaries(effectiveDateStr, SCHEDULING_CONFIG.MENTOR_TIMEZONE);

  // 1. Fetch all mentors
  const mentorsRes = await query(
    'SELECT id, name, email, timezone, is_active, created_at FROM mentors ORDER BY id ASC'
  );
  const mentors = mentorsRes.rows;

  // 2. Fetch all non-cancelled bookings for these mentors on this India day
  const bookingsRes = await query(
    `SELECT 
       b.id,
       b.booking_reference,
       b.parent_name,
       b.parent_email,
       b.parent_timezone,
       b.start_at,
       b.end_at,
       b.status,
       b.mentor_id
     FROM bookings b
     WHERE b.status != 'cancelled'
       AND b.start_at >= $1
       AND b.start_at <= $2
     ORDER BY b.start_at ASC`,
    [dayStartUtc, dayEndUtc]
  );

  const bookingsByMentor = {};
  for (const b of bookingsRes.rows) {
    if (!bookingsByMentor[b.mentor_id]) {
      bookingsByMentor[b.mentor_id] = [];
    }
    const startUtc = new Date(b.start_at);
    const endUtc = new Date(b.end_at);
    bookingsByMentor[b.mentor_id].push({
      id: b.id,
      bookingReference: b.booking_reference,
      parentName: b.parent_name,
      parentEmail: b.parent_email,
      parentTimezone: b.parent_timezone,
      startAt: startUtc.toISOString(),
      endAt: endUtc.toISOString(),
      istTime: formatLocalizedInterval(startUtc, endUtc, SCHEDULING_CONFIG.MENTOR_TIMEZONE),
      status: b.status,
    });
  }

  return {
    date: effectiveDateStr,
    timezone: SCHEDULING_CONFIG.MENTOR_TIMEZONE,
    maxDailyCapacity: SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR,
    mentors: mentors.map((mentor) => {
      const appointments = bookingsByMentor[mentor.id] || [];
      const bookedCount = appointments.length;
      const remainingCapacity = Math.max(0, SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR - bookedCount);

      return {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        timezone: mentor.timezone,
        isActive: mentor.is_active,
        bookedCountToday: bookedCount,
        maxDailyCapacity: SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR,
        remainingCapacity,
        isCapacityFull: bookedCount >= SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR,
        appointments,
      };
    }),
  };
};

/**
 * Cancel a booking safely, recording cancellation reason and releasing mentor capacity
 */
export const cancelBooking = async (idOrReference, { reason = '' } = {}) => {
  if (!idOrReference) {
    const error = new Error('Booking ID or reference is required.');
    error.statusCode = 400;
    throw error;
  }

  const isNumeric = /^\d+$/.test(idOrReference);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Select booking with row lock
    const selectSql = `
      SELECT id, booking_reference, parent_name, parent_email, mentor_id, start_at, end_at, status
      FROM bookings
      WHERE ${isNumeric ? 'id = $1' : 'booking_reference = $1'}
      FOR UPDATE
    `;

    const selectRes = await client.query(selectSql, [isNumeric ? parseInt(idOrReference, 10) : idOrReference]);
    if (selectRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const error = new Error(`Booking "${idOrReference}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const booking = selectRes.rows[0];

    // 2. Check if already cancelled
    if (booking.status === 'cancelled') {
      await client.query('ROLLBACK');
      const error = new Error(`Booking ${booking.booking_reference} is already cancelled.`);
      error.statusCode = 400;
      error.code = 'ALREADY_CANCELLED';
      throw error;
    }

    // 3. Update status to cancelled
    const updateSql = `
      UPDATE bookings
      SET 
        status = 'cancelled',
        cancellation_reason = $1,
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, booking_reference, parent_name, parent_email, status, cancellation_reason, cancelled_at, updated_at
    `;

    const updateRes = await client.query(updateSql, [reason?.trim() || 'Administrative cancellation', booking.id]);
    await client.query('COMMIT');

    const updatedRow = updateRes.rows[0];
    return {
      id: updatedRow.id,
      bookingReference: updatedRow.booking_reference,
      parentName: updatedRow.parent_name,
      parentEmail: updatedRow.parent_email,
      status: updatedRow.status,
      cancellationReason: updatedRow.cancellation_reason,
      cancelledAt: updatedRow.cancelled_at,
      message: 'Booking cancelled successfully. Mentor capacity has been released.',
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};
