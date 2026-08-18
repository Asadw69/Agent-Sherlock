'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Wrench, RotateCcw } from 'lucide-react';

export interface GenerateFixButtonProps {
  incidentId: string;
  hasExistingFix: boolean;
}

export function GenerateFixButton({ incidentId, hasExistingFix }: GenerateFixButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (isGenerating) return; // guard against double-click
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/fix`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate recommended fix');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to reach the server');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col items-start gap-2">
      <Button onClick={handleGenerate} disabled={isGenerating} variant={hasExistingFix ? 'outline' : 'default'} size="sm">
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : hasExistingFix ? (
          <RotateCcw className="mr-2 h-4 w-4" />
        ) : (
          <Wrench className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? 'Generating...' : hasExistingFix ? 'Regenerate Fix' : 'Generate Recommended Fix'}
      </Button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
