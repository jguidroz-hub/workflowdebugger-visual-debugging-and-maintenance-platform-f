import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export const runtime = 'nodejs';

const PRICE_IDS: Record<string, string> = {
    'starter': process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    'pro': process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Please sign in to subscribe' }, { status: 401 });
  }

  try {
    const { planId } = await request.json();
    const priceId = PRICE_IDS[planId];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    const checkout = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      priceId,
      successUrl: `${baseUrl}/dashboard?upgraded=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      trialDays: 14,
    });

    return NextResponse.json(checkout);
  } catch (error: any) {
    console.error('[billing/checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
