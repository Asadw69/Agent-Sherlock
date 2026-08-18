// Pure, dependency-free incident report builder. Deliberately takes plain
// data (not Prisma types) so it can be unit tested without a database, and
// deliberately does NOT call Claude - everything here is already known
// from the completed investigation stored in the database. This keeps
// report generation free (no extra API cost) and fully deterministic.

export interface ReportEvidenceInput {
  title: string;
  description: string;
  strength: string;
  type: string;
  sourceFile?: string | null;
  lineNumber?: number | null;
  commit?: string | null;
}

export interface ReportTimelineInput {
  timestamp: Date;
  title: string;
  description: string;
  eventType: string;
}

export interface ReportHypothesisInput {
  title: string;
  description: string;
  status: string;
  supportingEvidence?: string | null;
  contradictingEvidence?: string | null;
}

export interface ReportSuspiciousCommitInput {
  commitHash: string;
  message: string;
  author?: string | null;
  timestamp?: Date | null;
  relevance: string;
  changedFiles: string[];
}

export interface ReportFixInput {
  immediate: string;
  longTerm: string;
  monitoring: string;
}

export interface ReportInputData {
  incident: {
    title: string;
    description: string;
    severity: string;
    serviceName: string;
    deploymentVersion?: string | null;
    deploymentTimestamp?: Date | null;
    createdAt: Date;
  };
  investigation: {
    rootCause?: string | null;
    explanation?: string | null;
    confidence?: number | null;
    summary?: string | null;
    affectedComponents: string[];
    startedAt: Date;
    completedAt?: Date | null;
  };
  evidence: ReportEvidenceInput[];
  timeline: ReportTimelineInput[];
  hypotheses: ReportHypothesisInput[];
  suspiciousCommits: ReportSuspiciousCommitInput[];
  recommendedFix?: ReportFixInput | null;
}

function fmt(date: Date | null | undefined): string {
  if (!date) return 'unknown';
  return new Date(date).toISOString().replace('T', ' ').replace('Z', ' UTC');
}

export interface BuiltReport {
  summary: string;
  content: string;
}

/**
 * Builds a structured markdown incident report from already-persisted
 * investigation data. Every section is grounded in real fields - if a
 * section has no data, it says so explicitly instead of being fabricated
 * or silently omitted.
 */
export function buildIncidentReport(data: ReportInputData): BuiltReport {
  const { incident, investigation } = data;

  const execSummary = investigation.summary
    ? investigation.summary
    : investigation.rootCause
      ? `Root cause identified: ${investigation.rootCause}.`
      : 'Investigation did not reach a conclusive root cause.';

  const lines: string[] = [];

  lines.push(`# Incident Report: ${incident.title}`);
  lines.push('');
  lines.push(`**Severity:** ${incident.severity}  `);
  lines.push(`**Service:** ${incident.serviceName}  `);
  if (incident.deploymentVersion) lines.push(`**Deployment version:** ${incident.deploymentVersion}  `);
  if (incident.deploymentTimestamp) lines.push(`**Deployment time:** ${fmt(incident.deploymentTimestamp)}  `);
  lines.push(`**Incident reported:** ${fmt(incident.createdAt)}  `);
  lines.push(`**Investigation started:** ${fmt(investigation.startedAt)}  `);
  if (investigation.completedAt) lines.push(`**Investigation completed:** ${fmt(investigation.completedAt)}  `);
  if (investigation.confidence !== null && investigation.confidence !== undefined) {
    lines.push(`**AI confidence score:** ${investigation.confidence}% (an AI-generated confidence estimate, not a calibrated probability)  `);
  }
  lines.push('');

  lines.push('## 1. Executive Summary');
  lines.push('');
  lines.push(execSummary);
  lines.push('');

  lines.push('## 2. Impact');
  lines.push('');
  lines.push(incident.description);
  if (investigation.affectedComponents.length > 0) {
    lines.push('');
    lines.push(`**Affected components:** ${investigation.affectedComponents.join(', ')}`);
  }
  lines.push('');

  lines.push('## 3. Timeline');
  lines.push('');
  if (data.timeline.length === 0) {
    lines.push('_No timeline events were established from the available evidence._');
  } else {
    for (const t of data.timeline) {
      lines.push(`- **${fmt(t.timestamp)}** [${t.eventType}] ${t.title} — ${t.description}`);
    }
  }
  lines.push('');

  lines.push('## 4. Root Cause');
  lines.push('');
  if (investigation.rootCause) {
    lines.push(`**${investigation.rootCause}**`);
    if (investigation.explanation) {
      lines.push('');
      lines.push(investigation.explanation);
    }
  } else {
    lines.push('_No root cause was determined._');
  }
  lines.push('');

  lines.push('## 5. Evidence');
  lines.push('');
  if (data.evidence.length === 0) {
    lines.push('_No evidence was recorded._');
  } else {
    for (const e of data.evidence) {
      const loc = e.sourceFile ? ` (\`${e.sourceFile}${e.lineNumber ? `:${e.lineNumber}` : ''}\`)` : '';
      const commit = e.commit ? ` [commit \`${e.commit.slice(0, 10)}\`]` : '';
      lines.push(`- **[${e.strength}]** ${e.title}${loc}${commit} — ${e.description}`);
    }
  }
  lines.push('');

  lines.push('## 6. Contributing Factors');
  lines.push('');
  if (data.hypotheses.length === 0 && data.suspiciousCommits.length === 0) {
    lines.push('_No additional hypotheses or suspicious commits were recorded._');
  } else {
    if (data.hypotheses.length > 0) {
      lines.push('**Hypotheses considered:**');
      lines.push('');
      for (const h of data.hypotheses) {
        lines.push(`- **[${h.status}]** ${h.title} — ${h.description}`);
      }
      lines.push('');
    }
    if (data.suspiciousCommits.length > 0) {
      lines.push('**Suspicious commits:**');
      lines.push('');
      for (const c of data.suspiciousCommits) {
        lines.push(`- \`${c.commitHash.slice(0, 10)}\` "${c.message}"${c.author ? ` by ${c.author}` : ''}${c.timestamp ? ` at ${fmt(c.timestamp)}` : ''} — ${c.relevance}`);
        if (c.changedFiles.length > 0) lines.push(`  - Changed files: ${c.changedFiles.join(', ')}`);
      }
    }
  }
  lines.push('');

  lines.push('## 7. Recommended Fix');
  lines.push('');
  if (data.recommendedFix) {
    lines.push(`**Immediate action:** ${data.recommendedFix.immediate}`);
    lines.push('');
    lines.push(`**Long-term fix:** ${data.recommendedFix.longTerm}`);
  } else {
    lines.push('_No recommended fix has been generated yet._');
  }
  lines.push('');

  lines.push('## 8. Preventative Actions');
  lines.push('');
  lines.push(
    data.recommendedFix
      ? data.recommendedFix.monitoring
      : '_No monitoring/prevention recommendations have been generated yet._'
  );
  lines.push('');

  return {
    summary: execSummary,
    content: lines.join('\n'),
  };
}
