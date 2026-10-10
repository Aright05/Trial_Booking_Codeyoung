import { DateTime } from 'luxon';

/**
 * Supported primary timezones for the Codeyoung Trial Class System
 */
export const SUPPORTED_TIMEZONES = [
  {
    id: 'Asia/Kolkata',
    name: 'India Standard Time (IST)',
    shortCode: 'IST',
    city: 'India (New Delhi / Bangalore)',
    region: 'Asia',
  },
  {
    id: 'Europe/London',
    name: 'UK Time (GMT / BST)',
    shortCode: 'UK',
    city: 'United Kingdom (London)',
    region: 'Europe',
  },
  {
    id: 'America/New_York',
    name: 'Eastern Time (ET / EDT / EST)',
    shortCode: 'US-East',
    city: 'US Eastern (New York / Miami)',
    region: 'Americas',
  },
  {
    id: 'America/Los_Angeles',
    name: 'Pacific Time (PT / PDT / PST)',
    shortCode: 'US-West',
    city: 'US Pacific (Los Angeles / San Francisco)',
    region: 'Americas',
  },
];

/**
 * Returns formatted current time and offset string for a given timezone
 */
export const getTimezoneDisplayInfo = (zoneId) => {
  const dt = DateTime.now().setZone(zoneId);
  return {
    zoneId,
    formattedCurrentTime: dt.toFormat('hh:mm a'),
    offset: dt.toFormat('ZZZZ (ZZ)'),
    isDST: dt.isInDST,
    abbreviation: dt.offsetNameShort,
  };
};

/**
 * Detect the user's local timezone and fallback gracefully to one of the supported zones or user's zone
 */
export const detectUserTimezone = () => {
  try {
    const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const exists = SUPPORTED_TIMEZONES.some(tz => tz.id === userZone);
    if (exists) return userZone;
    
    // Check if US Eastern, Pacific, UK or IST equivalents
    if (userZone.includes('Calcutta') || userZone.includes('Kolkata')) return 'Asia/Kolkata';
    if (userZone.includes('London')) return 'Europe/London';
    if (userZone.includes('New_York')) return 'America/New_York';
    if (userZone.includes('Los_Angeles')) return 'America/Los_Angeles';
    
    return 'Asia/Kolkata'; // Default fallback
  } catch (e) {
    return 'Asia/Kolkata';
  }
};

/**
 * Format date for display in the given timezone
 */
export const formatDateInZone = (isoDateString, zoneId) => {
  if (!isoDateString) return '';
  return DateTime.fromISO(isoDateString, { zone: zoneId }).toFormat('cccc, dd LLL yyyy');
};

/**
 * Convert a time from one timezone to another with full daylight-saving accuracy
 */
export const convertTimeBetweenZones = (dateStr, timeStr, fromZone, toZone) => {
  // combine date and time in fromZone
  const combinedIso = `${dateStr}T${timeStr}:00`;
  const dt = DateTime.fromISO(combinedIso, { zone: fromZone });
  const targetDt = dt.setZone(toZone);
  return {
    targetTime: targetDt.toFormat('hh:mm a'),
    targetDate: targetDt.toFormat('dd LLL yyyy'),
    targetAbbr: targetDt.offsetNameShort,
  };
};
