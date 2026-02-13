'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ── Request Reset Form ────────────────────────────────
  if (!token) {
    const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setMessage('');

      const email = new FormData(e.currentTarget).get('email') as string;

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessage(data.message);
      } catch (err: any) {
        setError(err.message || 'Failed to send reset email');
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleRequest} className="space-y-5">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-500">Enter your email and we&apos;ll send a reset link</p>
        </div>

        {message && <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">{message}</div>}
        {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="you@example.com" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">← Back to login</Link>
        </p>
      </form>
    );
  }

  // ── Set New Password Form ─────────────────────────────
  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }

    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('Password reset! You can now sign in.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-5">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {message} <Link href="/login" className="font-medium underline">Sign in →</Link>
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
        <input id="password" name="password" type="password" required minLength={8}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
          placeholder="At least 8 characters" />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
        <input id="confirm" name="confirm" type="password" required minLength={8}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
          placeholder="Confirm your password" />
      </div>

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition">
        {loading ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
        <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
