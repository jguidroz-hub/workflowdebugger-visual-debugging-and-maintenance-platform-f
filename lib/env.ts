/**
 * Environment variable validation — fail fast on missing config
 */
const required = (key: string): string => {
  const val = process.env[key];
  if (!val && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val || '';
};

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
