import { GoogleGenAI, FunctionCallingConfigMode, type Part } from '@google/genai';
import { recommendedFixSchema, RECOMMENDED_FIX_TOOL, RecommendedFixResult } from '../fix-schema';
import { FIX_SYSTEM_PROMPT, loadInvestigationForFix, buildFixPrompt, persistFix } from '../fix-shared';
import { toGeminiFunctionDeclaration } from './schema-convert';
import { withGeminiRetry } from './gemini-retry';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const MAX_OUTPUT_TOKENS = 1500;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return new GoogleGenAI({ apiKey });
}

const FUNCTION_DECLARATION = toGeminiFunctionDeclaration(RECOMMENDED_FIX_TOOL);

/**
 * Gemini-backed equivalent of generateRecommendedFixClaude() in
 * lib/ai/fix.ts. Same single-call-over-stored-evidence design, forced to
 * call the one function via toolConfig. Only used when AI_PROVIDER=gemini.
 */
export async function generateRecommendedFixGemini(incidentId: string): Promise<RecommendedFixResult> {
  const investigation = await loadInvestigationForFix(incidentId);
  const client = getClient();
  const userMessage = buildFixPrompt(investigation);

  const response = await withGeminiRetry(
    () =>
      client.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: FIX_SYSTEM_PROMPT,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          tools: [{ functionDeclarations: [FUNCTION_DECLARATION] }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['submit_recommended_fix'],
            },
          },
        },
      }),
    'Recommended fix generation'
  );

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const call = parts.find((p): p is Part & { functionCall: NonNullable<Part['functionCall']> } => Boolean(p.functionCall))?.functionCall;

  if (!call) {
    throw new Error('The model did not return a recommended fix.');
  }

  const parsed = recommendedFixSchema.safeParse(call.args ?? {});
  if (!parsed.success) {
    throw new Error(`Recommended fix response did not match the expected format: ${parsed.error.message}`);
  }

  await persistFix(investigation.id, parsed.data);
  return parsed.data;
}
