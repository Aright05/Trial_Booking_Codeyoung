import {
  getAdminStats,
  getAdminBookings,
  getAdminMentorsOverview,
  cancelBooking,
} from '../services/admin.service.js';
import { sendBookingNotifications } from '../services/email.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/admin/stats
 */
export const getStatsHandler = async (req, res, next) => {
  try {
    const stats = await getAdminStats();
    return successResponse(res, stats, 'Admin statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/bookings
 */
export const getBookingsHandler = async (req, res, next) => {
  try {
    const { status, mentorId, date, search, page, limit } = req.query;
    const result = await getAdminBookings({
      status,
      mentorId,
      date,
      search,
      page,
      limit,
    });

    return successResponse(res, result, 'Admin bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/mentors
 */
export const getMentorsHandler = async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await getAdminMentorsOverview(date);

    return successResponse(res, result, 'Mentor capacity overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH or POST /api/admin/bookings/:id/cancel
 */
export const cancelBookingHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const result = await cancelBooking(id, { reason });

    return successResponse(res, result, 'Booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/bookings/:id/retry-notification
 */
export const retryNotificationHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sendBookingNotifications(id, { force: true });

    return successResponse(res, result, 'Notification retry processed');
  } catch (error) {
    next(error);
  }
};
