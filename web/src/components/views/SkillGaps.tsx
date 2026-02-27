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

  function gapConfig(score: number): { label: string; variant: 'error' | 'warning' | 'info'; barColor: string; bgColor: string } {
    if (score > 0.6) return { label: 'Critical', variant: 'error', barColor: '#ef4444', bgColor: 'bg-red-50' };
    if (score > 0.3) return { label: 'Moderate', variant: 'warning', barColor: '#f59e0b', bgColor: 'bg-amber-50' };
    return { label: 'Minor', variant: 'info', barColor: '#6366f1', bgColor: 'bg-indigo-50' };
  }

  const criticalCount = gaps.filter(g => g.gap_score > 0.6).length;
  const moderateCount = gaps.filter(g => g.gap_score > 0.3 && g.gap_score <= 0.6).length;
  const minorCount = gaps.filter(g => g.gap_score <= 0.3).length;

  return (
    <div className="space-y-5">
      {/* Role selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Target Role:</label>
        <div className="relative flex-1 min-w-48">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white shadow-sm font-medium text-slate-700 cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
            {roles.length === 0 && <option value="fullstack-eng">Fullstack Engineer</option>}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Analyzing skill gaps...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {!loading && gaps.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">🎉</div>
          <p className="text-slate-700 font-semibold">Great match!</p>
          <p className="text-sm text-slate-500">
            No significant skill gaps found for this role. Your profile matches the requirements well!
          </p>
        </div>
      )}

      {!loading && gaps.length > 0 && (
        <div className="space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-xs text-red-500 font-medium mt-0.5">Critical</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{moderateCount}</div>
              <div className="text-xs text-amber-500 font-medium mt-0.5">Moderate</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{minorCount}</div>
              <div className="text-xs text-indigo-500 font-medium mt-0.5">Minor</div>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{gaps.length}</span> skill gap{gaps.length !== 1 ? 's' : ''} identified for{' '}
            <span className="font-semibold text-slate-700">{roles.find((r) => r.id === selectedRole)?.name ?? selectedRole}</span>
          </p>

          <div className="space-y-3">
            {gaps.map((gap) => {
              const { label, variant, barColor, bgColor } = gapConfig(gap.gap_score);
              return (
                <button
                  key={gap.esco_uri}
                  onClick={() => onSkillClick(gap.esco_uri)}
                  className="w-full text-left border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {gap.preferred_label}
                        </span>
                        <Badge variant={variant} dot>{label}</Badge>
                      </div>
                      {gap.rationale && (
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{gap.rationale}</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Comparison bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-12 text-right flex-shrink-0">You</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.round(gap.user_score * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-8 flex-shrink-0">
                        {Math.round(gap.user_score * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-12 text-right flex-shrink-0">Target</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(gap.target_weight * 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-8 flex-shrink-0">
                        {Math.round(gap.target_weight * 100)}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
