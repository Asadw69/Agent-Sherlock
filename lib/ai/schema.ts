import { z } from 'zod';

// Mirrors the Prisma enums in prisma/schema.prisma - kept in sync manually
// since the AI output is validated before ever touching the database.

export const evidenceTypeSchema = z.enum(['LOG', 'CODE', 'GIT', 'DEPLOYMENT', 'METRIC']);
export const evidenceStrengthSchema = z.enum(['WEAK', 'STRONG', 'CONFIRMED']);
export const hypothesisStatusSchema = z.enum(['LIKELY', 'POSSIBLE', 'UNLIKELY']);
export const timelineEventTypeSchema = z.enum(['DEPLOYMENT', 'ERROR', 'METRIC', 'SERVICE', 'INFRASTRUCTURE']);

export const evidenceSchema = z.object({
  finding: z.string().min(1).describe('The concise finding/title, e.g. "Database connection pool exhausted"'),
  description: z.string().min(1).describe('One or two sentences explaining the finding and why it matters.'),
  strength: evidenceStrengthSchema,
  sourceType: evidenceTypeSchema,
  file: z.string().nullable().optional().describe('Log or source file this evidence came from, if any.'),
  lineStart: z.number().int().nullable().optional(),
  lineEnd: z.number().int().nullable().optional(),
  commit: z.string().nullable().optional().describe('Git commit hash this evidence came from, if any.'),
  timestamp: z.string().nullable().optional().describe('ISO-8601 timestamp this evidence refers to, only if actually observed in the data - never invented.'),
});

export const hypothesisSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: hypothesisStatusSchema,
  supportingEvidence: z.string().nullable().optional(),
  contradictingEvidence: z.string().nullable().optional(),
});

export const timelineEventSchema = z.object({
  timestamp: z.string().min(1).describe('ISO-8601 timestamp. Must come from actual evidence (logs, git, deployment info) - never fabricated.'),
  title: z.string().min(1),
  description: z.string().min(1),
  type: timelineEventTypeSchema,
  source: z.string().nullable().optional().describe('Where this timeline fact came from (e.g. a log file or commit hash).'),
});

export const suspiciousCommitSchema = z.object({
  commitHash: z.string().min(4),
  message: z.string().min(1),
  author: z.string().nullable().optional(),
  timestamp: z.string().nullable().optional(),
  relevance: z.string().min(1).describe('Why this commit is suspicious in relation to the incident.'),
  changedFiles: z.array(z.string()).default([]),
});

export const investigationResultSchema = z.object({
  summary: z.string().min(1).describe('2-4 sentence investigation summary for a human on-call engineer.'),
  rootCause: z.string().min(1).describe('Concise root cause statement.'),
  rootCauseExplanation: z.string().min(1).describe('Detailed explanation of the root cause and how the evidence supports it.'),
  confidence: z.number().int().min(0).max(100).describe('AI confidence score 0-100, not a calibrated probability.'),
  confidenceExplanation: z.string().min(1).describe('Why the confidence score is high or low, referencing evidence gaps or strengths.'),
  affectedComponents: z.array(z.string()).default([]),
  hypotheses: z.array(hypothesisSchema).default([]),
  evidence: z.array(evidenceSchema).min(1).describe('Every evidence item that supports the investigation, drawn only from tool results actually observed.'),
  timeline: z.array(timelineEventSchema).default([]),
  suspiciousCommits: z.array(suspiciousCommitSchema).default([]),
  investigationSummary: z.string().min(1).describe('A short narrative of the investigation process itself (what was checked, in what order) - not hidden reasoning, just a factual recap suitable for the activity log.'),
});

export type InvestigationResult = z.infer<typeof investigationResultSchema>;

// Anthropic tool schema Claude must call to submit its final structured
// result. Hand-written to mirror investigationResultSchema above since we
// validate the actual tool_use input with zod before trusting it.
export const SUBMIT_RESULT_TOOL = {
  name: 'submit_investigation_result',
  description:
    'Submit the final, structured investigation result. Call this exactly once, as the last step, after you have gathered enough evidence via the other tools. Do not call this before investigating logs, code, and git history.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      rootCause: { type: 'string' },
      rootCauseExplanation: { type: 'string' },
      confidence: {
        type: 'number',
        description:
          'Integer from 0 to 100 representing your confidence in the root cause, where 100 means fully confident and 0 means no confidence. This is a percentage on a 0-100 scale (e.g. 85), never a 0-1 fraction (do not submit 0.85 or 1).',
      },
      confidenceExplanation: { type: 'string' },
      affectedComponents: { type: 'array', items: { type: 'string' } },
      hypotheses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['LIKELY', 'POSSIBLE', 'UNLIKELY'] },
            supportingEvidence: { type: 'string' },
            contradictingEvidence: { type: 'string' },
          },
          required: ['title', 'description', 'status'],
        },
      },
      evidence: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            finding: { type: 'string' },
            description: { type: 'string' },
            strength: { type: 'string', enum: ['WEAK', 'STRONG', 'CONFIRMED'] },
            sourceType: { type: 'string', enum: ['LOG', 'CODE', 'GIT', 'DEPLOYMENT', 'METRIC'] },
            file: { type: 'string' },
            lineStart: { type: 'number' },
            lineEnd: { type: 'number' },
            commit: { type: 'string' },
            timestamp: { type: 'string' },
          },
          required: ['finding', 'description', 'strength', 'sourceType'],
        },
      },
      timeline: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['DEPLOYMENT', 'ERROR', 'METRIC', 'SERVICE', 'INFRASTRUCTURE'] },
            source: { type: 'string' },
          },
          required: ['timestamp', 'title', 'description', 'type'],
        },
      },
      suspiciousCommits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            commitHash: { type: 'string' },
            message: { type: 'string' },
            author: { type: 'string' },
            timestamp: { type: 'string' },
            relevance: { type: 'string' },
            changedFiles: { type: 'array', items: { type: 'string' } },
          },
          required: ['commitHash', 'message', 'relevance'],
        },
      },
      investigationSummary: { type: 'string' },
    },
    required: [
      'summary',
      'rootCause',
      'rootCauseExplanation',
      'confidence',
      'confidenceExplanation',
      'evidence',
      'investigationSummary',
    ],
  },
} as const;
