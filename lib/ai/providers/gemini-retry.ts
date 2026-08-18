// Small retry helper for Gemini's free-tier rate limits (e.g. gemini-2.5-flash
// is 5 RPM / 20 RPD on the free tier). Without this, a single 429 mid-loop
// fails the whole investigation or fix generation. This does NOT get around
// the daily quota (RPD) — once that's exhausted, retrying is pointless and
// we give up — it only smooths over transient per-minute (RPM) throttling.

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 15_000; // Gemini free-tier RPM windows are ~60s; wait a healthy chunk of one.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { status?: number; code?: number; message?: string };
  if (err.status === 429 || err.code === 429) return true;
  const message = err.message ?? String(error);
  return /429|RESOURCE_EXHAUSTED|rate.?limit/i.test(message);
}

function isQuotaExhaustedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string };
  const message = err.message ?? String(error);
  // Daily quota (RPD) exhaustion won't recover within a short retry window.
  return /per.?day|daily|RPD/i.test(message);
}

/**
 * Runs `fn`, retrying with exponential backoff if Gemini returns a 429
 * (rate limit). Gives up immediately if the error looks like a daily-quota
 * (RPD) exhaustion, since no amount of short-window retrying will help.
 */
export async function withGeminiRetry<T>(fn: () => Promise<T>, label = 'Gemini call'): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error)) throw error;

      if (isQuotaExhaustedError(error)) {
        throw new Error(
          `${label} failed: Gemini's daily free-tier quota appears to be exhausted. Try again after the quota resets, or switch AI_PROVIDER back to "anthropic".`
        );
      }

      if (attempt === MAX_RETRIES) break;

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts due to Gemini rate limiting (free-tier RPM cap). Original error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
