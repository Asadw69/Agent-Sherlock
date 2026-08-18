import Anthropic from '@anthropic-ai/sdk';
import { recommendedFixSchema, RECOMMENDED_FIX_TOOL, RecommendedFixResult } from './fix-schema';
import { InvestigationNotReadyError, FIX_SYSTEM_PROMPT, loadInvestigationForFix, buildFixPrompt, persistFix } from './fix-shared';
import { getAiProvider } from './provider';

export { InvestigationNotReadyError };

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 1500;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  return new Anthropic({ apiKey });
}

/**
 * Generates a recommended fix from an already-completed investigation's
 * real, persisted results, using whichever provider AI_PROVIDER selects
 * (default: Anthropic/Claude). Does NOT re-run the investigation agent or
 * call any investigation tools - it makes exactly one bounded model call
 * over data that is already in the database.
 */
export async function generateRecommendedFix(incidentId: string): Promise<RecommendedFixResult> {
  if (getAiProvider() === 'gemini') {
    const { generateRecommendedFixGemini } = await import('./providers/gemini-fix');
    return generateRecommendedFixGemini(incidentId);
  }
  return generateRecommendedFixClaude(incidentId);
}

async function generateRecommendedFixClaude(incidentId: string): Promise<RecommendedFixResult> {
  const investigation = await loadInvestigationForFix(incidentId);
  const client = getClient();
  const userMessage = buildFixPrompt(investigation);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: FIX_SYSTEM_PROMPT,
    tools: [RECOMMENDED_FIX_TOOL] as unknown as Anthropic.Tool[],
    tool_choice: { type: 'tool', name: 'submit_recommended_fix' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'submit_recommended_fix'
  );

  if (!toolUse) {
    throw new Error('The model did not return a recommended fix.');
  }

  const parsed = recommendedFixSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`Recommended fix response did not match the expected format: ${parsed.error.message}`);
  }

  await persistFix(investigation.id, parsed.data);
  return parsed.data;
}
