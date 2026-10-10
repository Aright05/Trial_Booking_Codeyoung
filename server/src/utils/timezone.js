import { DateTime, IANAZone } from 'luxon';
import { SCHEDULING_CONFIG } from '../config/constants.js';

/**
 * Validate whether a string is a valid IANA timezone identifier
 */
export const isValidIanaTimezone = (timezone) => {
  if (!timezone || typeof timezone !== 'string') return false;
  return IANAZone.isValidZone(timezone);
};

/**
 * Validate standard YYYY-MM-DD date format
 */
export const isValidDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const dt = DateTime.fromISO(dateStr);
  return dt.isValid;
};

/**
 * Check if a specific local wall-clock time is nonexistent due to a Spring-forward DST transition
 * e.g., 02:30 AM on 2026-03-08 in America/New_York (clocks jump 02:00 -> 03:00)
 */
export const isNonexistentLocalTime = (dateStr, timeStr, timezone) => {
  if (!isValidIanaTimezone(timezone) || !isValidDateFormat(dateStr)) return false;
  const dt = DateTime.fromISO(`${dateStr}T${timeStr}:00.000`, { zone: timezone });
  if (!dt.isValid) return true;

  const [expectedHour, expectedMinute] = timeStr.split(':').map(Number);
  return dt.hour !== expectedHour || dt.minute !== (expectedMinute || 0);
};

/**
 * Check if a local wall-clock time is ambiguous (occurs twice) due to a Fall-back DST transition
 * e.g., 01:30 AM on 2026-11-01 in America/New_York (clocks repeat 01:00 -> 02:00)
 */
export const isAmbiguousLocalTime = (dateStr, timeStr, timezone) => {
  if (!isValidIanaTimezone(timezone) || !isValidDateFormat(dateStr)) return false;
  const dt = DateTime.fromISO(`${dateStr}T${timeStr}:00.000`, { zone: timezone });
  if (!dt.isValid) return false;

  const earlier = dt.minus({ hours: 1 });
  const later = dt.plus({ hours: 1 });
  return earlier.offset !== later.offset || earlier.isInDST !== later.isInDST;
};

/**
 * Standardize timezone abbreviations across operating systems
 */
export const getTimezoneAbbreviation = (dt) => {
  const shortName = dt.setLocale('en-US').offsetNameShort;
  if (shortName && !shortName.startsWith('GMT') && !shortName.startsWith('UTC')) {
    return shortName;
  }

  // Fallback mappings for primary supported zones
  const zoneName = dt.zoneName;
  const isDST = dt.isInDST;

  if (zoneName === 'Asia/Kolkata') return 'IST';
  if (zoneName === 'Europe/London') return isDST ? 'BST' : 'GMT';
  if (zoneName === 'America/New_York') return isDST ? 'EDT' : 'EST';
  if (zoneName === 'America/Los_Angeles') return isDST ? 'PDT' : 'PST';

  return shortName || dt.toFormat('ZZZZ') || zoneName;
};

/**
 * Given a UTC Date instant, calculate the exact India (Asia/Kolkata) calendar day
 * and return the UTC start and end timestamps for that entire India day.
 * 
 * India calendar day strictly runs from 00:00:00.000 IST to 23:59:59.999 IST (UTC+5:30).
 */
export const getIstDayBoundaries = (utcInstant) => {
  const dt = DateTime.fromJSDate(new Date(utcInstant), { zone: 'utc' }).setZone(SCHEDULING_CONFIG.MENTOR_TIMEZONE);
  
  const istDateStr = dt.toFormat('yyyy-MM-dd');
  const istStartOfDay = dt.startOf('day');
  const istEndOfDay = dt.endOf('day');

  return {
    istDate: istDateStr,
    dayStartUtc: istStartOfDay.toUTC().toJSDate(),
    dayEndUtc: istEndOfDay.toUTC().toJSDate(),
  };
};

/**
 * Given a parent's requested date (YYYY-MM-DD) and parent timezone,
 * return the start and end of that local calendar day converted to UTC.
 */
export const getParentDayBoundaries = (dateStr, parentTimezone) => {
  const startLocal = DateTime.fromISO(`${dateStr}T00:00:00.000`, { zone: parentTimezone });
  const endLocal = DateTime.fromISO(`${dateStr}T23:59:59.999`, { zone: parentTimezone });

  return {
    dayStartUtc: startLocal.toUTC().toJSDate(),
    dayEndUtc: endLocal.toUTC().toJSDate(),
  };
};

/**
 * Get comprehensive timezone metadata for an instant
 */
export const getTimezoneMetadata = (utcInstant, timezone) => {
  const dt = DateTime.fromJSDate(new Date(utcInstant), { zone: 'utc' }).setZone(timezone);
  return {
    timezone,
    formattedTime: dt.toFormat('hh:mm a'),
    formattedDate: dt.toFormat('dd LLL yyyy'),
    offsetMinutes: dt.offset,
    offsetString: dt.toFormat('ZZZZ (ZZ)'),
    isDST: dt.isInDST,
    abbreviation: getTimezoneAbbreviation(dt),
  };
};

/**
 * Format a start and end interval for user display in a target timezone
 * e.g. "10:00 AM - 10:50 AM EDT (15 Oct 2026)"
 */
export const formatLocalizedInterval = (startUtc, endUtc, timezone) => {
  const startDt = DateTime.fromJSDate(new Date(startUtc), { zone: 'utc' }).setZone(timezone);
  const endDt = DateTime.fromJSDate(new Date(endUtc), { zone: 'utc' }).setZone(timezone);

  const startTimeStr = startDt.toFormat('hh:mm a');
  const endTimeStr = endDt.toFormat('hh:mm a');
  const tzAbbr = getTimezoneAbbreviation(startDt);
  const dateStr = startDt.toFormat('dd LLL yyyy');

  return `${startTimeStr} - ${endTimeStr} ${tzAbbr} (${dateStr})`;
};
