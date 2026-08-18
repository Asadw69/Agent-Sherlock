import { GoogleGenAI, FunctionCallingConfigMode, type Content, type Part } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { loadInvestigationContext } from '../context';
import { TOOL_DEFINITIONS, executeTool } from '../tools';
import { SUBMIT_RESULT_TOOL, investigationResultSchema, InvestigationResult } from '../schema';
import {
  PHASE_BY_TOOL,
  summarizeToolCall,
  logEvent,
  SYSTEM_PROMPT,
  buildInvestigationPrompt,
  persistResult,
  markInvestigationFailed,
} from '../agent-shared';
import { toGeminiFunctionDeclaration } from './schema-convert';
import { withGeminiRetry } from './gemini-retry';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const MAX_TOOL_ITERATIONS = 24;
const MAX_OUTPUT_TOKENS = 4096;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return new GoogleGenAI({ apiKey });
}

const FUNCTION_DECLARATIONS = [...TOOL_DEFINITIONS, SUBMIT_RESULT_TOOL].map(toGeminiFunctionDeclaration);

/**
 * Gemini-backed equivalent of runInvestigation() in lib/ai/agent.ts. Same
 * tool set, same system prompt, same persistence path (via
 * lib/ai/agent-shared.ts) — only the model-call mechanics differ, because
 * Gemini's function-calling API shape is different from Claude's tool_use
 * blocks. This exists purely as a free/cheap alternative for local testing
 * (see AI_PROVIDER in .env.example); Claude remains the default, supported
 * path and this file is never imported unless AI_PROVIDER=gemini.
 */
export async function runInvestigationGemini(incidentId: string, investigationId: string): Promise<void> {
  try {
    const incident = await prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });
    const ctx = await loadInvestigationContext(incidentId);
    const client = getClient();

    await logEvent(
      investigationId,
      'UNDERSTAND',
      `Investigation started for "${incident.title}" (${incident.severity}, service: ${incident.serviceName}). [via Gemini]`
    );

    if (ctx.logFiles.length === 0 && !ctx.repoPath) {
      await logEvent(
        investigationId,
        'UNDERSTAND',
        'No log files or repository were uploaded for this incident — investigation will rely only on the incident description.'
      );
    }

    const prompt = buildInvestigationPrompt(incident, ctx);
    const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];

    let finalResult: InvestigationResult | null = null;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS && !finalResult; iteration++) {
      const response = await withGeminiRetry(
        () =>
          client.models.generateContent({
            model: MODEL,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
              toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
            },
          }),
        `Investigation step ${iteration + 1}`
      );

      const candidateParts = response.candidates?.[0]?.content?.parts ?? [];
      const functionCallParts = candidateParts.filter((p): p is Part & { functionCall: NonNullable<Part['functionCall']> } => Boolean(p.functionCall));

      // Keep the model's own turn in history so it has context next iteration.
      contents.push({ role: 'model', parts: candidateParts });

      if (functionCallParts.length === 0) {
        // Model replied with text only (no tool call, no submission yet).
        // Nudge it back toward using tools / submitting, same as the Claude path.
        contents.push({
          role: 'user',
          parts: [{
            text: 'Please continue the investigation using your tools, and call submit_investigation_result with your findings when you are done.',
          }],
        });
        continue;
      }

      const responseParts: Part[] = [];

      for (const part of functionCallParts) {
        const call = part.functionCall;
        const name = call.name ?? '';
        const input = (call.args ?? {}) as Record<string, unknown>;

        if (name === 'submit_investigation_result') {
          const parsed = investigationResultSchema.safeParse(input);
          if (!parsed.success) {
            responseParts.push({
              functionResponse: {
                name,
                response: {
                  error: `Your submission did not match the required schema: ${parsed.error.message}. Please fix it and call submit_investigation_result again.`,
                },
              },
            });
            continue;
          }
          finalResult = parsed.data;
          break;
        }

        let result: unknown;
        try {
          result = await executeTool(name, input, ctx, incident.deploymentTimestamp);
        } catch (toolError) {
          result = { error: toolError instanceof Error ? toolError.message : 'Tool execution failed' };
        }

        const phase = PHASE_BY_TOOL[name];
        if (phase) {
          await logEvent(investigationId, phase, summarizeToolCall(name, input, result));
        }

        responseParts.push({
          functionResponse: {
            name,
            response: { result: JSON.stringify(result).slice(0, 8000) },
          },
        });
      }

      if (finalResult) break;

      contents.push({ role: 'user', parts: responseParts });
    }

    if (!finalResult) {
      throw new Error(
        'Investigation did not converge on a structured result within the allotted tool-call budget.'
      );
    }

    await logEvent(investigationId, 'HYPOTHESES', 'Evaluating hypotheses and gathered evidence.');
    await persistResult(investigationId, incidentId, finalResult);
    await logEvent(investigationId, 'CONCLUSION', `Root cause identified: ${finalResult.rootCause}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Investigation failed for an unknown reason.';
    await markInvestigationFailed(incidentId, investigationId, message);
  }
}
