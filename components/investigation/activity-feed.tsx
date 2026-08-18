'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestigationEvent } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle, Clock, Activity, Sparkles } from 'lucide-react';

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-white/40" />,
  in_progress: <Loader2 className="h-4 w-4 text-[#ff1053] animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  failed: <AlertCircle className="h-4 w-4 text-[#ff1053]" />,
};

const phaseLabels: Record<string, string> = {
  understand: 'Incident Understanding',
  logs: 'Telemetry & Log Parsing',
  timeline: 'Chronological Timeline',
  code: 'Source Code Inspection',
  git: 'Git Diff & Commits',
  hypotheses: 'Hypothesis Verification',
  conclusion: 'Root Cause Synthesis',
};

export interface ActivityFeedProps {
  events: InvestigationEvent[];
  isLoading?: boolean;
}

export function ActivityFeed({ events, isLoading }: ActivityFeedProps) {
  if (isLoading || (events.length === 0 && isLoading)) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="text-white uppercase">Autonomous Agent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-white/10 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 rounded bg-white/10 w-1/3" />
                  <div className="h-3 rounded bg-white/10 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white uppercase">
            <Activity className="h-5 w-5 text-[#ff1053]" />
            <span>Autonomous Agent Trace</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ff1053] mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-white">
              No Agent Execution Yet
            </p>
            <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
              Launch investigation to see the multi-step reasoning trace in real-time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#ff1053]" />
          <CardTitle className="text-white uppercase font-bold tracking-wider">Autonomous Agent Trace</CardTitle>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ff1053]/15 text-[#ff1053] border border-[#ff1053]/30">
          {events.length} steps
        </span>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
          {events.map((event) => (
            <div key={event.id} className="relative group">
              {/* Dot marker */}
              <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#080104] border border-white/20">
                {statusIcons[event.status]}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 sm:p-4 transition-all hover:border-[#ff1053]/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-heading text-xs font-extrabold uppercase tracking-wider text-white">
                    {phaseLabels[event.phase] || event.phase}
                  </span>
                  <span className="text-[11px] font-mono text-white/40">
                    {formatTime(new Date(event.timestamp))}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                  {event.activity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

