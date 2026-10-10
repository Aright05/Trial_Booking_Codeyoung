import mongoose from 'mongoose';
import { config } from './env.js';

/**
 * Mask MongoDB connection string for safe logging without leaking credentials
 */
export const maskMongoUri = (uri) => {
  if (!uri) return '';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  } catch {
    return 'mongodb://[masked]';
  }
};

/**
 * Connect to MongoDB using Mongoose
 * @param {Object} options Configuration options
 * @param {boolean} options.exitOnError Whether to process.exit(1) on failure (used for standalone scripts)
 */
export const connectDB = async (options = { exitOnError: false }) => {
  const uri = config.mongoUri;
  const maskedUri = maskMongoUri(uri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });

    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB at ${maskedUri}:`, error.message);

    if (options.exitOnError) {
      console.error('[Database] Exiting process due to database connection failure.');
      process.exit(1);
    }
    return null;
  }
};

/**
 * Check if Mongoose connection is ready (readyState 1 = connected)
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected.');
  }
};
