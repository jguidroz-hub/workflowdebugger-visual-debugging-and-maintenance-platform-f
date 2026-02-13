import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Rate limit: 5 attempts per IP per 15 min
  const ip = getClientIp(request);
  const rl = checkRateLimit(`reset-confirm:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password too long' }, { status: 400 });
    }

    // Find valid, non-expired token
    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await db
      .update(users)
      .set({ hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, record.identifier));

    // Delete ALL tokens for this user (invalidate any other reset links)
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, record.identifier));

    return NextResponse.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error: any) {
    console.error('[auth/reset-confirm] Error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
