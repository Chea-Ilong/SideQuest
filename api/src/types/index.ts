// Core domain types shared across the API

export type ScanStatus = 'new' | 'running' | 'ready' | 'error';
export type SourceType = 'github' | 'resume' | 'manual';
export type EvidenceType =
  | 'repo_topic'
  | 'repo_language'
  | 'dependency'
  | 'readme_snippet'
  | 'resume_bullet'
  | 'manual_claim';
export type NormalizationMethod = 'exact' | 'trigram' | 'embedding' | 'manual_override';

export interface Scan {
  id: string;
  share_token: string;
  status: ScanStatus;
  created_at: string;
  updated_at: string;
  config: ScanConfig;
  progress: ScanProgress;
  error_details?: Record<string, unknown>;
  delete_at?: string;
}

export interface ScanConfig {
  targetRole?: string;
  weights?: Record<string, number>;
}

export interface ScanProgress {
  phase?: string;
  percent?: number;
  steps_completed?: string[];
  errors?: string[];
}

export interface Source {
  id: string;
  scan_id: string;
  type: SourceType;
  config: Record<string, unknown>;
  status: 'pending' | 'processing' | 'done' | 'error';
  error_details?: Record<string, unknown>;
  created_at: string;
}

export interface EvidenceItem {
  id: string;
  scan_id: string;
  source_id: string;
  evidence_type: EvidenceType;
  ref: Record<string, unknown>;
  text_snippet?: string;
  timestamp?: string;
  strength: number;
  created_at: string;
}

export interface SkillMention {
  id: string;
  evidence_id: string;
  mention_text: string;
  context_text?: string;
  start_idx?: number;
  end_idx?: number;
  confidence: number;
}

export interface EscoSkill {
  esco_uri: string;
  preferred_label: string;
  alt_labels?: string;
  skill_type?: string;
  reuse_level?: string;
  description?: string;
}

export interface UserSkillScore {
  scan_id: string;
  esco_uri: string;
  preferred_label?: string;
  score: number;
  recency_days?: number;
  evidence_count: number;
  top_evidence_ids: string[];
}

export interface SkillView {
  esco_uri: string;
  preferred_label: string;
  score: number;
  evidence_count: number;
  normalization_method: NormalizationMethod;
  normalization_confidence: number;
  evidence: EvidenceRef[];
}

export interface EvidenceRef {
  id: string;
  evidence_type: EvidenceType;
  text_snippet?: string;
  source_type: SourceType;
  strength: number;
  ref: Record<string, unknown>;
  timestamp?: string;
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
  type: 'esco_relation' | 'co_occurrence';
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
