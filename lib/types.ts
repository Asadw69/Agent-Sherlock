// Core domain types for AgentSherlock

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type InvestigationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type EvidenceType = 'log' | 'code' | 'git' | 'deployment' | 'metric';
export type EvidenceStrength = 'weak' | 'strong' | 'confirmed';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  serviceName: string;
  deploymentVersion?: string;
  deploymentTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investigation {
  id: string;
  incidentId: string;
  status: InvestigationStatus;
  startedAt: Date;
  completedAt?: Date;
  rootCause?: string;
  confidence?: number;
  explanation?: string;
}

export interface Evidence {
  id: string;
  investigationId: string;
  type: EvidenceType;
  title: string;
  description: string;
  strength: EvidenceStrength;
  content?: string;
  sourceFile?: string;
  lineNumber?: number;
}

export interface TimelineEvent {
  id: string;
  investigationId: string;
  timestamp: Date;
  title: string;
  description: string;
  type: 'deployment' | 'error' | 'metric' | 'service' | 'infrastructure';
}

export interface InvestigationEvent {
  id: string;
  investigationId: string;
  timestamp: Date;
  phase: 'understand' | 'logs' | 'timeline' | 'code' | 'git' | 'hypotheses' | 'conclusion';
  activity: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface RecommendedFix {
  id: string;
  investigationId: string;
  immediate: string;
  longTerm: string;
  monitoring: string;
  reasoningSummary?: string;
  relatedEvidence?: string[];
}

export interface Report {
  id: string;
  investigationId: string;
  summary: string;
  timeline: TimelineEvent[];
  rootCause: string;
  evidence: Evidence[];
  confidence: number;
  generatedAt: Date;
}

// UI Component Props

export interface IncidentCardProps {
  incident: Incident;
  investigation?: Investigation;
  onClick?: () => void;
}

export interface RootCauseCardProps {
  rootCause?: string;
  confidence?: number;
  explanation?: string;
  isLoading?: boolean;
}

export interface EvidenceCardProps {
  evidence: Evidence;
}

export interface TimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export interface ActivityFeedProps {
  events: InvestigationEvent[];
  isLoading?: boolean;
}

export interface CodeViewerProps {
  filePath: string;
  content: string;
  highlightLines?: number[];
  commit?: string;
}
