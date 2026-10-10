import { createBooking, getBookingByIdOrReference } from '../services/booking.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Handle POST /api/bookings
 */
export const postBooking = async (req, res, next) => {
  try {
    const { parentName, parentEmail, parentTimezone, startAt } = req.body;

    const result = await createBooking({
      parentName,
      parentEmail,
      parentTimezone,
      startAt,
    });

    return successResponse(
      res,
      result,
      'Trial class booked successfully! A 1:1 demo link has been generated.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle GET /api/bookings/:id
 */
export const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getBookingByIdOrReference(id);

    return successResponse(res, result, 'Booking retrieved successfully');
  } catch (error) {
    next(error);
  }
};
