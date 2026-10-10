import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:172005@127.0.0.1:5000/postgres',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeyoung_booking',
  demoClassBaseUrl: process.env.DEMO_CLASS_BASE_URL || process.env.DEMO_MEET_BASE_URL || 'https://meet.codeyoung.com/room',
  adminApiKey: process.env.ADMIN_API_KEY || 'codeyoung-admin-secret-dev',
  email: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT, 10) || 587,
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'Codeyoung Trial <no-reply@codeyoung.com>',
  },
  // Backward compatibility aliases
  smtp: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT, 10) || 587,
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'Codeyoung Trial <no-reply@codeyoung.com>',
  },
};

