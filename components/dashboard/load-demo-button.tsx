'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';

export function LoadDemoButton({
  className,
  size = 'default',
  variant = 'secondary',
}: {
  className?: string;
  size?: 'default' | 'lg' | 'sm';
  variant?: 'default' | 'gradient' | 'secondary' | 'outline';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/demo');
      if (res.ok) {
        const data = await res.json();
        router.push(`/investigations/${data.id || 'demo-incident-001'}`);
      } else {
        router.push('/investigations/demo-incident-001');
      }
    } catch {
      router.push('/investigations/demo-incident-001');
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLoadDemo}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4 text-[#ff1053]" />
      )}
      <span>{loading ? 'LOADING DEMO...' : 'LOAD DEMO INCIDENT'}</span>
    </Button>
  );
}
