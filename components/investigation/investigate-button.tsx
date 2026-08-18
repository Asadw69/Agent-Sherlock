'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Play, RotateCcw } from 'lucide-react';

export interface InvestigateButtonProps {
  incidentId: string;
  status: 'none' | 'pending' | 'in_progress' | 'completed' | 'failed';
}

export function InvestigateButton({ incidentId, status }: InvestigateButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = status === 'in_progress' || status === 'pending';

  useEffect(() => {
    if (isRunning) {
      pollRef.current = setInterval(() => router.refresh(), 2500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isRunning, router]);

  async function handleStart() {
    setError(null);
    setIsStarting(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/investigate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start investigation');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to reach the server');
    } finally {
      // Always clear the pending state, success or failure - otherwise the
      // button stays disabled/greyed out forever after a successful start,
      // since router.refresh() re-renders server data but doesn't reset
      // this client component's own local state.
      setIsStarting(false);
    }
  }

  if (isRunning) {
    return (
      <div className="text-center">
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Investigating...
        </Button>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          The AI agent is searching logs, code, and git history. This page updates automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Button onClick={handleStart} disabled={isStarting}>
        {isStarting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : status === 'completed' || status === 'failed' ? (
          <RotateCcw className="mr-2 h-4 w-4" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        {status === 'completed'
          ? 'Re-run Investigation'
          : status === 'failed'
            ? 'Retry Investigation'
            : 'Start AI Investigation'}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
