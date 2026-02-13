import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createPortalSession, getOrCreateCustomer } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get or create Stripe customer
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      customerId = await getOrCreateCustomer(session.user.id, session.user.email, session.user.name);
      await db.update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const portal = await createPortalSession(customerId, `${baseUrl}/dashboard/billing`);

    return NextResponse.json(portal);
  } catch (error: any) {
    console.error('[billing/portal] Error:', error);
    return NextResponse.json({ error: 'Failed to create billing portal' }, { status: 500 });
  }
}
