'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecommendedFix } from '@/lib/types';
import { Zap, Wrench, Activity, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export interface RecommendedFixProps {
  fix?: RecommendedFix;
  isLoading?: boolean;
}

export function RecommendedFixSection({ fix, isLoading }: RecommendedFixProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-elev-1">
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fix) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-elev-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-slate-400" />
            <span>Recommended Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <Wrench className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-slate-800 dark:text-slate-200">
              No Fix Available Yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Recommendations will be synthesized automatically once root cause confidence is established.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-white uppercase font-bold tracking-wider">Remediation Plan</CardTitle>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            3-Tier Strategy
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Immediate */}
        <div className="rounded-2xl border border-[#ff1053]/30 bg-[#ff1053]/15 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ff1053]/30 text-[#ff1053]">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <h4 className="font-heading font-extrabold text-sm text-white uppercase tracking-wider">
              1. Immediate Mitigation
            </h4>
          </div>
          <p className="text-sm text-white/90 pl-8 leading-relaxed font-normal">
            {fix.immediate}
          </p>
        </div>

        {/* Long-term */}
        <div className="rounded-2xl border border-white/15 bg-black/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white">
              <Wrench className="h-3.5 w-3.5 text-[#ff1053]" />
            </div>
            <h4 className="font-heading font-extrabold text-sm text-white uppercase tracking-wider">
              2. Permanent Code Fix
            </h4>
          </div>
          <p className="text-sm text-white/90 pl-8 leading-relaxed font-normal">
            {fix.longTerm}
          </p>
        </div>

        {/* Monitoring */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/30 text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <h4 className="font-heading font-extrabold text-sm text-emerald-300 uppercase tracking-wider">
              3. Monitoring &amp; Alerting
            </h4>
          </div>
          <p className="text-sm text-white/90 pl-8 leading-relaxed font-normal">
            {fix.monitoring}
          </p>
        </div>

        {/* Reasoning Summary & Evidence Tags */}
        {(fix.reasoningSummary || (fix.relatedEvidence && fix.relatedEvidence.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/60">
            {fix.reasoningSummary && (
              <p className="leading-relaxed mb-2"><strong className="text-white">Rationale:</strong> {fix.reasoningSummary}</p>
            )}
            {fix.relatedEvidence && fix.relatedEvidence.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Based on:</span>
                {fix.relatedEvidence.map((ref, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px]">
                    {ref}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

