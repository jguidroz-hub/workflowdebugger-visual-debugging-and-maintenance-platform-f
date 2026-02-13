import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { subscriptions, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { cancelSubscription, reactivateSubscription, changeSubscriptionPlan } from '@/lib/stripe';

export const runtime = 'nodejs';

// GET: Current subscription status
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, session.user.id),
        // Get the most recent active/trialing/past_due subscription
      ))
      .orderBy(subscriptions.createdAt)
      .limit(1);

    if (!sub) {
      return NextResponse.json({ subscription: null, plan: 'free' });
    }

    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        priceId: sub.priceId,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        trialEnd: sub.trialEnd?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[billing/subscription] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// PATCH: Cancel, reactivate, or change plan
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, newPriceId } = await request.json();

    // Get user's subscription
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel':
        await cancelSubscription(sub.id);
        await db.update(subscriptions)
          .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        return NextResponse.json({ message: 'Subscription will cancel at end of billing period' });

      case 'cancel_immediately':
        await cancelSubscription(sub.id, true);
        await db.update(subscriptions)
          .set({ status: 'canceled', updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        return NextResponse.json({ message: 'Subscription canceled immediately' });

      case 'reactivate':
        if (!sub.cancelAtPeriodEnd) {
          return NextResponse.json({ error: 'Subscription is not set to cancel' }, { status: 400 });
        }
        await reactivateSubscription(sub.id);
        await db.update(subscriptions)
          .set({ cancelAtPeriodEnd: false, updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        return NextResponse.json({ message: 'Subscription reactivated' });

      case 'change_plan':
        if (!newPriceId) {
          return NextResponse.json({ error: 'newPriceId is required' }, { status: 400 });
        }
        await changeSubscriptionPlan(sub.id, newPriceId);
        return NextResponse.json({ message: 'Plan changed successfully. Prorated charges applied.' });

      default:
        return NextResponse.json({ error: 'Invalid action. Use: cancel, cancel_immediately, reactivate, change_plan' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[billing/subscription] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update subscription' }, { status: 500 });
  }
}
