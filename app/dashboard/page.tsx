import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LoadDemoButton } from '@/components/dashboard/load-demo-button';
import { StatCard } from '@/components/dashboard/stat-card';
import { IncidentList } from '@/components/dashboard/incident-list';
import { Button } from '@/components/ui/button';
import { mapIncidentSummary } from '@/lib/mappers';
import { AlertCircle, Zap, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  // Fetch all incidents with their investigations
  const incidents = await prisma.incident.findMany({
    include: {
      investigation: {
        select: {
          id: true,
          status: true,
          confidence: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate statistics
  const totalIncidents = incidents.length;
  const activeInvestigations = incidents.filter(
    (i) => i.investigation?.status === 'IN_PROGRESS'
  ).length;
  const highSeverity = incidents.filter(
    (i) => i.severity === 'HIGH' || i.severity === 'CRITICAL'
  ).length;
  const uiIncidents = incidents.map(mapIncidentSummary);

  // Calculate average confidence (only for completed investigations)
  const completedInvestigations = incidents.filter(
    (i) => i.investigation?.confidence !== null
  );
  const avgConfidence =
    completedInvestigations.length > 0
      ? Math.round(
          completedInvestigations.reduce(
            (sum, i) => sum + (i.investigation?.confidence || 0),
            0
          ) / completedInvestigations.length
        )
      : 0;

  const stats = {
    totalIncidents,
    activeInvestigations,
    highSeverity,
    avgConfidence,
  };

  return (
    <div className="text-slate-900 dark:text-slate-100 flex flex-col w-full flex-1">
      <main className="mx-auto max-w-7xl px-4 pt-24 sm:pt-28 pb-12 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff1053]">
              COMMAND CENTER
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Incident Dashboard
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Real-time telemetry and root cause investigations
          </p>
        </div>

        {/* Statistics Bento Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            label="Total Incidents"
            value={stats.totalIncidents}
            icon={<ShieldAlert className="h-5 w-5" />}
            description="Tracked in repository"
            colorScheme="rose"
          />
          <StatCard
            label="Active Investigations"
            value={stats.activeInvestigations}
            icon={<Zap className="h-5 w-5" />}
            description="Autonomous agent running"
            colorScheme="amber"
          />
          <StatCard
            label="High &amp; Critical"
            value={stats.highSeverity}
            icon={<AlertCircle className="h-5 w-5" />}
            description="Require urgent attention"
            colorScheme="rose"
          />
          <StatCard
            label="Avg AI Confidence"
            value={`${stats.avgConfidence}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            description="Root cause accuracy"
            colorScheme="emerald"
          />
        </div>

        {/* Incidents Section */}
        <div className="mb-8">
          <IncidentList incidents={uiIncidents} isLoading={false} />
        </div>

        {/* Demo Scenario Feature Callout */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0307] via-black to-[#14050c] p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff1053]/10 text-[#ff1053] text-xs font-bold uppercase tracking-wider border border-[#ff1053]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INSTANT SIMULATION</span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Simulate a live production outage
              </h3>
              <p className="text-sm text-white/70 leading-relaxed font-normal">
                Want to test how AgentSherlock correlates logs, Git history, and multi-source code diffs? Click below to seed a realistic Postgres pool starvation incident.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <LoadDemoButton variant="gradient" size="lg" className="uppercase tracking-wider" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

