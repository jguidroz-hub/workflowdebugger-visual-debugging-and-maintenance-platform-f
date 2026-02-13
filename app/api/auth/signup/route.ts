import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Rate limit: 5 signups per IP per 15 min
  const ip = getClientIp(request);
  const rl = checkRateLimit(`signup:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name } = body;

    // ── Input Validation ──────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password too long' }, { status: 400 });
    }
    if (name && (typeof name !== 'string' || name.length > 100)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    // ── Check Existing User ───────────────────────────────
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      // Don't reveal whether email exists (security)
      // But DO return 400 so the UI can show a helpful message
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // ── Create User ───────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds for security

    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: cleanEmail,
        name: name?.trim() || null,
        hashedPassword,
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    // ── Welcome Email (non-blocking) ──────────────────────
    try {
      const { sendWelcomeEmail } = await import('@/lib/email');
      await sendWelcomeEmail(cleanEmail, name?.trim());
    } catch (emailErr) {
      console.warn('[auth/signup] Welcome email failed (signup succeeded):', emailErr);
    }

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[auth/signup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
