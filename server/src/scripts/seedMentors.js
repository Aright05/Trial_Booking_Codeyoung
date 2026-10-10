import { connectDB, disconnectDB } from '../config/db.js';
import { Mentor } from '../models/Mentor.js';
import { connectPostgres, pool } from '../config/postgres.js';
import { seedPostgresMentors } from './seedPostgresMentors.js';

/**
 * 10 Sample Fictional Mentors (Development Data)
 * Timezone: Asia/Kolkata (IST baseline for all 10 mentors per assignment specifications)
 */
export const SAMPLE_MENTORS = [
  {
    name: 'Rahul Sharma',
    email: 'mentor.rahul@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Ananya Verma',
    email: 'mentor.ananya@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Priya Patel',
    email: 'mentor.priya@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'David Joseph',
    email: 'mentor.david@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Sneha Nair',
    email: 'mentor.sneha@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Vikram Singhania',
    email: 'mentor.vikram@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Aarti Kulkarni',
    email: 'mentor.aarti@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Karan Malhotra',
    email: 'mentor.karan@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Rohan Mehra',
    email: 'mentor.rohan@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    name: 'Divya Sen',
    email: 'mentor.divya@codeyoung.test',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
];

/**
 * Seed or update mentors idempotently in MongoDB
 */
export const seedMongoMentors = async () => {
  console.log('--- Starting MongoDB Mentor Database Seeding ---');
  console.log(`Targeting exactly ${SAMPLE_MENTORS.length} mentors...`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const mentorData of SAMPLE_MENTORS) {
    const existing = await Mentor.findOne({ email: mentorData.email.toLowerCase() });

    if (existing) {
      existing.name = mentorData.name;
      existing.timezone = mentorData.timezone;
      existing.isActive = mentorData.isActive;
      await existing.save();
      updatedCount++;
    } else {
      await Mentor.create({
        name: mentorData.name,
        email: mentorData.email.toLowerCase(),
        timezone: mentorData.timezone,
        isActive: mentorData.isActive,
      });
      insertedCount++;
    }
  }

  const totalCount = await Mentor.countDocuments();

  console.log('--- MongoDB Mentor Seeding Complete ---');
  console.log(`Inserted: ${insertedCount} new mentor(s)`);
  console.log(`Updated/Verified: ${updatedCount} existing mentor(s)`);
  console.log(`Total Mentors in Database: ${totalCount}`);

  return {
    insertedCount,
    updatedCount,
    totalCount,
  };
};

// Auto-seed entrypoint
const isDirectExecution = process.argv[1]?.endsWith('seedMentors.js');

if (isDirectExecution) {
  (async () => {
    try {
      if (process.env.DATABASE_URL || process.env.POSTGRES_URI) {
        console.log('[Seed] Detected PostgreSQL configuration in environment.');
        const connected = await connectPostgres();
        if (connected) {
          await seedPostgresMentors();
          await pool.end();
          process.exit(0);
        }
      }

      console.log('[Seed] Seeding MongoDB...');
      const conn = await connectDB({ exitOnError: true });
      if (conn) {
        await seedMongoMentors();
        await disconnectDB();
        process.exit(0);
      }
    } catch (err) {
      console.error('Fatal error during mentor seeding:', err);
      process.exit(1);
    }
  })();
}
