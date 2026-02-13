import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, sessions, accounts, subscriptions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    // Require confirmation text to prevent accidental deletion
    if (body.confirm !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please confirm by sending { "confirm": "DELETE MY ACCOUNT" }' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Cancel active subscriptions first
    try {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (sub && sub.status === 'active') {
        // Import Stripe and cancel
        try {
          const stripe = (await import('stripe')).default;
          const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
          await stripeClient.subscriptions.update(sub.id, { cancel_at_period_end: true });
        } catch (stripeErr) {
          console.warn('[delete-account] Stripe cancel failed:', stripeErr);
          // Continue with deletion even if Stripe fails — we'll handle orphaned subs in billing reconciliation
        }
      }
    } catch { /* subscriptions table might not exist for simpler ventures */ }

    // Delete in order: subscriptions → sessions → accounts → user
    // Foreign keys with ON DELETE CASCADE should handle this, but being explicit
    try { await db.delete(subscriptions).where(eq(subscriptions.userId, userId)); } catch {}
    try { await db.delete(sessions).where(eq(sessions.userId, userId)); } catch {}
    try { await db.delete(accounts).where(eq(accounts.userId, userId)); } catch {}
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('[delete-account] Error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
