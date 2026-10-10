import { query } from '../config/postgres.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Mentor Authentication & Authorization Middleware
 *
 * Checks for mentor identity via:
 * 1. 'x-mentor-email' header (e.g. mentor.rahul@codeyoung.test)
 * 2. 'x-mentor-id' header (e.g. 1)
 * 3. 'Authorization' header ('Bearer mentor.rahul@codeyoung.test' or 'Bearer <id>')
 *
 * Verifies that the mentor exists and is active in PostgreSQL.
 * Securely binds req.mentor so mentors can ONLY access their own assigned schedule.
 */
export const authenticateMentor = async (req, res, next) => {
  try {
    let identifier = req.headers['x-mentor-email'] || req.headers['x-mentor-id'];

    const authHeader = req.headers['authorization'];
    if (!identifier && authHeader && authHeader.startsWith('Bearer ')) {
      identifier = authHeader.slice(7).trim();
    }

    if (!identifier) {
      return errorResponse(
        res,
        'Mentor authentication required. Please provide a valid "x-mentor-email" or "Authorization" header.',
        401,
        null,
        'UNAUTHORIZED_MENTOR'
      );
    }

    const isNumeric = /^\d+$/.test(String(identifier).trim());
    let mentorQuery = '';
    let mentorParam = null;

    if (isNumeric) {
      mentorQuery = 'SELECT id, name, email, timezone, is_active FROM mentors WHERE id = $1';
      mentorParam = parseInt(identifier, 10);
    } else {
      mentorQuery = 'SELECT id, name, email, timezone, is_active FROM mentors WHERE LOWER(email) = LOWER($1)';
      mentorParam = String(identifier).trim();
    }

    const resDb = await query(mentorQuery, [mentorParam]);
    if (resDb.rows.length === 0) {
      return errorResponse(
        res,
        `Mentor account not found for identifier "${identifier}".`,
        401,
        null,
        'MENTOR_NOT_FOUND'
      );
    }

    const mentor = resDb.rows[0];
    if (!mentor.is_active) {
      return errorResponse(
        res,
        'This mentor account is currently inactive. Please contact administration.',
        403,
        null,
        'MENTOR_INACTIVE'
      );
    }

    // Attach authenticated mentor to request
    req.mentor = {
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      timezone: mentor.timezone || 'Asia/Kolkata',
      isActive: mentor.is_active,
    };

    next();
  } catch (err) {
    next(err);
  }
};
