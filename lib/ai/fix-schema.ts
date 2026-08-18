import { z } from 'zod';

/**
 * Structured output schema for recommended-fix generation. Kept separate
 * from lib/ai/schema.ts (the investigation result schema) since this is a
 * distinct, smaller generation step that runs after an investigation
 * completes - not a second investigation agent.
 */
export const recommendedFixSchema = z.object({
  immediateAction: z.string().min(1).describe('What an on-call engineer should do right now to mitigate the incident.'),
  longTermFix: z.string().min(1).describe('The code/design change that should prevent recurrence.'),
  monitoringRecommendations: z.string().min(1).describe('Alerts, metrics, tests, or safeguards to add.'),
  reasoningSummary: z.string().min(1).describe('1-3 sentences tying the fix back to the actual investigation evidence. No hidden chain-of-thought - just the concise justification.'),
  relatedEvidence: z.array(z.string()).default([]).describe('Short references to the specific evidence/commits this fix is based on.'),
});

export type RecommendedFixResult = z.infer<typeof recommendedFixSchema>;

export const RECOMMENDED_FIX_TOOL = {
  name: 'submit_recommended_fix',
  description: 'Submit the structured recommended fix for this incident, based only on the investigation evidence provided.',
  input_schema: {
    type: 'object',
    properties: {
      immediateAction: { type: 'string' },
      longTermFix: { type: 'string' },
      monitoringRecommendations: { type: 'string' },
      reasoningSummary: { type: 'string' },
      relatedEvidence: { type: 'array', items: { type: 'string' } },
    },
    required: ['immediateAction', 'longTermFix', 'monitoringRecommendations', 'reasoningSummary'],
  },
} as const;
