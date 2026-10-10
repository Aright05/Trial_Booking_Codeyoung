/**
 * Business & Scheduling Constants for Codeyoung Trial Booking System
 */
export const SCHEDULING_CONFIG = {
  // Class duration in minutes
  CLASS_DURATION_MINUTES: 50,

  // Slot step interval in minutes (hourly slots)
  SLOT_INTERVAL_MINUTES: 60,

  // Strict daily limit per mentor on an India (IST) calendar day
  MAX_DAILY_CLASSES_PER_MENTOR: 2,

  // Total mentors baseline
  TOTAL_ACTIVE_MENTORS: 10,

  // Mentor operational timezone
  MENTOR_TIMEZONE: 'Asia/Kolkata',

  // Operational window in mentor's time (09:00 AM to 10:00 PM IST)
  // This allows mentors to cover classes for US morning/afternoon and UK daytime smoothly
  OPERATIONAL_START_HOUR_IST: 9,
  OPERATIONAL_END_HOUR_IST: 22,

  // Base URL for generated demo video links
  DEMO_MEET_BASE_URL: process.env.DEMO_CLASS_BASE_URL || process.env.DEMO_MEET_BASE_URL || 'https://meet.codeyoung.com/room',
  DEMO_CLASS_BASE_URL: process.env.DEMO_CLASS_BASE_URL || process.env.DEMO_MEET_BASE_URL || 'https://meet.codeyoung.com/room',
};

