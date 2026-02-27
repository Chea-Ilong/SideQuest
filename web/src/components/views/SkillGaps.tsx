import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { GapView, TargetRole } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import { Badge } from '../common/Badge.js';

interface SkillGapsProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

export function SkillGaps({ scanId, onSkillClick }: SkillGapsProps) {
  const [gaps, setGaps] = useState<GapView[]>([]);
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('fullstack-eng');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load roles on mount
  useEffect(() => {
    api.views.targetRoles().then((r) => setRoles(r.data)).catch(() => {});
  }, []);

  // Load gaps when role changes
  useEffect(() => {
    setLoading(true);
    api.views.gaps(scanId, selectedRole)
      .then((r) => setGaps(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId, selectedRole]);

  function gapLabel(score: number): { label: string; variant: 'error' | 'warning' | 'info' } {
    if (score > 0.6) return { label: 'Critical', variant: 'error' };
    if (score > 0.3) return { label: 'Moderate', variant: 'warning' };
    return { label: 'Minor', variant: 'info' };
  }

  return (
    <div className="space-y-4">
      {/* Role selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Target role:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
          {roles.length === 0 && <option value="fullstack-eng">Fullstack Engineer</option>}
        </select>
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && gaps.length === 0 && (
        <p className="text-slate-500 text-center py-8">
          No skill gaps found for this role. Your profile matches the requirements well!
        </p>
      )}

      {!loading && gaps.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {gaps.length} skill gap{gaps.length !== 1 ? 's' : ''} identified for{' '}
            <strong>{roles.find((r) => r.id === selectedRole)?.name ?? selectedRole}</strong>
          </p>

          {gaps.map((gap) => {
            const { label, variant } = gapLabel(gap.gap_score);
            return (
              <button
                key={gap.esco_uri}
                onClick={() => onSkillClick(gap.esco_uri)}
                className="w-full text-left border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{gap.preferred_label}</span>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    {gap.rationale && (
                      <p className="text-sm text-slate-500 mt-1">{gap.rationale}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 text-sm space-y-1">
                    <div>
                      <span className="text-slate-500">Target: </span>
                      <span className="font-medium text-slate-700">{Math.round(gap.target_weight * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">You: </span>
                      <span className="font-medium text-slate-700">{Math.round(gap.user_score * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Gap progress bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${Math.round(gap.user_score * 100)}%` }}
                    />
                  </div>
                  <div className="flex-1 bg-red-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-red-400"
                      style={{ width: `${Math.round(gap.gap_score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-red-600 font-medium w-10 text-right">
                    -{Math.round(gap.gap_score * 100)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
