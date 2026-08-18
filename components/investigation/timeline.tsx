'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineEvent } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import {
  Server,
  AlertTriangle,
  TrendingUp,
  Cloud,
  Zap,
  Clock,
  Layers
} from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; badge: string }> = {
  deployment: { 
    icon: <Cloud className="h-4 w-4" />, 
    color: 'bg-[#ff1053]/15 text-[#ff1053] border-[#ff1053]/30',
    badge: 'bg-[#ff1053]/20 text-[#ff1053] border border-[#ff1053]/30'
  },
  error: { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'bg-[#ff1053]/15 text-[#ff1053] border-[#ff1053]/30',
    badge: 'bg-[#ff1053]/20 text-[#ff1053] border border-[#ff1053]/30'
  },
  metric: { 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
  },
  service: { 
    icon: <Server className="h-4 w-4" />, 
    color: 'bg-[#ff1053]/15 text-[#ff1053] border-[#ff1053]/30',
    badge: 'bg-[#ff1053]/20 text-[#ff1053] border border-[#ff1053]/30'
  },
  infrastructure: { 
    icon: <Zap className="h-4 w-4" />, 
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
  },
};

export interface TimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export function Timeline({ events, isLoading }: TimelineProps) {
  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-[#0c0307]">
        <CardHeader>
          <CardTitle className="text-white uppercase">Chronological Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/10" />
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
            <Clock className="h-5 w-5 text-[#ff1053]" />
            <span>Chronological Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ff1053] mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-white">
              No Timeline Events
            </p>
            <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
              Timeline will populate with correlated errors, deployments, and metric anomalies.
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
          <Layers className="h-5 w-5 text-[#ff1053]" />
          <CardTitle className="text-white uppercase font-bold tracking-wider">Chronological Timeline</CardTitle>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
          {events.length} events
        </span>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-white/10">
          {events.map((event) => {
            const config = typeConfig[event.type] || typeConfig.error;
            return (
              <div key={event.id} className="relative group">
                {/* Node */}
                <div className={`absolute -left-6 top-1 flex h-6 w-6 items-center justify-center rounded-full border ${config.color} bg-[#080104]`}>
                  {config.icon}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-xl backdrop-blur-md transition-all hover:border-[#ff1053]/40">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <h4 className="font-heading font-bold text-sm text-white uppercase">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${config.badge}`}>
                        {event.type}
                      </span>
                      <span className="text-xs font-mono text-white/40">
                        {formatTime(new Date(event.timestamp))}
                      </span>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

