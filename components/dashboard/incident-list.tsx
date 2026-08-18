'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Incident, Investigation } from '@/lib/types';
import { getSeverityColor, getStatusColor, formatRelativeTime } from '@/lib/utils';
import { ArrowRight, Server, ShieldAlert, Sparkles, Clock, AlertTriangle } from 'lucide-react';

export interface IncidentListProps {
  incidents: (Incident & { investigation?: Investigation })[];
  isLoading?: boolean;
}

export function IncidentList({ incidents, isLoading }: IncidentListProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80">
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (incidents.length === 0) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-elev-1">
        <CardContent className="py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
            No incidents recorded
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create your first incident or run a demo scenario to see the AI investigator in action.
          </p>
          <Link href="/incidents/new" className="mt-5 inline-block">
            <Button variant="gradient">Create Incident</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-elev-1">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Recent Incidents</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track live and completed investigations
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          {incidents.length} total
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/investigations/${incident.id}`}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#080104]/80 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all duration-200 hover:border-[#ff1053]/50 hover:bg-[#ff1053]/10 hover:-translate-y-0.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-heading font-bold text-base text-white uppercase group-hover:text-[#ff1053] transition-colors">
                    {incident.title}
                  </h3>
                  <Badge variant="secondary" className={getSeverityColor(incident.severity)}>
                    {incident.severity}
                  </Badge>
                  {incident.investigation && (
                    <Badge className={getStatusColor(incident.investigation.status)}>
                      {incident.investigation.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1 font-medium text-white/80 bg-white/10 px-2 py-0.5 rounded-md">
                    <Server className="h-3 w-3 text-[#ff1053]" />
                    {incident.serviceName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(new Date(incident.createdAt))}
                  </span>
                  {incident.deploymentVersion && (
                    <span className="text-white/40 font-mono">
                      • {incident.deploymentVersion}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                {incident.investigation?.confidence ? (
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1.5 text-sm font-black text-white">
                      <Sparkles className="h-3.5 w-3.5 text-[#ff1053]" />
                      <span>{incident.investigation.confidence}%</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-[#ff1053] font-bold">confidence</p>
                  </div>
                ) : null}

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-200 group-hover:bg-[#ff1053] group-hover:shadow-[0_0_15px_rgba(255,16,83,0.5)]">
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

