// Which LLM backend the investigation agent and fix generator use.
// Switchable via AI_PROVIDER so Gemini can be used as a free/cheap
// stand-in for Claude during local testing, without touching the
// default (and primary, supported) Anthropic code path at all.

export type AiProvider = 'anthropic' | 'gemini';

export function getAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER || 'anthropic').trim().toLowerCase();
  return raw === 'gemini' ? 'gemini' : 'anthropic';
}

/** Which env var must be set for the currently-selected provider. */
export function requiredApiKeyEnvVar(): 'ANTHROPIC_API_KEY' | 'GEMINI_API_KEY' {
  return getAiProvider() === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY';
}

export function hasRequiredApiKey(): boolean {
  return Boolean(process.env[requiredApiKeyEnvVar()]);
}
