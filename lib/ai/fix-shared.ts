import { prisma } from '@/lib/prisma';
import { RecommendedFixResult } from './fix-schema';

export class InvestigationNotReadyError extends Error {
  constructor(message = 'The investigation must complete successfully before a fix can be generated.') {
    super(message);
    this.name = 'InvestigationNotReadyError';
  }
}

export const FIX_SYSTEM_PROMPT = `You generate a recommended fix for an already-completed incident investigation. You are NOT re-investigating - you only have the investigation's stored conclusions (root cause, evidence, suspicious commits, hypotheses) available to you. Base your fix strictly on that evidence; do not invent details that aren't present in it. Keep every field concise (a few sentences at most) and free of hidden reasoning - just the conclusions. Call submit_recommended_fix exactly once.`;

type InvestigationWithRelations = Awaited<ReturnType<typeof loadInvestigationForFix>>;

export async function loadInvestigationForFix(incidentId: string) {
  const investigation = await prisma.investigation.findUnique({
    where: { incidentId },
    include: { evidence: true, suspiciousCommits: true, hypotheses: true, incident: true },
  });

  if (!investigation) throw new InvestigationNotReadyError('No investigation exists for this incident yet.');
  if (investigation.status !== 'COMPLETED' || !investigation.rootCause) {
    throw new InvestigationNotReadyError();
  }

  return investigation;
}

export function buildFixPrompt(investigation: InvestigationWithRelations): string {
  const evidenceLines = investigation.evidence
    .map((e) => `- [${e.strength}/${e.type}] ${e.title}: ${e.description}${e.sourceFile ? ` (${e.sourceFile}${e.lineNumber ? `:${e.lineNumber}` : ''})` : ''}${e.commit ? ` [commit ${e.commit.slice(0, 10)}]` : ''}`)
    .join('\n') || 'none recorded';

  const commitLines = investigation.suspiciousCommits
    .map((c) => `- ${c.commitHash.slice(0, 10)} "${c.message}" - ${c.relevance}`)
    .join('\n') || 'none recorded';

  const hypothesisLines = investigation.hypotheses
    .map((h) => `- [${h.status}] ${h.title}: ${h.description}`)
    .join('\n') || 'none recorded';

  return [
    `Incident: ${investigation.incident.title} (${investigation.incident.severity}, service: ${investigation.incident.serviceName})`,
    `Root cause: ${investigation.rootCause}`,
    `Explanation: ${investigation.explanation ?? 'n/a'}`,
    `Confidence: ${investigation.confidence ?? 'n/a'}%`,
    `Affected components: ${investigation.affectedComponents.join(', ') || 'none recorded'}`,
    '',
    'Evidence:',
    evidenceLines,
    '',
    'Suspicious commits:',
    commitLines,
    '',
    'Hypotheses considered:',
    hypothesisLines,
    '',
    'Generate a recommended fix (immediate action, long-term fix, monitoring/prevention) grounded strictly in the above. Call submit_recommended_fix.',
  ].join('\n');
}

export async function persistFix(investigationId: string, data: RecommendedFixResult): Promise<void> {
  await prisma.recommendedFix.upsert({
    where: { investigationId },
    create: {
      investigationId,
      immediate: data.immediateAction,
      longTerm: data.longTermFix,
      monitoring: data.monitoringRecommendations,
      reasoningSummary: data.reasoningSummary,
      relatedEvidence: data.relatedEvidence,
    },
    update: {
      immediate: data.immediateAction,
      longTerm: data.longTermFix,
      monitoring: data.monitoringRecommendations,
      reasoningSummary: data.reasoningSummary,
      relatedEvidence: data.relatedEvidence,
    },
  });
}
