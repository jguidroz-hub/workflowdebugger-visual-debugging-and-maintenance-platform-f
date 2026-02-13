'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console (picked up by Vercel/Railway logs)
    console.error('[ErrorBoundary]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We hit an unexpected error. This has been logged and we&apos;ll look into it.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Go home
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
