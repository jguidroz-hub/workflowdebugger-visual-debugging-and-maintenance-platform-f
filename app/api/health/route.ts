import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'ok' | 'error'; latencyMs: number; error?: string };
  };
}

const startTime = Date.now();

export async function GET() {
  const health: HealthCheck = {
    status: 'healthy',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || process.env.npm_package_version || '0.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: 'ok', latencyMs: 0 },
    },
  };

  // Database check
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    health.checks.database.latencyMs = Date.now() - dbStart;
  } catch (err: any) {
    health.checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      error: err.message?.slice(0, 100),
    };
    health.status = 'degraded';
  }

  // Overall status
  const hasErrors = Object.values(health.checks).some(c => c.status === 'error');
  if (hasErrors) health.status = 'unhealthy';

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store',
    },
  });
}
