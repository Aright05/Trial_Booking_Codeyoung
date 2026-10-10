import { query, pool, connectPostgres } from '../config/postgres.js';
import { SAMPLE_MENTORS } from './seedMentors.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';

/**
 * Seed exactly 10 mentors into PostgreSQL idempotently
 */
export const seedPostgresMentors = async () => {
  console.log('--- Starting PostgreSQL Mentor Database Seeding ---');
  console.log(`Targeting exactly ${SAMPLE_MENTORS.length} mentors...`);

  // Ensure tables exist
  await initPostgresSchema();

  let insertedCount = 0;
  let updatedCount = 0;

  for (const mentor of SAMPLE_MENTORS) {
    const existingRes = await query('SELECT id FROM mentors WHERE email = $1', [mentor.email.toLowerCase()]);

    if (existingRes.rows.length > 0) {
      // Update existing record
      await query(
        `UPDATE mentors
         SET name = $1, timezone = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
         WHERE email = $4`,
        [mentor.name, mentor.timezone, mentor.isActive, mentor.email.toLowerCase()]
      );
      updatedCount++;
    } else {
      // Insert new record
      await query(
        `INSERT INTO mentors (name, email, timezone, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [mentor.name, mentor.email.toLowerCase(), mentor.timezone, mentor.isActive]
      );
      insertedCount++;
    }
  }

  const countRes = await query('SELECT COUNT(*) AS total FROM mentors');
  const totalCount = parseInt(countRes.rows[0]?.total || '0', 10);

  console.log('--- PostgreSQL Mentor Seeding Complete ---');
  console.log(`Inserted: ${insertedCount} new mentor(s)`);
  console.log(`Updated/Verified: ${updatedCount} existing mentor(s)`);
  console.log(`Total Mentors in PostgreSQL Database: ${totalCount}`);

  return {
    insertedCount,
    updatedCount,
    totalCount,
  };
};

// Direct CLI execution only when explicitly invoked as seedPostgresMentors.js
const isDirectExecution = process.argv[1]?.endsWith('seedPostgresMentors.js');

if (isDirectExecution) {
  (async () => {
    try {
      const connected = await connectPostgres();
      if (!connected) {
        console.error('Cannot seed PostgreSQL: Database connection failed.');
        process.exit(1);
      }

      await seedPostgresMentors();
      if (pool?.end) await pool.end().catch(() => {});
      process.exit(0);
    } catch (err) {
      console.error('Fatal error during PostgreSQL mentor seeding:', err);
      if (pool?.end) await pool.end().catch(() => {});
      process.exit(1);
    }
  })();
}
