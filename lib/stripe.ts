import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  _stripe = new Stripe(key);
  return _stripe;
}

// ── Customer Management ───────────────────────────────────

export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const stripe = getStripe();
  
  // Check for existing customer by email
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    // Update metadata with userId if not set
    const customer = existing.data[0];
    if (!customer.metadata.userId) {
      await stripe.customers.update(customer.id, { metadata: { userId } });
    }
    return customer.id;
  }

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId },
  });
  return customer.id;
}

// ── Checkout ──────────────────────────────────────────────

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  name?: string | null;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}) {
  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(params.userId, params.email, params.name);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
    subscription_data: {
      metadata: { userId: params.userId },
      ...(params.trialDays ? { trial_period_days: params.trialDays } : {}),
    },
    // Allow promotion codes
    allow_promotion_codes: true,
    // Collect billing address for tax
    billing_address_collection: 'auto',
  };

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { id: session.id, url: session.url! };
}

// ── Subscription Management ───────────────────────────────

export async function cancelSubscription(subscriptionId: string, immediate = false) {
  const stripe = getStripe();
  if (immediate) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

export async function reactivateSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
}

export async function changeSubscriptionPlan(subscriptionId: string, newPriceId: string) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) throw new Error('No subscription item found');

  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: 'create_prorations',
  });
}

// ── Customer Portal ───────────────────────────────────────

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

// ── Webhook Verification ──────────────────────────────────

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
