import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { loadInvestigationContext } from './context';
import { TOOL_DEFINITIONS, executeTool } from './tools';
import { SUBMIT_RESULT_TOOL, investigationResultSchema, InvestigationResult } from './schema';
import {
  PHASE_BY_TOOL,
  summarizeToolCall,
  logEvent,
  SYSTEM_PROMPT,
  buildInvestigationPrompt,
  persistResult,
  markInvestigationFailed,
} from './agent-shared';
import { getAiProvider } from './provider';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOOL_ITERATIONS = 24;
const MAX_TOKENS = 4096;

export class InvestigationAlreadyRunningError extends Error {
  constructor() {
    super('An investigation is already in progress for this incident.');
    this.name = 'InvestigationAlreadyRunningError';
  }
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  }
  return new Anthropic({ apiKey });
}

interface ClaudeToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export async function startInvestigation(incidentId: string): Promise<{ investigationId: string }> {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new Error('Incident not found');

  let investigation = await prisma.investigation.findUnique({ where: { incidentId } });

  if (!investigation) {
    investigation = await prisma.investigation.create({
      data: { incidentId, status: 'PENDING' },
    });
  }

  if (investigation.status === 'IN_PROGRESS') {
    throw new InvestigationAlreadyRunningError();
  }

  // Atomically claim the investigation so concurrent requests can't both start it.
  const claimed = await prisma.investigation.updateMany({
    where: { id: investigation.id, status: { not: 'IN_PROGRESS' } },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      completedAt: null,
      errorMessage: null,
      rootCause: null,
      confidence: null,
      explanation: null,
      summary: null,
      affectedComponents: [],
    },
  });

  if (claimed.count === 0) {
    throw new InvestigationAlreadyRunningError();
  }

  // Clear any prior run's child records so a retry doesn't mix old + new results.
  await Promise.all([
    prisma.investigationEvent.deleteMany({ where: { investigationId: investigation.id } }),
    prisma.evidence.deleteMany({ where: { investigationId: investigation.id } }),
    prisma.timelineEvent.deleteMany({ where: { investigationId: investigation.id } }),
    prisma.hypothesis.deleteMany({ where: { investigationId: investigation.id } }),
    prisma.suspiciousCommit.deleteMany({ where: { investigationId: investigation.id } }),
  ]);

  await prisma.incident.update({ where: { id: incidentId }, data: { status: 'INVESTIGATING' } });

  return { investigationId: investigation.id };
}

/**
 * Runs the agentic investigation loop using whichever provider AI_PROVIDER
 * selects (default: Anthropic/Claude). Intended to be invoked after
 * startInvestigation() has atomically claimed the investigation. Persists
 * activity events as it goes and the final structured result at the end.
 * Never throws to the caller for expected failure modes — always resolves,
 * marking the investigation FAILED with a safe message on error.
 */
export async function runInvestigation(incidentId: string, investigationId: string): Promise<void> {
  if (getAiProvider() === 'gemini') {
    const { runInvestigationGemini } = await import('./providers/gemini-agent');
    return runInvestigationGemini(incidentId, investigationId);
  }
  return runInvestigationClaude(incidentId, investigationId);
}

async function runInvestigationClaude(incidentId: string, investigationId: string): Promise<void> {
  try {
    const incident = await prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });
    const ctx = await loadInvestigationContext(incidentId);
    const client = getClient();

    await logEvent(
      investigationId,
      'UNDERSTAND',
      `Investigation started for "${incident.title}" (${incident.severity}, service: ${incident.serviceName}).`
    );

    if (ctx.logFiles.length === 0 && !ctx.repoPath) {
      await logEvent(
        investigationId,
        'UNDERSTAND',
        'No log files or repository were uploaded for this incident — investigation will rely only on the incident description.'
      );
    }

    const userMessage = buildInvestigationPrompt(incident, ctx);

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];
    const tools = [...TOOL_DEFINITIONS, SUBMIT_RESULT_TOOL] as unknown as Anthropic.Tool[];

    let finalResult: InvestigationResult | null = null;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS && !finalResult; iteration++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) {
        // Model stopped without submitting a result and without calling a tool.
        // Nudge it once more toward submission; if it still doesn't, bail out.
        if (response.stop_reason === 'end_turn') {
          messages.push({
            role: 'user',
            content:
              'Please continue the investigation using your tools, and call submit_investigation_result with your findings when you are done.',
          });
          continue;
        }
        break;
      }

      const toolResults: ClaudeToolResultBlock[] = [];

      for (const block of toolUseBlocks) {
        if (block.name === 'submit_investigation_result') {
          const parsed = investigationResultSchema.safeParse(block.input);
          if (!parsed.success) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Your submission did not match the required schema: ${parsed.error.message}. Please fix it and call submit_investigation_result again.`,
            });
            continue;
          }
          finalResult = parsed.data;
          break;
        }

        const input = block.input as Record<string, unknown>;
        let result: unknown;
        try {
          result = await executeTool(block.name, input, ctx, incident.deploymentTimestamp);
        } catch (toolError) {
          result = { error: toolError instanceof Error ? toolError.message : 'Tool execution failed' };
        }

        const phase = PHASE_BY_TOOL[block.name];
        if (phase) {
          await logEvent(investigationId, phase, summarizeToolCall(block.name, input, result));
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result).slice(0, 8000),
        });
      }

      if (finalResult) break;

      messages.push({ role: 'user', content: toolResults as unknown as Anthropic.MessageParam['content'] });
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
