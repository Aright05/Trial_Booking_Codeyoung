import { getAvailableSlots } from '../services/availability.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Handle GET /api/slots?date=YYYY-MM-DD&timezone=America/New_York
 */
export const getSlots = async (req, res, next) => {
  try {
    const { date, timezone } = req.query;

    if (!date) {
      const error = new Error('Query parameter "date" (YYYY-MM-DD) is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!timezone) {
      const error = new Error('Query parameter "timezone" (e.g. America/New_York, Asia/Kolkata) is required.');
      error.statusCode = 400;
      throw error;
    }

    const result = await getAvailableSlots(date, timezone);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
