import { query } from '../config/postgres.js';
import { SCHEDULING_CONFIG } from '../config/constants.js';
import {
  isValidDateFormat,
  getParentDayBoundaries,
  formatLocalizedInterval,
} from '../utils/timezone.js';
import { DateTime } from 'luxon';

/**
 * Fetch schedule for the authenticated mentor
 * 
 * Rules:
 * - Restricted to mentor's own mentor_id.
 * - Grouped by calendar date in mentor timezone (Asia/Kolkata).
 * - Sorted chronologically by start time.
 * - Distinguishes confirmed vs cancelled appointments.
 * - Excludes cancelled meetings from daily capacity counts.
 */
export const getMentorSchedule = async (mentor, { from, to } = {}) => {
  const mentorTz = mentor.timezone || SCHEDULING_CONFIG.MENTOR_TIMEZONE;
  const nowInMentorTz = DateTime.now().setZone(mentorTz);

  // Default from = today in mentor timezone, to = +30 days in mentor timezone
  const effectiveFrom = from && isValidDateFormat(from) ? from : nowInMentorTz.toFormat('yyyy-MM-dd');
  const effectiveTo = to && isValidDateFormat(to) ? to : nowInMentorTz.plus({ days: 30 }).toFormat('yyyy-MM-dd');

  if (from && !isValidDateFormat(from)) {
    const error = new Error('Invalid "from" date format. Expected YYYY-MM-DD.');
    error.statusCode = 400;
    error.code = 'INVALID_DATE_FORMAT';
    throw error;
  }

  if (to && !isValidDateFormat(to)) {
    const error = new Error('Invalid "to" date format. Expected YYYY-MM-DD.');
    error.statusCode = 400;
    error.code = 'INVALID_DATE_FORMAT';
    throw error;
  }

  const { dayStartUtc } = getParentDayBoundaries(effectiveFrom, mentorTz);
  const { dayEndUtc } = getParentDayBoundaries(effectiveTo, mentorTz);

  const scheduleSql = `
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
      b.created_at
    FROM bookings b
    WHERE b.mentor_id = $1
      AND b.start_at >= $2
      AND b.start_at <= $3
    ORDER BY b.start_at ASC
  `;

  const res = await query(scheduleSql, [mentor.id, dayStartUtc, dayEndUtc]);

  // Transform and group appointments by calendar date in mentor's timezone
  const meetings = [];
  const groupsByDate = {};

  for (const row of res.rows) {
    const startUtc = new Date(row.start_at);
    const endUtc = new Date(row.end_at);
    const notif = typeof row.notification === 'object' && row.notification ? row.notification : {};

    const mentorDt = DateTime.fromJSDate(startUtc, { zone: 'utc' }).setZone(mentorTz);
    const mentorEndDt = DateTime.fromJSDate(endUtc, { zone: 'utc' }).setZone(mentorTz);
    const dateKey = mentorDt.toFormat('yyyy-MM-dd');

    const item = {
      id: row.id,
      bookingReference: row.booking_reference,
      parentName: row.parent_name,
      parentEmail: row.parent_email,
      parentTimezone: row.parent_timezone,
      startAt: startUtc.toISOString(),
      endAt: endUtc.toISOString(),
      durationMinutes: SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
      mentorDate: dateKey,
      mentorStartTime: mentorDt.toFormat('hh:mm a'),
      mentorEndTime: mentorEndDt.toFormat('hh:mm a'),
      mentorTimezone: mentorTz,
      mentorLocalInterval: formatLocalizedInterval(startUtc, endUtc, mentorTz),
      parentLocalInterval: formatLocalizedInterval(startUtc, endUtc, row.parent_timezone),
      demoClassLink: row.demo_class_link,
      status: row.status,
      isCancelled: row.status === 'cancelled',
      cancellationReason: row.cancellation_reason || null,
      cancelledAt: row.cancelled_at || null,
      notificationStatus: notif.mentor?.status || notif.status || 'pending',
      createdAt: row.created_at,
    };

    meetings.push(item);

    if (!groupsByDate[dateKey]) {
      const todayKey = nowInMentorTz.toFormat('yyyy-MM-dd');
      const tomorrowKey = nowInMentorTz.plus({ days: 1 }).toFormat('yyyy-MM-dd');
      let relativeLabel = 'UPCOMING';
      if (dateKey === todayKey) relativeLabel = 'TODAY';
      else if (dateKey === tomorrowKey) relativeLabel = 'TOMORROW';

      groupsByDate[dateKey] = {
        date: dateKey,
        formattedDate: mentorDt.toFormat('dd MMMM yyyy'),
        relativeLabel,
        activeCount: 0,
        cancelledCount: 0,
        maxCapacity: SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR,
        meetings: [],
      };
    }

    groupsByDate[dateKey].meetings.push(item);
    if (row.status !== 'cancelled') {
      groupsByDate[dateKey].activeCount += 1;
    } else {
      groupsByDate[dateKey].cancelledCount += 1;
    }
  }

  // Convert groups to sorted list
  const dateGroups = Object.keys(groupsByDate)
    .sort()
    .map((d) => groupsByDate[d]);

  return {
    mentor: {
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      timezone: mentorTz,
    },
    dateRange: {
      from: effectiveFrom,
      to: effectiveTo,
    },
    totalMeetings: meetings.length,
    activeMeetings: meetings.filter((m) => m.status !== 'cancelled').length,
    cancelledMeetings: meetings.filter((m) => m.status === 'cancelled').length,
    meetings,
    dateGroups,
  };
};
