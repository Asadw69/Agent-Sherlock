'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Flame, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';

export interface RootCauseCardProps {
  rootCause?: string;
  confidence?: number;
  explanation?: string;
  isLoading?: boolean;
}

export function RootCauseCard({
  rootCause,
  confidence,
  explanation,
  isLoading,
}: RootCauseCardProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-elev-1">
        <CardHeader>
          <CardTitle>Root Cause Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-7 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-5 rounded-xl bg-slate-100 dark:bg-slate-800 w-2/3" />
            <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rootCause) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-elev-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-400" />
            <span>Root Cause Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <HelpCircle className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-slate-800 dark:text-slate-200">
              Investigation Pending
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Start the investigation agent to correlate telemetry, git history, and pinpoint the primary root cause.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isHighConfidence = (confidence ?? 0) >= 80;

  return (
    <div className="relative rounded-3xl overflow-hidden p-[1px] bg-gradient-to-r from-[#ff1053] via-rose-600 to-[#e6004c] shadow-2xl">
      <div className="rounded-[23px] bg-[#0c0307] backdrop-blur-xl p-6 sm:p-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff1053]/15 text-[#ff1053] border border-[#ff1053]/30 shadow-md">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff1053]">
                Primary Root Cause
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Identified by AI Agent
              </h2>
            </div>
          </div>

          {confidence && (
            <div className="flex items-center gap-3 self-start sm:self-auto bg-black/40 border border-white/10 px-4 py-2 rounded-2xl">
              <div>
                <div className="flex items-center gap-1.5 font-heading text-2xl font-black text-white">
                  <Sparkles className="h-4 w-4 text-[#ff1053]" />
                  <span>{confidence}%</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#ff1053] font-bold">Confidence</p>
              </div>
              <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden ml-1">
                <div 
                  className={`h-full rounded-full ${isHighConfidence ? 'bg-gradient-to-r from-[#ff1053] to-emerald-400' : 'bg-gradient-to-r from-[#ff1053] to-amber-400'}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-[#ff1053]/15 border border-[#ff1053]/30 p-4 sm:p-5">
            <p className="font-heading text-lg sm:text-xl font-bold text-white leading-snug">
              {rootCause}
            </p>
          </div>

          {explanation && (
            <div className="text-sm text-white/70 leading-relaxed font-normal">
              {explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

