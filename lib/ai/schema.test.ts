import { describe, it, expect } from 'vitest';
import { investigationResultSchema } from './schema';

const validResult = {
  summary: 'Deployment v2.4.1 increased the idle connection timeout, exhausting the pool under load.',
  rootCause: 'Database connection pool exhaustion',
  rootCauseExplanation: 'The v2.4.1 commit raised idleTimeoutMillis from 30s to 300s, causing connections to be held far longer than the fixed pool size (20) could sustain under load.',
  confidence: 82,
  confidenceExplanation: 'Strong log + git evidence directly correlates the deployment with the failure window.',
  affectedComponents: ['payment-service', 'database'],
  hypotheses: [
    { title: 'Connection pool exhaustion', description: 'Pool ran out of connections.', status: 'LIKELY' },
  ],
  evidence: [
    {
      finding: 'Connection pool exhausted',
      description: 'database.log shows "connection pool exhausted" starting at 14:13 UTC',
      strength: 'STRONG',
      sourceType: 'LOG',
      file: 'database.log',
    },
  ],
  timeline: [
    {
      timestamp: '2026-08-15T14:02:00Z',
      title: 'Deployment v2.4.1',
      description: 'Payment service deployed to production',
      type: 'DEPLOYMENT',
    },
  ],
  suspiciousCommits: [
    {
      commitHash: '6b0215786ed41e11e33898f038b3454f0853592a',
      message: 'v2.4.1: improve payment retry handling',
      relevance: 'Increases idle timeout from 30s to 300s',
      changedFiles: ['src/database/connection.ts'],
    },
  ],
  investigationSummary: 'Searched logs, found pool exhaustion errors, correlated with the v2.4.1 deployment commit via git diff.',
};

describe('investigationResultSchema', () => {
  it('accepts a well-formed investigation result', () => {
    const result = investigationResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('rejects a result missing required fields (e.g. no rootCause)', () => {
    const { rootCause, ...rest } = validResult;
    void rootCause;
    const result = investigationResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a result with zero evidence', () => {
    const result = investigationResultSchema.safeParse({ ...validResult, evidence: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range confidence score', () => {
    expect(investigationResultSchema.safeParse({ ...validResult, confidence: 150 }).success).toBe(false);
    expect(investigationResultSchema.safeParse({ ...validResult, confidence: -5 }).success).toBe(false);
  });

  it('rejects an invalid evidence strength enum value', () => {
    const malformed = {
      ...validResult,
      evidence: [{ ...validResult.evidence[0], strength: 'SUPER_STRONG' }],
    };
    expect(investigationResultSchema.safeParse(malformed).success).toBe(false);
  });

  it('rejects a completely malformed / hallucinated shape (e.g. a plain string)', () => {
    expect(investigationResultSchema.safeParse('the root cause is a database issue').success).toBe(false);
  });

  it('rejects null/undefined input', () => {
    expect(investigationResultSchema.safeParse(null).success).toBe(false);
    expect(investigationResultSchema.safeParse(undefined).success).toBe(false);
  });
});
