import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptions, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// Disable body parsing — Stripe needs raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout Complete ─────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        if (userId && customerId) {
          // Link Stripe customer to user
          await db.update(users)
            .set({ stripeCustomerId: customerId, updatedAt: new Date() })
            .where(eq(users.id, userId));
        }
        break;
      }

      // ── Subscription Created/Updated ──────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const userId = sub.metadata?.userId;
        if (!userId) {
          console.warn('[webhook] Subscription without userId metadata:', sub.id);
          break;
        }

        // Upsert subscription (idempotent)
        await db.insert(subscriptions).values({
          id: sub.id,
          userId,
          status: sub.status,
          priceId: sub.items?.data?.[0]?.price?.id || null,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end || false,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        }).onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            status: sub.status,
            priceId: sub.items?.data?.[0]?.price?.id || null,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            updatedAt: new Date(),
          },
        });

        // Send confirmation email on new active subscription
        if (event.type === 'customer.subscription.created' && sub.status === 'active') {
          try {
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user?.email) {
              const { sendSubscriptionEmail } = await import('@/lib/email');
              const planName = sub.items?.data?.[0]?.price?.nickname || 'Pro';
              await sendSubscriptionEmail(user.email, 'created', planName);
            }
          } catch (e) { console.warn('[webhook] Subscription email failed:', e); }
        }
        break;
      }

      // ── Subscription Deleted ──────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await db.update(subscriptions)
          .set({ status: 'canceled', updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        break;
      }

      // ── Invoice Payment Failed ────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subId = invoice.subscription as string;
        if (!subId) break;

        // Update subscription status
        await db.update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.id, subId));

        // Notify user
        try {
          const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
          if (sub) {
            const [user] = await db.select().from(users).where(eq(users.id, sub.userId)).limit(1);
            if (user?.email) {
              const { sendPaymentFailedEmail } = await import('@/lib/email');
              await sendPaymentFailedEmail(user.email, user.name || undefined);
            }
          }
        } catch (e) { console.warn('[webhook] Payment failed email error:', e); }
        break;
      }

      // ── Invoice Payment Succeeded ─────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subId = invoice.subscription as string;
        if (!subId) break;

        // Restore active status if was past_due
        await db.update(subscriptions)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(subscriptions.id, subId));
        break;
      }

      // ── Customer Deleted ──────────────────────────────
      case 'customer.deleted': {
        const customer = event.data.object as any;
        // Clear stripeCustomerId from user
        if (customer.metadata?.userId) {
          await db.update(users)
            .set({ stripeCustomerId: null, updatedAt: new Date() })
            .where(eq(users.id, customer.metadata.userId));
        }
        break;
      }

      default:
        // Log unhandled events for debugging (don't fail)
        console.log('[webhook] Unhandled event type:', event.type);
    }
  } catch (error: any) {
    console.error('[webhook] Processing error:', error);
    // Return 200 anyway — Stripe will retry on 5xx, and we don't want
    // retries for DB errors that will keep failing
    return NextResponse.json({ error: 'Processing error', received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
