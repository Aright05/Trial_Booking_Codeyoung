import { DateTime } from 'luxon';
import { query } from '../config/postgres.js';
import { SCHEDULING_CONFIG } from '../config/constants.js';
import {
  isValidIanaTimezone,
  isValidDateFormat,
  getIstDayBoundaries,
  formatLocalizedInterval,
  isNonexistentLocalTime,
} from '../utils/timezone.js';

/**
 * Calculate available booking slots for a requested calendar date and parent timezone.
 *
 * Enforces business & timezone rules:
 * 1. 10 active mentors baseline.
 * 2. Maximum 2 classes per mentor per India (Asia/Kolkata) calendar day.
 * 3. No overlapping bookings for the same mentor.
 * 4. Cancelled bookings do not consume capacity.
 * 5. Excludes slots that have already passed in real time.
 * 6. Daylight saving transitions (Spring forward / Fall back) handled accurately via Luxon.
 * 7. Nonexistent local times during DST jumps are safely skipped rather than normalized to wrong times.
 */
export const getAvailableSlots = async (dateStr, parentTimezone) => {
  // 1. Validation
  if (!isValidDateFormat(dateStr)) {
    const error = new Error('Invalid date format. Expected YYYY-MM-DD (e.g. 2026-10-15).');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidIanaTimezone(parentTimezone)) {
    const error = new Error(`Invalid or unsupported IANA timezone: "${parentTimezone}".`);
    error.statusCode = 400;
    throw error;
  }

  const nowUtc = new Date();

  // 2. Fetch all active mentors
  const mentorsRes = await query(
    'SELECT id, name, email, timezone FROM mentors WHERE is_active = true ORDER BY id ASC'
  );
  const activeMentors = mentorsRes.rows;

  if (activeMentors.length === 0) {
    return {
      date: dateStr,
      timezone: parentTimezone,
      mentorTimezone: SCHEDULING_CONFIG.MENTOR_TIMEZONE,
      totalSlots: 0,
      slots: [],
      message: 'No active mentors are currently registered in the system.',
    };
  }

  // 3. Generate candidate slots across parent's daytime window (08:00 to 22:00 local time)
  // Each slot duration is SCHEDULING_CONFIG.CLASS_DURATION_MINUTES (50 mins) with 60 min intervals
  const candidateSlots = [];
  const startHour = 8;
  const endHour = 22;

  for (let hour = startHour; hour <= endHour; hour++) {
    const hourStr = String(hour).padStart(2, '0');
    const timeCandidateStr = `${hourStr}:00:00.000`;

    // Check if this local hour is nonexistent due to Spring-forward jump
    if (isNonexistentLocalTime(dateStr, `${hourStr}:00`, parentTimezone)) {
      continue;
    }

    const localDt = DateTime.fromISO(`${dateStr}T${timeCandidateStr}`, { zone: parentTimezone });

    if (!localDt.isValid) {
      continue;
    }

    const startUtc = localDt.toUTC().toJSDate();
    const endUtc = new Date(startUtc.getTime() + SCHEDULING_CONFIG.CLASS_DURATION_MINUTES * 60 * 1000);

    // Skip past slots
    if (startUtc <= nowUtc) {
      continue;
    }

    candidateSlots.push({
      startUtc,
      endUtc,
      localDt,
    });
  }

  // 4. For each candidate slot, find eligible mentors based on IST day capacity and absence of overlap
  const availableSlots = [];

  for (const slot of candidateSlots) {
    const { startUtc, endUtc, localDt } = slot;
    const { istDate, dayStartUtc, dayEndUtc } = getIstDayBoundaries(startUtc);

    const availableMentorsForSlot = [];

    for (const mentor of activeMentors) {
      // Check mentor's daily confirmed booking count on this specific India calendar day
      const dailyCountRes = await query(
        `SELECT COUNT(*) as count
         FROM bookings
         WHERE mentor_id = $1
           AND start_at >= $2
           AND start_at <= $3
           AND status != 'cancelled'`,
        [mentor.id, dayStartUtc, dayEndUtc]
      );

      const dailyBookings = parseInt(dailyCountRes.rows[0]?.count || '0', 10);
      if (dailyBookings >= SCHEDULING_CONFIG.MAX_DAILY_CLASSES_PER_MENTOR) {
        continue;
      }

      // Check overlapping active bookings
      const overlapRes = await query(
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

      // Mentor is available
      availableMentorsForSlot.push({
        id: mentor.id,
        name: mentor.name,
      });
    }

    // If at least one mentor is free, publish this slot
    if (availableMentorsForSlot.length > 0) {
      const endLocalDt = localDt.plus({ minutes: SCHEDULING_CONFIG.CLASS_DURATION_MINUTES });
      const istDt = DateTime.fromJSDate(startUtc, { zone: 'utc' }).setZone(SCHEDULING_CONFIG.MENTOR_TIMEZONE);
      const istEndDt = DateTime.fromJSDate(endUtc, { zone: 'utc' }).setZone(SCHEDULING_CONFIG.MENTOR_TIMEZONE);

      availableSlots.push({
        id: `slot-${startUtc.getTime()}`,
        startAt: startUtc.toISOString(),
        endAt: endUtc.toISOString(),
        durationMinutes: SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
        localDate: localDt.toFormat('yyyy-MM-dd'),
        localStartTime: localDt.toFormat('hh:mm a'),
        localEndTime: endLocalDt.toFormat('hh:mm a'),
        localTimezone: parentTimezone,
        localLabel: formatLocalizedInterval(startUtc, endUtc, parentTimezone),
        istDate,
        istStartTime: `${istDt.toFormat('hh:mm a')} IST`,
        istEndTime: `${istEndDt.toFormat('hh:mm a')} IST`,
        istLabel: `${istDt.toFormat('hh:mm a')} - ${istEndDt.toFormat('hh:mm a')} IST (${istDt.toFormat('dd LLL yyyy')})`,
        availableMentorCount: availableMentorsForSlot.length,
      });
    }
  }

  return {
    date: dateStr,
    timezone: parentTimezone,
    mentorTimezone: SCHEDULING_CONFIG.MENTOR_TIMEZONE,
    totalSlots: availableSlots.length,
    slots: availableSlots,
    message: availableSlots.length > 0
      ? `Found ${availableSlots.length} available trial class slot(s).`
      : 'No mentors are available for the selected date. All 10 mentors may have reached their maximum capacity (2 classes/day) or are booked. Please select another date.',
  };
};
