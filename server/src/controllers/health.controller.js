import { successResponse } from '../utils/apiResponse.js';
import { isDbConnected } from '../config/db.js';
import { isPostgresConnected } from '../config/postgres.js';
import { DateTime } from 'luxon';

export const getHealthStatus = (req, res) => {
  const serverTimeUtc = DateTime.utc().toISO();
  const serverTimeIst = DateTime.now().setZone('Asia/Kolkata').toISO();

  let dbStatus = 'disconnected';
  if (isPostgresConnected()) {
    dbStatus = 'connected (PostgreSQL)';
  } else if (isDbConnected()) {
    dbStatus = 'connected (MongoDB)';
  }

  const healthData = {
    status: 'healthy',
    service: 'Codeyoung Trial Class Booking API',
    version: '1.0.0',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: serverTimeUtc,
    indiaTime: serverTimeIst,
    environment: process.env.NODE_ENV || 'development',
  };

  return successResponse(res, healthData, 'API service is operational');
};
