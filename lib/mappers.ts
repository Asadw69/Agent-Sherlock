// Maps Prisma's UPPERCASE enum values (the DB layer) to the lowercase
// string unions the Session 1 UI components expect (lib/types.ts). Kept as
// a thin adapter so neither the schema nor the existing components need to
// change to plug real data in.

import type {
  Investigation as UIInvestigation,
  InvestigationEvent as UIInvestigationEvent,
  Evidence as UIEvidence,
  TimelineEvent as UITimelineEvent,
} from '@/lib/types';

// Minimal shapes matching what Prisma returns via `include`, avoiding a
// hard dependency on generated Prisma types here.
interface PrismaInvestigationEvent {
  id: string;
  investigationId: string;
  timestamp: Date;
  phase: string;
  activity: string;
  status: string;
}

interface PrismaEvidence {
  id: string;
  investigationId: string;
  type: string;
  title: string;
  description: string;
  strength: string;
  sourceFile: string | null;
  lineNumber: number | null;
}

interface PrismaTimelineEvent {
  id: string;
  investigationId: string;
  timestamp: Date;
  title: string;
  description: string;
  eventType: string;
}

interface PrismaInvestigation {
  id: string;
  incidentId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  rootCause: string | null;
  confidence: number | null;
  explanation: string | null;
}

const lower = <T extends string>(v: string) => v.toLowerCase() as T;

export function mapInvestigationStatus(status: string): UIInvestigation['status'] {
  return lower(status);
}

export function mapInvestigationEvent(e: PrismaInvestigationEvent): UIInvestigationEvent {
  return {
    id: e.id,
    investigationId: e.investigationId,
    timestamp: e.timestamp,
    phase: lower(e.phase),
    activity: e.activity,
    status: lower(e.status),
  };
}

export function mapEvidence(e: PrismaEvidence): UIEvidence {
  return {
    id: e.id,
    investigationId: e.investigationId,
    type: lower(e.type),
    title: e.title,
    description: e.description,
    strength: lower(e.strength),
    sourceFile: e.sourceFile ?? undefined,
    lineNumber: e.lineNumber ?? undefined,
  };
}

export function mapTimelineEvent(e: PrismaTimelineEvent): UITimelineEvent {
  return {
    id: e.id,
    investigationId: e.investigationId,
    timestamp: e.timestamp,
    title: e.title,
    description: e.description,
    type: lower(e.eventType),
  };
}

export function mapInvestigation(inv: PrismaInvestigation): UIInvestigation {
  return {
    id: inv.id,
    incidentId: inv.incidentId,
    status: mapInvestigationStatus(inv.status),
    startedAt: inv.startedAt,
    completedAt: inv.completedAt ?? undefined,
    rootCause: inv.rootCause ?? undefined,
    confidence: inv.confidence ?? undefined,
    explanation: inv.explanation ?? undefined,
  };
}

interface PrismaIncidentSummary {
  id: string;
  title: string;
  description: string;
  severity: string;
  serviceName: string;
  deploymentVersion: string | null;
  deploymentTimestamp: Date | null;
  createdAt: Date;
  updatedAt: Date;
  investigation?: { id: string; status: string; confidence: number | null } | null;
}

/**
 * Maps a dashboard-list-shaped Prisma incident (with a partial investigation
 * select) to the lib/types.ts shape the Session 1 dashboard components
 * expect. Fixes the pre-existing UPPERCASE-vs-lowercase enum mismatch
 * documented in CLAUDE.md without introducing a second type system.
 */
export function mapIncidentSummary(incident: PrismaIncidentSummary) {
  return {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    severity: lower<'low' | 'medium' | 'high' | 'critical'>(incident.severity),
    serviceName: incident.serviceName,
    deploymentVersion: incident.deploymentVersion ?? undefined,
    deploymentTimestamp: incident.deploymentTimestamp ?? undefined,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    investigation: incident.investigation
      ? {
          id: incident.investigation.id,
          incidentId: incident.id,
          status: mapInvestigationStatus(incident.investigation.status),
          startedAt: incident.createdAt,
          confidence: incident.investigation.confidence ?? undefined,
        }
      : undefined,
  };
}
