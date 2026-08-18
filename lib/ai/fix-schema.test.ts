import { describe, it, expect } from 'vitest';
import { recommendedFixSchema } from './fix-schema';

const validFix = {
  immediateAction: 'Revert the v2.4.1 connection-timeout change and redeploy.',
  longTermFix: 'Add a regression test asserting idleTimeoutMillis stays bounded relative to pool size.',
  monitoringRecommendations: 'Alert when pool utilization exceeds 80% for more than 2 minutes.',
  reasoningSummary: 'The evidence directly ties the v2.4.1 commit to the pool exhaustion.',
  relatedEvidence: ['database.log connection pool exhausted', 'commit 6b02157'],
};

describe('recommendedFixSchema', () => {
  it('accepts a well-formed fix', () => {
    expect(recommendedFixSchema.safeParse(validFix).success).toBe(true);
  });

  it('rejects a fix missing required fields', () => {
    const { immediateAction, ...rest } = validFix;
    void immediateAction;
    expect(recommendedFixSchema.safeParse(rest).success).toBe(false);
  });

  it('defaults relatedEvidence to an empty array when omitted', () => {
    const { relatedEvidence, ...rest } = validFix;
    void relatedEvidence;
    const result = recommendedFixSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.relatedEvidence).toEqual([]);
  });

  it('rejects a hallucinated non-object response', () => {
    expect(recommendedFixSchema.safeParse('just revert it').success).toBe(false);
  });
});
