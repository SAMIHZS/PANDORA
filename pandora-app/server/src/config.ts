import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // App
  APP_NAME: process.env.APP_NAME || 'PANDORA',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  DEBUG: process.env.DEBUG === 'true',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Database
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017/pandora',
  DB_NAME: process.env.DB_NAME || 'pandora',

  // JWT
  SECRET_KEY: process.env.SECRET_KEY || 'your-secret-key-change-in-production',
  ALGORITHM: process.env.ALGORITHM || 'HS256',
  ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '15', 10),
  REFRESH_TOKEN_EXPIRE_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '7', 10),

  // OAuth2 Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',

  // Email/MFA
  SMTP_SERVER: process.env.SMTP_SERVER || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@pandora.app',

  // DTSS Thresholds
  DTSS_INIT_SCORE: parseInt(process.env.DTSS_INIT_SCORE || '60', 10),
  DTSS_THRESHOLD_FULL: parseInt(process.env.DTSS_THRESHOLD_FULL || '70', 10), // Full access
  DTSS_THRESHOLD_MEDIUM: parseInt(process.env.DTSS_THRESHOLD_MEDIUM || '40', 10), // View-only + MFA
  DTSS_THRESHOLD_LOW: parseInt(process.env.DTSS_THRESHOLD_LOW || '0', 10), // Blocked + alert

  // DTSS Point Changes
  DTSS_NEW_COUNTRY_LOSS: parseInt(process.env.DTSS_NEW_COUNTRY_LOSS || '15', 10),
  DTSS_FAILED_LOGIN_LOSS: parseInt(process.env.DTSS_FAILED_LOGIN_LOSS || '5', 10),
  DTSS_MFA_SUCCESS_GAIN: parseInt(process.env.DTSS_MFA_SUCCESS_GAIN || '10', 10),
  DTSS_ADMIN_APPROVAL_GAIN: parseInt(process.env.DTSS_ADMIN_APPROVAL_GAIN || '20', 10),
  DTSS_CLEAN_WEEK_GAIN: parseInt(process.env.DTSS_CLEAN_WEEK_GAIN || '5', 10),

  // MFA
  MFA_OTP_EXPIRE_MINUTES: parseInt(process.env.MFA_OTP_EXPIRE_MINUTES || '10', 10),
  MFA_OTP_LENGTH: parseInt(process.env.MFA_OTP_LENGTH || '6', 10),

  // Join Invites
  JOIN_INVITE_EXPIRE_HOURS: parseInt(process.env.JOIN_INVITE_EXPIRE_HOURS || '24', 10),

  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),

  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
};
