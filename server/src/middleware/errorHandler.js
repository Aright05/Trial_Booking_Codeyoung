import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || null;

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const errors = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  return errorResponse(res, message, statusCode, errors, code);
};

