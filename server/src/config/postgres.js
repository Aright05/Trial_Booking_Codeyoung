import pg from 'pg';
import dotenv from 'dotenv';
import { newDb } from 'pg-mem';

dotenv.config();

const { Pool } = pg;

export const postgresUri = process.env.DATABASE_URL || process.env.POSTGRES_URI || process.env.POSTGRESQL_URL || '';

/**
 * Mask PostgreSQL connection string for safe logging
 */
export const maskPostgresUri = (uri) => {
  if (!uri) return '';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  } catch {
    return 'postgresql://[masked]';
  }
};

const isCloudDb = postgresUri.includes('neon.tech') || 
                  postgresUri.includes('supabase.co') || 
                  postgresUri.includes('render.com') || 
                  postgresUri.includes('aivencloud.com') ||
                  postgresUri.includes('sslmode=require');

let pool = null;
let memDb = null;
let memAdapter = null;
let isConnected = false;
let isMemoryMode = false;

// If a live connection string is provided (and not a dummy placeholder)
const isLiveUri = Boolean(
  postgresUri && 
  !postgresUri.includes('hostname') && 
  !postgresUri.includes('databasename') &&
  postgresUri !== 'memory'
);

if (isLiveUri) {
  pool = new Pool({
    connectionString: postgresUri,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Initialize In-Memory PostgreSQL engine (Zero-config local fallback)
 */
const initMemoryPostgres = () => {
  memDb = newDb();
  // Register gen_random_uuid support
  memDb.public.registerFunction({
    name: 'now',
    returns: memDb.public.getType('timestamp with time zone') || undefined,
    implementation: () => new Date(),
  });

  memAdapter = memDb.adapters.createPg();
  pool = new memAdapter.Pool();
  isMemoryMode = true;
  isConnected = true;
  console.log('[Database] Running with Embedded PostgreSQL Engine (Instant local mode with full SQL support).');
};

/**
 * Connect to PostgreSQL (Live instance with automatic zero-config memory fallback)
 */
export const connectPostgres = async () => {
  if (isLiveUri && pool) {
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT current_database(), current_user, version()');
      client.release();

      isConnected = true;
      isMemoryMode = false;
      console.log(`[Database] PostgreSQL connected successfully! Database: ${res.rows[0].current_database}`);
      return true;
    } catch (error) {
      console.warn(`[Database Warning] Could not connect to live PostgreSQL (${error.message}). Falling back to embedded PostgreSQL.`);
      initMemoryPostgres();
      return true;
    }
  }

  // If no live URI or placeholder detected, start embedded PostgreSQL
  initMemoryPostgres();
  return true;
};

export const isPostgresConnected = () => isConnected;
export const isPostgresMemoryMode = () => isMemoryMode;

/**
 * Execute query against active PostgreSQL pool
 */
export const query = async (text, params) => {
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized');
  }
  return pool.query(text, params);
};

export { pool };
