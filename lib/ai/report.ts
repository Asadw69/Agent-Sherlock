import { prisma } from '@/lib/prisma';
import { buildIncidentReport } from './report-builder';

export class InvestigationNotCompleteError extends Error {
  constructor(message = 'The investigation must complete before a report can be generated.') {
    super(message);
    this.name = 'InvestigationNotCompleteError';
  }
}

/**
 * Generates the incident report from data already stored in the database.
 * Deliberately does not call Claude - the report is a structured
 * presentation of the investigation's own results (root cause, evidence,
 * timeline, hypotheses, suspicious commits, recommended fix), all of which
 * were already generated and validated during investigation/fix
 * generation. Calling the model again to "re-summarize" data we already
 * have would be wasted API usage.
 */
export async function generateIncidentReport(incidentId: string) {
  const investigation = await prisma.investigation.findUnique({
    where: { incidentId },
    include: {
      incident: true,
      evidence: true,
      timelineEvents: { orderBy: { timestamp: 'asc' } },
      hypotheses: true,
      suspiciousCommits: true,
      recommendedFix: true,
    },
  });

  if (!investigation) throw new InvestigationNotCompleteError('No investigation exists for this incident yet.');
  if (investigation.status !== 'COMPLETED') throw new InvestigationNotCompleteError();

  const built = buildIncidentReport({
    incident: investigation.incident,
    investigation: {
      rootCause: investigation.rootCause,
      explanation: investigation.explanation,
      confidence: investigation.confidence,
      summary: investigation.summary,
      affectedComponents: investigation.affectedComponents,
      startedAt: investigation.startedAt,
      completedAt: investigation.completedAt,
    },
    evidence: investigation.evidence,
    timeline: investigation.timelineEvents,
    hypotheses: investigation.hypotheses,
    suspiciousCommits: investigation.suspiciousCommits,
    recommendedFix: investigation.recommendedFix,
  });

  const report = await prisma.report.upsert({
    where: { investigationId: investigation.id },
    create: { investigationId: investigation.id, summary: built.summary, content: built.content },
    update: { summary: built.summary, content: built.content },
  });

  return report;
}
