/**
 * Structured JSON logger with correlation ID support.
 * 
 * In production (Vercel/Railway), logs are JSON for easy parsing.
 * In development, logs are human-readable.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User signed up', { userId: '123', email: 'a@b.com' });
 *   logger.error('Payment failed', { error: err.message, stripeId: 'sub_xxx' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'] || 1;
const IS_PROD = process.env.NODE_ENV === 'production';

function log(level: LogLevel, message: string, data?: Record<string, any>) {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (IS_PROD) {
    // JSON for log aggregation (Vercel, Datadog, etc.)
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(entry));
  } else {
    // Human-readable for dev
    const prefix = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`${prefix} [${level.toUpperCase()}] ${message}`, data || '');
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, any>) => log('debug', msg, data),
  info: (msg: string, data?: Record<string, any>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, any>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, any>) => log('error', msg, data),
};
