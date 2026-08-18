// Provider-agnostic pieces of the investigation agent: shared between the
// Claude implementation (lib/ai/agent.ts) and the Gemini implementation
// (lib/ai/providers/gemini-agent.ts) so persistence/logging behavior can
// never drift between the two backends.

import { prisma } from '@/lib/prisma';
import { InvestigationContext } from './context';
import { InvestigationResult } from './schema';

export const PHASE_BY_TOOL: Record<string, 'LOGS' | 'CODE' | 'GIT'> = {
  search_logs: 'LOGS',
  read_log_section: 'LOGS',
  list_repository_files: 'CODE',
  search_code: 'CODE',
  read_source_file: 'CODE',
  get_git_log: 'GIT',
  get_git_diff: 'GIT',
  get_git_show: 'GIT',
  find_recent_changes: 'GIT',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function summarizeToolCall(name: string, input: any, result: any): string {
  switch (name) {
    case 'search_logs':
      return `Searched logs for "${input.query}" — ${result?.matches?.length ?? 0} match(es) found${input.file ? ` in ${input.file}` : ''}.`;
    case 'read_log_section':
      return `Read ${input.file} lines ${input.start_line}-${input.end_line}.`;
    case 'list_repository_files':
      return `Listed repository files (${result?.files?.length ?? 0} files).`;
    case 'search_code':
      return `Searched repository code for "${input.query}" — ${result?.matches?.length ?? 0} match(es) found.`;
    case 'read_source_file':
      return `Inspected source file ${input.path}${input.start_line ? ` (lines ${input.start_line}-${input.end_line ?? ''})` : ''}.`;
    case 'get_git_log':
      return `Reviewed commit history (${result?.commits?.length ?? 0} commits).`;
    case 'get_git_diff':
      return `Inspected diff for commit ${String(input.commit).slice(0, 10)}.`;
    case 'get_git_show':
      return `Inspected commit ${String(input.commit).slice(0, 10)}.`;
    case 'find_recent_changes':
      return `Correlated deployment time with nearby commits (${result?.commits?.length ?? 0} found).`;
    default:
      return `Called ${name}.`;
  }
}

export async function logEvent(
  investigationId: string,
  phase: 'UNDERSTAND' | 'LOGS' | 'TIMELINE' | 'CODE' | 'GIT' | 'HYPOTHESES' | 'CONCLUSION',
  activity: string,
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' = 'COMPLETED'
) {
  await prisma.investigationEvent.create({
    data: { investigationId, phase, activity, status },
  });
}

export const SYSTEM_PROMPT = `You are the IncidentAI investigation agent, an autonomous SRE assistant that determines the root cause of a production incident.

You have tools to search and read the incident's uploaded log files, browse and search its source repository, and inspect its git history. You do NOT have the incident's conclusion in advance — you must discover it from evidence.

Investigation process (use it as a guide, adapt as needed):
1. Understand the incident: read the description, severity, service, and deployment info you were given.
2. Search logs for errors, exceptions, timeouts, and unusual patterns. Read surrounding context where useful.
3. Search the repository for code related to what the logs show, and read the relevant sections.
4. Inspect git history — especially find_recent_changes to correlate the deployment timestamp with nearby commits — and look at diffs of anything suspicious.
5. Form multiple hypotheses when the incident isn't trivially obvious, and gather evidence for and against each.
6. Determine the most likely root cause and assign a confidence score.

Rules:
- Every conclusion must be backed by evidence you actually retrieved via tools. Never invent log lines, commits, timestamps, or file contents you did not observe.
- Do not fabricate timestamps for the timeline — only include timeline events whose time you actually saw in a log line, commit, or the incident's deployment info.
- Be efficient: use search tools before reading large sections, and don't call the same tool with the same arguments twice. You have a bounded number of tool calls.
- Do not reveal your private step-by-step reasoning. Just take actions via tools.
- When you are done investigating, call submit_investigation_result exactly once with your full structured conclusion. Do not call it before you have gathered real evidence from logs, code, and git.
- If logs or a repository are unavailable, say so plainly in your result rather than guessing.`;

interface IncidentInfo {
  title: string;
  description: string;
  severity: string;
  serviceName: string;
  deploymentVersion: string | null;
  deploymentTimestamp: Date | null;
}

/** The initial user-turn text both providers send to kick off an investigation. */
export function buildInvestigationPrompt(incident: IncidentInfo, ctx: InvestigationContext): string {
  return [
    `Incident title: ${incident.title}`,
    `Description: ${incident.description}`,
    `Severity: ${incident.severity}`,
    `Service: ${incident.serviceName}`,
    incident.deploymentVersion ? `Deployment version: ${incident.deploymentVersion}` : null,
    incident.deploymentTimestamp ? `Deployment timestamp: ${incident.deploymentTimestamp.toISOString()}` : null,
    `Uploaded log files: ${ctx.logFiles.length > 0 ? ctx.logFiles.map((f) => f.filename).join(', ') : 'none'}`,
    `Repository uploaded: ${ctx.repoPath ? 'yes' : 'no'}${ctx.repoPath && !ctx.hasGit ? ' (no git history available)' : ''}`,
    '',
    'Investigate this incident using your tools and submit a structured result via submit_investigation_result when done.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Persists a validated investigation result. Shared by every provider so the DB write path never drifts. */
export async function persistResult(investigationId: string, incidentId: string, result: InvestigationResult): Promise<void> {
  await prisma.$transaction([
    prisma.investigation.update({
      where: { id: investigationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        rootCause: result.rootCause,
        explanation: result.rootCauseExplanation,
        confidence: result.confidence,
        summary: result.summary,
        affectedComponents: result.affectedComponents,
      },
    }),
    prisma.evidence.createMany({
      data: result.evidence.map((e) => ({
        investigationId,
        type: e.sourceType,
        title: e.finding,
        description: e.description,
        strength: e.strength,
        sourceFile: e.file ?? null,
        lineNumber: e.lineStart ?? null,
        lineEnd: e.lineEnd ?? null,
        commit: e.commit ?? null,
        eventTimestamp: parseDate(e.timestamp),
      })),
    }),
    prisma.timelineEvent.createMany({
      data: result.timeline
        .map((t) => ({ ...t, parsed: parseDate(t.timestamp) }))
        .filter((t) => t.parsed !== null)
        .map((t) => ({
          investigationId,
          timestamp: t.parsed as Date,
          title: t.title,
          description: t.description,
          eventType: t.type,
        })),
    }),
    prisma.hypothesis.createMany({
      data: result.hypotheses.map((h) => ({
        investigationId,
        title: h.title,
        description: h.description,
        status: h.status,
        supportingEvidence: h.supportingEvidence ?? null,
        contradictingEvidence: h.contradictingEvidence ?? null,
      })),
    }),
    prisma.suspiciousCommit.createMany({
      data: result.suspiciousCommits.map((c) => ({
        investigationId,
        commitHash: c.commitHash,
        message: c.message,
        author: c.author ?? null,
        timestamp: parseDate(c.timestamp),
        relevance: c.relevance,
        changedFiles: c.changedFiles,
      })),
    }),
  ]);

  await prisma.incident.update({ where: { id: incidentId }, data: { status: 'COMPLETED' } });
}

export async function markInvestigationFailed(incidentId: string, investigationId: string, message: string): Promise<void> {
  console.error(`Investigation ${investigationId} failed:`, message);
  await logEvent(investigationId, 'CONCLUSION', `Investigation failed: ${message}`, 'FAILED').catch(() => {});
  await prisma.investigation
    .update({
      where: { id: investigationId },
      data: { status: 'FAILED', completedAt: new Date(), errorMessage: message.slice(0, 1000) },
    })
    .catch(() => {});
  await prisma.incident.update({ where: { id: incidentId }, data: { status: 'FAILED' } }).catch(() => {});
}
