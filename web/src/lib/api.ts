import type { Scan, SkillView, EvidenceItem, GraphNode, GraphEdge, ClusterView, GapView, TimelinePoint, RoadmapItem, TargetRole } from '../types/index.js';
import { API_BASE_URL } from '../config/env.js';

// Storage key for share tokens
const SCAN_TOKENS_KEY = 'skill_dna_scan_tokens';

export function saveShareToken(scanId: string, token: string): void {
  const existing = getShareTokens();
  existing[scanId] = token;
  localStorage.setItem(SCAN_TOKENS_KEY, JSON.stringify(existing));
}

export function getShareToken(scanId: string): string | null {
  const tokens = getShareTokens();
  return tokens[scanId] ?? null;
}

function getShareTokens(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SCAN_TOKENS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function getAllScans(): Array<{ id: string; token: string }> {
  const tokens = getShareTokens();
  return Object.entries(tokens).map(([id, token]) => ({ id, token }));
}

export function removeShareToken(scanId: string): void {
  const tokens = getShareTokens();
  delete tokens[scanId];
  localStorage.setItem(SCAN_TOKENS_KEY, JSON.stringify(tokens));
}

interface FetchOptions extends RequestInit {
  scanId?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { scanId, ...fetchOpts } = options;

  // Attach share token if we have one for this scan
  const headers: Record<string, string> = {
    ...(fetchOpts.headers as Record<string, string> ?? {}),
  };

  if (scanId) {
    const token = getShareToken(scanId);
    if (token) {
      headers['x-share-token'] = token;
    }
  }

  // Add content-type for JSON requests
  if (fetchOpts.body && typeof fetchOpts.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { ...fetchOpts, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new ApiError(
      errorBody?.error?.message ?? response.statusText,
      response.status,
      errorBody?.error?.code
    );
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Scan endpoints
export const api = {
  scans: {
    create: (config?: { targetRole?: string }) =>
      apiFetch<{ data: { id: string; share_token: string; status: string } }>('/api/scans', {
        method: 'POST',
        body: JSON.stringify({ config: config ?? {} }),
      }),

    get: (id: string) =>
      apiFetch<{ data: Scan }>(`/api/scans/${id}`, { scanId: id }),

    delete: (id: string) =>
      apiFetch<{ deleted: boolean; scan_id: string }>(`/api/scans/${id}`, {
        method: 'DELETE',
        scanId: id,
      }),

    getStatus: (id: string) =>
      apiFetch<{ data: { status: string; progress: import('../types/index.js').ScanProgress } }>(
        `/api/scans/${id}/status`,
        { scanId: id }
      ),

    run: (id: string) =>
      apiFetch<{ message: string; scan_id: string }>(`/api/scans/${id}/run`, {
        method: 'POST',
        scanId: id,
      }),

    addGitHubSource: (id: string, username: string, token?: string) =>
      apiFetch<{ data: unknown; message: string }>(`/api/scans/${id}/sources`, {
        method: 'POST',
        body: JSON.stringify({ type: 'github', username, token }),
        scanId: id,
      }),

    addManualSource: (id: string, input: {
      skills: Array<{ name: string; selfRating?: number }>;
      projects: Array<{ name: string; summary: string; stack: string[] }>;
      roles: Array<{ title: string; company?: string; bullets: string[] }>;
    }) =>
      apiFetch<{ data: unknown; message: string }>(`/api/scans/${id}/sources`, {
        method: 'POST',
        body: JSON.stringify({ type: 'manual', ...input }),
        scanId: id,
      }),
  },

  views: {
    skills: (id: string) =>
      apiFetch<{ data: SkillView[] }>(`/api/scans/${id}/views/skills`, { scanId: id }),

    evidence: (id: string) =>
      apiFetch<{ data: EvidenceItem[] }>(`/api/scans/${id}/views/evidence`, { scanId: id }),

    map: (id: string) =>
      apiFetch<{ data: { nodes: GraphNode[]; edges: GraphEdge[] } }>(
        `/api/scans/${id}/views/map`,
        { scanId: id }
      ),

    clusters: (id: string) =>
      apiFetch<{ data: ClusterView[] }>(`/api/scans/${id}/views/clusters`, { scanId: id }),

    gaps: (id: string, role?: string) =>
      apiFetch<{ data: GapView[] }>(
        `/api/scans/${id}/views/gaps${role ? `?role=${role}` : ''}`,
        { scanId: id }
      ),

    timeline: (id: string) =>
      apiFetch<{ data: TimelinePoint[] }>(`/api/scans/${id}/views/timeline`, { scanId: id }),

    roadmap: (id: string) =>
      apiFetch<{ data: RoadmapItem[] }>(`/api/scans/${id}/views/roadmap`, { scanId: id }),

    targetRoles: () =>
      apiFetch<{ data: TargetRole[] }>('/api/scans/target-roles'),
  },
};

// Upload resume (multipart)
export async function uploadResume(scanId: string, file: File): Promise<{ data: unknown; message: string }> {
  const token = getShareToken(scanId);
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('type', 'resume');

  const headers: Record<string, string> = {};
  if (token) headers['x-share-token'] = token;

  const response = await fetch(`${API_BASE_URL}/api/scans/${scanId}/sources`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
    throw new ApiError(err?.error?.message ?? 'Upload failed', response.status);
  }

  return response.json();
}
