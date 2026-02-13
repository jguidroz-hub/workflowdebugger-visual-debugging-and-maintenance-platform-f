/**
 * Server-side billing guard.
 * Check if user has an active subscription before allowing access to premium features.
 * 
 * Usage in API routes:
 *   const access = await checkAccess(userId);
 *   if (!access.hasAccess) return NextResponse.json({ error: access.reason }, { status: 403 });
 */

import { db } from './db';
import { subscriptions } from './schema';
import { eq, and, or, gte } from 'drizzle-orm';

export interface AccessCheck {
  hasAccess: boolean;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  reason?: string;
  subscription?: {
    id: string;
    status: string;
    trialEnd?: Date | null;
    currentPeriodEnd?: Date | null;
  };
}

export async function checkAccess(userId: string): Promise<AccessCheck> {
  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'trialing'),
            // Grace period: allow past_due for 7 days
            and(
              eq(subscriptions.status, 'past_due'),
              gte(subscriptions.currentPeriodEnd, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            )
          )
        )
      )
      .limit(1);

    if (!sub) {
      return { hasAccess: false, plan: 'free', reason: 'No active subscription. Please upgrade to access this feature.' };
    }

    // Determine plan from priceId
    const priceId = sub.priceId || '';
    let plan: AccessCheck['plan'] = 'starter';
    if (priceId.includes('pro') || priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro';
    if (priceId.includes('enterprise') || priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) plan = 'enterprise';

    return {
      hasAccess: true,
      plan,
      subscription: {
        id: sub.id,
        status: sub.status,
        trialEnd: sub.trialEnd,
        currentPeriodEnd: sub.currentPeriodEnd,
      },
    };
  } catch (error) {
    console.error('[billing-guard] Error checking access:', error);
    // Fail open in case of DB error — don't block users due to infrastructure issues
    return { hasAccess: true, plan: 'free', reason: 'Access check failed — allowing temporarily' };
  }
}
