'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

const plans = [
  {
    "id": "starter",
    "name": "Starter",
    "price": 9,
    "features": [
      "Core features",
      "Up to 100 items",
      "Email support"
    ],
    "highlight": false
  },
  {
    "id": "pro",
    "name": "Pro",
    "price": 29,
    "features": [
      "Everything in Starter",
      "Unlimited items",
      "Priority support",
      "API access"
    ],
    "highlight": true
  }
];

function PricingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const canceled = searchParams.get('canceled');

  const handleSubscribe = async (planId: string) => {
    if (!session?.user) {
      router.push(`/signup?plan=${planId}`);
      return;
    }

    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to start checkout');
        return;
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
          {canceled && (
            <div className="mt-4 inline-block bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-lg text-sm">
              Checkout was canceled. Feel free to try again when you&apos;re ready.
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border-2 transition-shadow hover:shadow-md ${
                plan.highlight
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {loading === plan.id ? 'Starting checkout...' : 'Start free trial'}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12">
          All plans include a 14-day free trial. Cancel anytime.{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms apply</Link>.
        </p>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
