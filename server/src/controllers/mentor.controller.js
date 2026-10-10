import { Mentor } from '../models/Mentor.js';
import { isDbConnected } from '../config/db.js';
import { isPostgresConnected, query } from '../config/postgres.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Get all active mentors
 * GET /api/mentors
 */
export const getActiveMentors = async (req, res, next) => {
  try {
    // 1. Try PostgreSQL first if connected
    if (isPostgresConnected()) {
      const result = await query(
        'SELECT id, name, email, timezone, is_active as "isActive", created_at as "createdAt" FROM mentors WHERE is_active = true ORDER BY name ASC'
      );

      return successResponse(
        res,
        {
          count: result.rows.length,
          databaseType: 'PostgreSQL',
          mentors: result.rows,
        },
        'Active mentors retrieved successfully from PostgreSQL'
      );
    }

    // 2. Try MongoDB if connected
    if (isDbConnected()) {
      const mentors = await Mentor.find({ isActive: true })
        .select('name email timezone isActive createdAt')
        .sort({ name: 1 })
        .lean();

      return successResponse(
        res,
        {
          count: mentors.length,
          databaseType: 'MongoDB',
          mentors,
        },
        'Active mentors retrieved successfully from MongoDB'
      );
    }

    // 3. Neither DB is connected
    return errorResponse(
      res,
      'Database is currently unavailable. Please check your PostgreSQL or MongoDB connection in server/.env.',
      503
    );
  } catch (error) {
    next(error);
  }
};
