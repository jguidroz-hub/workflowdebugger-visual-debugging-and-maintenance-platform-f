import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Rate limit: 3 reset requests per IP per 15 min
  const ip = getClientIp(request);
  const rl = checkRateLimit(`reset:${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });

    // Check if user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) return successResponse;

    // Generate cryptographically secure token
    const token = [crypto.randomUUID(), crypto.randomUUID()].join('-');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await db.insert(verificationTokens).values({
      identifier: cleanEmail,
      token,
      expires,
    });

    // Send reset email (non-blocking)
    try {
      const { sendPasswordResetEmail } = await import('@/lib/email');
      await sendPasswordResetEmail(cleanEmail, token);
    } catch (emailErr) {
      console.error('[auth/reset] Email send failed:', emailErr);
      // Don't expose email failure to user — they'll just not receive it
    }

    return successResponse;
  } catch (error: any) {
    console.error('[auth/reset] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
