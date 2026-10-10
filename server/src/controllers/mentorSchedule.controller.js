import { getMentorSchedule } from '../services/mentorSchedule.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Handle GET /api/mentor/me/schedule
 */
export const getMySchedule = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = await getMentorSchedule(req.mentor, { from, to });

    return successResponse(
      res,
      result,
      `Schedule retrieved successfully for ${req.mentor.name}.`
    );
  } catch (error) {
    next(error);
  }
};
