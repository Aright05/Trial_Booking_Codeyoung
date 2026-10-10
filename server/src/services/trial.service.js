import { query } from '../config/postgres.js';
import { normalizeEmail } from '../utils/emailNormalizer.js';

/**
 * Check if an email address is eligible for a free trial class.
 *
 * Rules:
 * - Exactly one free trial per normalized Gmail identity.
 * - Non-Gmail addresses are checked by normalized (lowercased/trimmed) string.
 * - Entitlement is preserved forever once claimed, even if a booking was subsequently cancelled.
 *
 * @param {string} rawEmail - Email address to verify
 * @returns {Promise<Object>} Eligibility result
 */
export const checkFreeTrialEligibility = async (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') {
    const error = new Error('Email address is required to check trial eligibility.');
    error.statusCode = 400;
    error.code = 'INVALID_EMAIL';
    throw error;
  }

  const norm = normalizeEmail(rawEmail);
  if (!norm.isValid) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    error.code = 'INVALID_EMAIL';
    throw error;
  }

  // 1. Check in free_trial_entitlements table
  const entitlementRes = await query(
    'SELECT id, normalized_email, claimed_at FROM free_trial_entitlements WHERE normalized_email = $1',
    [norm.normalizedEmail]
  );

  let isClaimed = entitlementRes.rows.length > 0;

  // 2. Also check if there is an existing booking in bookings table with this normalized email as a fallback
  if (!isClaimed) {
    const bookingRes = await query(
      'SELECT id FROM bookings WHERE normalized_parent_email = $1 LIMIT 1',
      [norm.normalizedEmail]
    );
    if (bookingRes.rows.length > 0) {
      isClaimed = true;
    }
  }

  return {
    eligible: !isClaimed,
    normalizedEmail: norm.normalizedEmail,
    isGmail: norm.isGmail,
    reason: isClaimed
      ? (norm.isGmail
          ? 'Each parent can use exactly one free trial for their Gmail account. A free trial has already been claimed for this Gmail identity (including aliases/dot variations).'
          : 'A free trial has already been claimed for this email address.')
      : null,
    code: isClaimed ? 'FREE_TRIAL_ALREADY_USED' : null,
  };
};
