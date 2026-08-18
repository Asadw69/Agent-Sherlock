import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RootCauseCard } from '@/components/investigation/root-cause-card';
import { ActivityFeed } from '@/components/investigation/activity-feed';
import { Timeline } from '@/components/investigation/timeline';
import { EvidenceSection } from '@/components/investigation/evidence-section';
import { RecommendedFixSection } from '@/components/investigation/recommended-fix';
import { InvestigateButton } from '@/components/investigation/investigate-button';
import { CodeInvestigationSection } from '@/components/investigation/code-investigation';
import { GenerateFixButton } from '@/components/investigation/generate-fix-button';
import { ReportSection } from '@/components/investigation/report-section';
import { getSeverityColor, getStatusColor, formatDate } from '@/lib/utils';
import { mapInvestigationEvent, mapEvidence, mapTimelineEvent } from '@/lib/mappers';
import { ArrowLeft, Server, Clock, Calendar, ShieldAlert, Sparkles, FileText } from 'lucide-react';

export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const { incidentId } = await params;

  // Fetch incident with investigation data
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      investigation: {
        include: {
          events: {
            orderBy: { timestamp: 'asc' },
          },
          evidence: true,
          timelineEvents: {
            orderBy: { timestamp: 'asc' },
          },
          recommendedFix: true,
          hypotheses: true,
          suspiciousCommits: true,
          report: true,
        },
      },
      uploadedFiles: true,
    },
  });

  const investigation = incident?.investigation || null;
  const uiEvents = investigation ? investigation.events.map(mapInvestigationEvent) : [];
  const uiEvidence = investigation ? investigation.evidence.map(mapEvidence) : [];
  const uiTimeline = investigation ? investigation.timelineEvents.map(mapTimelineEvent) : [];
  const buttonStatus = investigation ? (investigation.status.toLowerCase() as 'pending' | 'in_progress' | 'completed' | 'failed') : 'none';
  const isCompleted = investigation?.status === 'COMPLETED';

  if (!incident) {
    return (
      <div className="text-slate-900 dark:text-slate-100 flex flex-col w-full flex-1">
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full border-slate-200/80 dark:border-slate-800/80 shadow-elev-2 text-center p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-xl font-bold">Incident not found</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This incident does not exist or may have been deleted.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block w-full">
              <Button variant="gradient" className="w-full">Return to Dashboard</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-slate-100 flex flex-col w-full flex-1 selection:bg-blue-500/20 selection:text-blue-600">
      <main className="mx-auto max-w-7xl px-4 pt-24 sm:pt-28 pb-12 sm:px-6 lg:px-8 flex-1 w-full space-y-8">
        
        {/* INCIDENT HEADER CARD */}
        <div className="rounded-3xl border border-white/10 bg-[#0c0307] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="secondary" className={getSeverityColor(incident.severity)}>
                  {incident.severity} SEVERITY
                </Badge>
                {investigation && (
                  <Badge className={getStatusColor(investigation.status.toLowerCase())}>
                    {investigation.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              <h1 className="font-heading text-2xl sm:text-4xl font-black text-white tracking-tight uppercase leading-tight">
                {incident.title}
              </h1>

              <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed font-normal max-w-3xl">
                {incident.description}
              </p>

              {/* Metadata chips */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5 font-medium text-white/90 bg-white/10 px-3 py-1 rounded-lg">
                  <Server className="h-3.5 w-3.5 text-[#ff1053]" />
                  Service: <strong className="text-white">{incident.serviceName}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-white/90 bg-white/10 px-3 py-1 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 text-[#ff1053]" />
                  Created: {formatDate(new Date(incident.createdAt))}
                </span>
                {incident.deploymentVersion && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-white/90 bg-white/10 px-3 py-1 rounded-lg font-mono">
                    Version: {incident.deploymentVersion}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
              <InvestigateButton incidentId={incident.id} status={buttonStatus} />
              {isCompleted && (
                <GenerateFixButton incidentId={incident.id} hasExistingFix={!!investigation?.recommendedFix} />
              )}
            </div>
          </div>
        </div>

        {/* HERO ROOT CAUSE & RECOMMENDATION BENTO */}
        <div className="grid grid-cols-1 gap-6">
          <RootCauseCard
            rootCause={investigation?.rootCause ?? undefined}
            confidence={investigation?.confidence ?? undefined}
            explanation={investigation?.explanation ?? undefined}
            isLoading={false}
          />
        </div>

        {/* REMEDIATION SECTION */}
        <div>
          <RecommendedFixSection 
            fix={investigation?.recommendedFix ? {
              id: investigation.recommendedFix.id,
              investigationId: investigation.recommendedFix.investigationId,
              immediate: investigation.recommendedFix.immediate,
              longTerm: investigation.recommendedFix.longTerm,
              monitoring: investigation.recommendedFix.monitoring,
              reasoningSummary: investigation.recommendedFix.reasoningSummary ?? undefined,
              relatedEvidence: investigation.recommendedFix.relatedEvidence,
            } : undefined} 
            isLoading={false} 
          />
        </div>

        {/* AGENT ACTIVITY & TIMELINE BENTO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed events={uiEvents} isLoading={false} />
          <Timeline events={uiTimeline} isLoading={false} />
        </div>

        {/* CODE INVESTIGATION & EVIDENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CodeInvestigationSection
            commits={(investigation?.suspiciousCommits || []).map((c: {
              id: string;
              commitHash: string;
              message: string;
              author: string | null;
              timestamp: Date | null;
              relevance: string;
              changedFiles: string[];
            }) => ({
              id: c.id,
              commitHash: c.commitHash,
              message: c.message,
              author: c.author,
              timestamp: c.timestamp ? formatDate(new Date(c.timestamp)) : null,
              relevance: c.relevance,
              changedFiles: c.changedFiles,
            }))}
            hypotheses={investigation?.hypotheses || []}
          />
          <EvidenceSection evidence={uiEvidence} isLoading={false} />
        </div>

        {/* FULL POSTMORTEM REPORT */}
        <div id="incident-report" className="scroll-mt-12">
          <ReportSection
            incidentId={incident.id}
            incidentTitle={incident.title}
            report={investigation?.report || null}
            investigationCompleted={isCompleted}
          />
        </div>
      </main>
    </div>
  );
}

