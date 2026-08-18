'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Route-level error boundary. Without this, an unhandled error anywhere in
// the app tree falls through to Next.js's default error screen, which has
// no navigation at all — the user is stuck with no way back to the
// dashboard except the browser's own back button.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="text-slate-900 dark:text-slate-100 flex flex-col w-full flex-1">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <Card className="w-full border-slate-200 dark:border-slate-800">
          <CardContent className="flex flex-col items-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Something went wrong
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Link href="/dashboard">
                <Button>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
