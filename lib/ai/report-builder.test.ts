import { describe, it, expect } from 'vitest';
import { buildIncidentReport, ReportInputData } from './report-builder';

const baseData: ReportInputData = {
  incident: {
    title: 'Payment API Outage',
    description: 'Payments failed for 14 minutes after deployment v2.4.1.',
    severity: 'CRITICAL',
    serviceName: 'payment-service',
    deploymentVersion: 'v2.4.1',
    deploymentTimestamp: new Date('2026-08-15T14:02:00Z'),
    createdAt: new Date('2026-08-15T14:10:00Z'),
  },
  investigation: {
    rootCause: 'Database connection pool exhaustion',
    explanation: 'idleTimeoutMillis was raised from 30s to 300s in v2.4.1, exhausting the fixed-size pool.',
    confidence: 82,
    summary: 'Deployment v2.4.1 exhausted the connection pool under load.',
    affectedComponents: ['payment-service', 'database'],
    startedAt: new Date('2026-08-15T14:15:00Z'),
    completedAt: new Date('2026-08-15T14:17:00Z'),
  },
  evidence: [
    {
      title: 'Connection pool exhausted',
      description: 'database.log shows pool exhaustion at 14:13 UTC',
      strength: 'STRONG',
      type: 'LOG',
      sourceFile: 'database.log',
    },
  ],
  timeline: [
    {
      timestamp: new Date('2026-08-15T14:02:00Z'),
      title: 'Deployment v2.4.1',
      description: 'Deployed to production',
      eventType: 'DEPLOYMENT',
    },
  ],
  hypotheses: [
    { title: 'Pool exhaustion', description: 'Pool ran out of connections', status: 'LIKELY' },
  ],
  suspiciousCommits: [
    {
      commitHash: '6b0215786ed41e11e33898f038b3454f0853592a',
      message: 'v2.4.1: improve payment retry handling',
      relevance: 'Raised idle timeout 10x',
      changedFiles: ['src/database/connection.ts'],
    },
  ],
  recommendedFix: {
    immediate: 'Revert the timeout change.',
    longTerm: 'Add a regression test.',
    monitoring: 'Alert on pool utilization > 80%.',
  },
};

describe('buildIncidentReport', () => {
  it('includes all 8 required sections', () => {
    const { content } = buildIncidentReport(baseData);
    for (const heading of [
      '## 1. Executive Summary',
      '## 2. Impact',
      '## 3. Timeline',
      '## 4. Root Cause',
      '## 5. Evidence',
      '## 6. Contributing Factors',
      '## 7. Recommended Fix',
      '## 8. Preventative Actions',
    ]) {
      expect(content).toContain(heading);
    }
  });

  it('uses the investigation summary as the executive summary when present', () => {
    const { summary } = buildIncidentReport(baseData);
    expect(summary).toBe(baseData.investigation.summary);
  });

  it('reflects the real root cause and confidence, not placeholder text', () => {
    const { content } = buildIncidentReport(baseData);
    expect(content).toContain('Database connection pool exhaustion');
    expect(content).toContain('82%');
  });

  it('never fabricates a root cause when none was determined', () => {
    const data: ReportInputData = {
      ...baseData,
      investigation: { ...baseData.investigation, rootCause: null, explanation: null, summary: null },
    };
    const { content } = buildIncidentReport(data);
    expect(content).toContain('No root cause was determined');
    expect(content).not.toContain('Database connection pool exhaustion');
  });

  it('shows an honest empty state when there is no timeline data instead of inventing one', () => {
    const data: ReportInputData = { ...baseData, timeline: [] };
    const { content } = buildIncidentReport(data);
    expect(content).toContain('No timeline events were established');
  });

  it('shows an honest empty state when no fix has been generated yet', () => {
    const data: ReportInputData = { ...baseData, recommendedFix: null };
    const { content } = buildIncidentReport(data);
    expect(content).toContain('No recommended fix has been generated yet');
  });
});
