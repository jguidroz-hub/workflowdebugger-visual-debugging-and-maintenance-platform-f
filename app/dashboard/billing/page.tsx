'use client';

import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/lib/use-auth-guard';
import Link from 'next/link';

interface SubscriptionData {
  id: string;
  status: string;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

export default function BillingPage() {
  const { isLoading: authLoading } = useAuthGuard();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then(r => r.json())
      .then(data => { setSub(data.subscription); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      // Refresh subscription data
      const fresh = await fetch('/api/billing/subscription').then(r => r.json());
      setSub(fresh.subscription);
    } catch { alert('Failed to update subscription'); }
    finally { setActionLoading(false); }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Failed to open billing portal');
    } catch { alert('Failed to open billing portal'); }
    finally { setActionLoading(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading billing...</div>
      </div>
    );
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      past_due: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      canceled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.canceled}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Billing</h1>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Current Plan</h2>
          {sub && statusBadge(sub.status)}
        </div>

        {!sub ? (
          <div>
            <p className="text-gray-500 mb-4">You&apos;re on the free plan.</p>
            <Link href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              Upgrade →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="font-medium">{sub.status}</span>
            </div>
            {sub.currentPeriodEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{sub.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}</span>
                <span className="font-medium">{formatDate(sub.currentPeriodEnd)}</span>
              </div>
            )}
            {sub.trialEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trial ends</span>
                <span className="font-medium">{formatDate(sub.trialEnd)}</span>
              </div>
            )}

            {sub.cancelAtPeriodEnd && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400">
                Your subscription will cancel on {formatDate(sub.currentPeriodEnd)}.{' '}
                <button onClick={() => handleAction('reactivate')} disabled={actionLoading}
                  className="underline font-medium hover:no-underline">
                  Reactivate
                </button>
              </div>
            )}

            {sub.status === 'past_due' && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                Your last payment failed. Please update your payment method to avoid losing access.
                <button onClick={handlePortal} disabled={actionLoading}
                  className="underline font-medium hover:no-underline ml-1">
                  Update payment →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {sub && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Manage Subscription</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={handlePortal} disabled={actionLoading}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
              Payment Method & Invoices
            </button>
            <Link href="/pricing"
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
              Change Plan
            </Link>
            {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
              <button onClick={() => {
                if (confirm('Are you sure you want to cancel? You\'ll keep access until the end of your billing period.')) {
                  handleAction('cancel');
                }
              }} disabled={actionLoading}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Billing FAQ</h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">How do I update my payment method?</p>
            <p>Click &ldquo;Payment Method & Invoices&rdquo; above to access the Stripe customer portal.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">What happens if I cancel?</p>
            <p>You&apos;ll keep access until the end of your current billing period. No refund for partial months.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Can I get a refund?</p>
            <p>We offer a 30-day money-back guarantee. Contact support@projectgreenbelt.com within 30 days of your first payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
