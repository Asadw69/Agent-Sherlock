'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Evidence } from '@/lib/types';
import { CheckCircle2, AlertCircle, HelpCircle, FileText, Search } from 'lucide-react';

const strengthConfig: Record<string, { icon: React.ReactNode; label: string; badge: string }> = {
  weak: {
    icon: <HelpCircle className="h-4 w-4 text-amber-400" />,
    label: 'Weak Signal',
    badge: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  },
  strong: {
    icon: <AlertCircle className="h-4 w-4 text-[#ff1053]" />,
    label: 'Strong Correlated',
    badge: 'border-[#ff1053]/30 bg-[#ff1053]/15 text-[#ff1053]',
  },
  confirmed: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    label: 'Confirmed Fact',
    badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  },
};

export interface EvidenceSectionProps {
  evidence: Evidence[];
  isLoading?: boolean;
}

export function EvidenceSection({ evidence, isLoading }: EvidenceSectionProps) {
  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="text-white uppercase">Telemetry &amp; Code Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evidence.length === 0) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white uppercase">
            <Search className="h-5 w-5 text-[#ff1053]" />
            <span>Correlated Evidence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ff1053] mb-3">
              <Search className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-white">
              No Evidence Collected
            </p>
            <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
              Correlated evidence will populate as the agent searches logs and inspects code diffs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#ff1053]" />
          <CardTitle className="text-white uppercase font-bold tracking-wider">Correlated Evidence</CardTitle>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
          {evidence.length} items
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {evidence.map((item) => {
            const config = strengthConfig[item.strength] || strengthConfig.strong;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all hover:border-[#ff1053]/40"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 shrink-0">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <h4 className="font-heading font-bold text-sm sm:text-base text-white uppercase">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${config.badge}`}>
                          {config.label}
                        </span>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {item.type}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-3 font-normal">
                      {item.description}
                    </p>

                    {item.sourceFile && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 font-mono text-[11px] text-white border border-white/10">
                        <span>{item.sourceFile}</span>
                        {item.lineNumber && <span className="text-[#ff1053] font-bold">:{item.lineNumber}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

