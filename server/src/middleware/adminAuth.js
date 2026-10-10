import { config } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Authentication middleware for Admin API endpoints.
 * Validates request header `x-admin-key` or `Authorization: Bearer <token>`.
 */
export const adminAuth = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  const configuredKey = config.adminApiKey;

  if (!providedKey || providedKey !== configuredKey) {
    return errorResponse(
      res,
      'Unauthorized: Administrative access requires a valid admin API key. Please provide it via the x-admin-key header or Bearer authorization.',
      401,
      'UNAUTHORIZED_ADMIN_ACCESS'
    );
  }

  next();
};

export default adminAuth;
