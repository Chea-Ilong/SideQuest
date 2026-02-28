// Frontend type definitions matching API response shapes

export type ScanStatus = 'new' | 'running' | 'ready' | 'error';

export interface Scan {
  id: string;
  share_token: string;
  status: ScanStatus;
  created_at: string;
  updated_at: string;
  config: {
    targetRole?: string;
  };
  progress: ScanProgress;
  error_details?: Record<string, unknown>;
}

export interface ScanProgress {
  phase?: string;
  percent?: number;
  steps_completed?: string[];
  errors?: string[];
  message?: string | null;
}

export interface SkillView {
  esco_uri: string;
  preferred_label: string;
  score: number;
  evidence_count: number;
  normalization_method: string;
  normalization_confidence: number;
  evidence: EvidenceRef[];
}

export interface EvidenceRef {
  id: string;
  evidence_type: string;
  text_snippet?: string;
  source_type: string;
  strength: number;
  ref: Record<string, unknown>;
  timestamp?: string;
}

export interface EvidenceItem {
  id: string;
  evidence_type: string;
  text_snippet?: string;
  strength: number;
  timestamp?: string;
  ref: Record<string, unknown>;
  sources?: { type: string };
}

export interface GraphNode {
  id: string;
  label: string;
  score: number;
  cluster_id?: string;
  cluster_label?: string;
  cluster_color?: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

export interface ClusterView {
  id: string;
  label: string;
  description?: string;
  color: string;
  centroid_x?: number;
  centroid_y?: number;
  skills: Array<{
    esco_uri: string;
    preferred_label: string;
    score: number;
    x: number;
    y: number;
  }>;
}

export interface GapView {
  esco_uri: string;
  preferred_label: string;
  target_weight: number;
  user_score: number;
  gap_score: number;
  rationale?: string;
}

export interface TimelinePoint {
  period_start: string;
  period_end: string;
  top_skills: Array<{ esco_uri: string; preferred_label: string; score: number }>;
  cluster_summary: Record<string, number>;
}

export interface RoadmapItem {
  id: string;
  esco_uri: string;
  preferred_label: string;
  priority: number;
  title: string;
  description?: string;
  estimated_hours?: number;
  prerequisite_uris: string[];
  resources: Array<{ title: string; url: string; type: string }>;
}

export interface TargetRole {
  id: string;
  name: string;
  description: string;
}
