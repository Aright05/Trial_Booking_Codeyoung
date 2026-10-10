/**
 * Standardized API Response Utilities
 */

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null, code = null) => {
  const finalCode = code || (
    statusCode === 409 ? 'CONFLICT' :
    statusCode === 400 ? 'BAD_REQUEST' :
    statusCode === 401 ? 'UNAUTHORIZED' :
    statusCode === 403 ? 'FORBIDDEN' :
    statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'
  );

  const payload = {
    success: false,
    message,
    code: finalCode,
    error: {
      code: finalCode,
      message,
    },
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

