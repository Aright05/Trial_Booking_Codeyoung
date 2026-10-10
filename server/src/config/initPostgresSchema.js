import { query } from './postgres.js';

/**
 * Initialize and migrate PostgreSQL Schema (Mentors and Bookings tables)
 */
export const initPostgresSchema = async () => {
  // 1. Mentors table
  const createMentorsTableQuery = `
    CREATE TABLE IF NOT EXISTS mentors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 2. Bookings table
  const createBookingsTableQuery = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      booking_reference VARCHAR(50) UNIQUE,
      parent_name VARCHAR(100) NOT NULL,
      parent_email VARCHAR(255) NOT NULL,
      parent_timezone VARCHAR(100) NOT NULL,
      mentor_id INTEGER REFERENCES mentors(id) ON DELETE CASCADE,
      start_at TIMESTAMP WITH TIME ZONE NOT NULL,
      end_at TIMESTAMP WITH TIME ZONE NOT NULL,
      demo_class_link TEXT DEFAULT '',
      demo_token VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      notification JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 3. Free trial entitlements table (1 trial per normalized Gmail identity)
  const createTrialEntitlementsTableQuery = `
    CREATE TABLE IF NOT EXISTS free_trial_entitlements (
      id SERIAL PRIMARY KEY,
      normalized_email VARCHAR(255) NOT NULL UNIQUE,
      original_email VARCHAR(255) NOT NULL,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 4. Subscriptions table (Paid subscription plans records)
  const createSubscriptionsTableQuery = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(100) PRIMARY KEY,
      parent_name VARCHAR(100) NOT NULL,
      parent_email VARCHAR(255) NOT NULL,
      normalized_parent_email VARCHAR(255) NOT NULL,
      plan_id VARCHAR(50) NOT NULL,
      plan_name VARCHAR(100) NOT NULL,
      price_paise INTEGER NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
      payment_provider_ref VARCHAR(255),
      duration_days INTEGER NOT NULL,
      starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await query(createMentorsTableQuery).catch(() => {});
  await query(createBookingsTableQuery).catch(() => {});
  await query(createTrialEntitlementsTableQuery).catch(() => {});
  await query(createSubscriptionsTableQuery).catch(() => {});

  // Safe additive migrations for existing tables
  await query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(50);').catch(() => {});
  await query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS demo_token VARCHAR(100);').catch(() => {});
  await query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;').catch(() => {});
  await query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;').catch(() => {});
  await query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS normalized_parent_email VARCHAR(255);').catch(() => {});

  // Create performance & constraint indexes
  await query('CREATE INDEX IF NOT EXISTS idx_mentors_email ON mentors(email);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_mentors_is_active ON mentors(is_active);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_bookings_mentor_time_status ON bookings(mentor_id, start_at, status);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_bookings_parent_email ON bookings(parent_email, start_at);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_bookings_normalized_email ON bookings(normalized_parent_email);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_bookings_start_end_status ON bookings(start_at, end_at, status);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_trial_entitlements_normalized ON free_trial_entitlements(normalized_email);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(parent_email);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_normalized_email ON subscriptions(normalized_parent_email);').catch(() => {});
  await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);').catch(() => {});

  // Try creating btree_gist extension and PostgreSQL exclusion constraint for zero-overlap guarantee
  try {
    await query('CREATE EXTENSION IF NOT EXISTS btree_gist;');
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'no_mentor_overlap_exclude'
        ) THEN
          ALTER TABLE bookings
          ADD CONSTRAINT no_mentor_overlap_exclude
          EXCLUDE USING gist (
            mentor_id WITH =,
            tstzrange(start_at, end_at, '[)') WITH &&
          )
          WHERE (status != 'cancelled');
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END $$;
    `);
  } catch {
    // Gracefully handle environments (like pg-mem) where btree_gist is not available
  }
};

