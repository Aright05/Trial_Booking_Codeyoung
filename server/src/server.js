import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectPostgres, pool } from './config/postgres.js';
import { seedPostgresMentors } from './scripts/seedPostgresMentors.js';

// Initialize Database Connections
(async () => {
  try {
    if (process.env.DATABASE_URL || process.env.POSTGRES_URI) {
      const pgSuccess = await connectPostgres();
      if (pgSuccess) {
        await seedPostgresMentors().catch(e => console.error('[PostgreSQL Error] Auto-seed error:', e.message));
      }
    } else {
      await connectDB().catch(() => {
        console.warn('[Database Warning] MongoDB connection attempt failed at startup. API will run in standalone mode until database is connected.');
      });
    }
  } catch (err) {
    console.error('[Database Error] Initialization failed:', err.message);
  }
})();

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`Codeyoung Trial Booking Server is running`);
  console.log(`Port: ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health Check: http://localhost:${config.port}/api/health`);
  console.log(`Mentors API:  http://localhost:${config.port}/api/mentors`);
  console.log(`=============================================`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  await disconnectDB();
  if (pool?.end) await pool.end().catch(() => {});
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
