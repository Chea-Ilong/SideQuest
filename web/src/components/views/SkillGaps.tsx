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

  useEffect(() => {
    api.views.targetRoles().then((r) => setRoles(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.views.gaps(scanId, selectedRole)
      .then((r) => setGaps(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId, selectedRole]);

  function gapConfig(score: number): { label: string; variant: 'error' | 'warning' | 'info'; barColor: string } {
    if (score > 0.6) return { label: 'Critical', variant: 'error', barColor: '#ff2244' };
    if (score > 0.3) return { label: 'Moderate', variant: 'warning', barColor: '#ffd700' };
    return { label: 'Minor', variant: 'info', barColor: '#00d4ff' };
  }

  const criticalCount = gaps.filter(g => g.gap_score > 0.6).length;
  const moderateCount = gaps.filter(g => g.gap_score > 0.3 && g.gap_score <= 0.6).length;
  const minorCount = gaps.filter(g => g.gap_score <= 0.3).length;

  return (
    <div className="space-y-5">
      {/* Role selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888] whitespace-nowrap">
          Target Role:
        </label>
        <div className="relative flex-1 min-w-48">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 font-[Silkscreen,monospace] text-xs uppercase tracking-wider bg-[#0a0a1a] text-[#c8c8c8] border-2 border-[#4a3f8f] shadow-[2px_2px_0_#000000] focus:outline-none focus:border-[#00d4ff] cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
            {roles.length === 0 && <option value="fullstack-eng">Fullstack Engineer</option>}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none font-[Silkscreen,monospace] text-xs text-[#555577]">
            ▼
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="lg" color="#ffd700" />
          <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">Analyzing gaps...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="font-[Silkscreen,monospace] text-xs text-[#ff2244]">▶ {error}</p>
        </div>
      )}

      {!loading && gaps.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">🎉</div>
          <p className="font-[Silkscreen,monospace] text-sm text-[#00ff88] uppercase tracking-wider">Great match!</p>
          <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">
            No significant skill gaps found for this role.
          </p>
          <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">
            Make sure ESCO data is imported and analysis has run.
          </p>
        </div>
      )}

      {!loading && gaps.length > 0 && (
        <div className="space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#330011] border-2 border-[#aa0022] shadow-[2px_2px_0_#000000] p-3 text-center">
              <div className="font-[Press_Start_2P,monospace] text-xl text-[#ff2244]">{criticalCount}</div>
              <div className="font-[Silkscreen,monospace] text-xs text-[#aa0022] uppercase tracking-wider mt-1">Critical</div>
            </div>
            <div className="bg-[#332200] border-2 border-[#aa7700] shadow-[2px_2px_0_#000000] p-3 text-center">
              <div className="font-[Press_Start_2P,monospace] text-xl text-[#ffd700]">{moderateCount}</div>
              <div className="font-[Silkscreen,monospace] text-xs text-[#aa7700] uppercase tracking-wider mt-1">Moderate</div>
            </div>
            <div className="bg-[#0a1a2a] border-2 border-[#0088aa] shadow-[2px_2px_0_#000000] p-3 text-center">
              <div className="font-[Press_Start_2P,monospace] text-xl text-[#00d4ff]">{minorCount}</div>
              <div className="font-[Silkscreen,monospace] text-xs text-[#0088aa] uppercase tracking-wider mt-1">Minor</div>
            </div>
          </div>

          <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">
            <span className="text-[#c8c8c8]">{gaps.length}</span> gap{gaps.length !== 1 ? 's' : ''} for{' '}
            <span className="text-[#00d4ff]">{roles.find((r) => r.id === selectedRole)?.name ?? selectedRole}</span>
          </p>

          <div className="space-y-3">
            {gaps.map((gap) => {
              const { label, variant, barColor } = gapConfig(gap.gap_score);
              return (
                <button
                  key={gap.esco_uri}
                  onClick={() => onSkillClick(gap.esco_uri)}
                  className="w-full text-left bg-[#12122a] border-2 border-[#333355] shadow-[2px_2px_0_#000000] p-4 hover:border-[#4a3f8f] transition-all duration-75 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] group-hover:text-[#f0f0f0] uppercase tracking-wider">
                          {gap.preferred_label}
                        </span>
                        <Badge variant={variant} dot>{label}</Badge>
                      </div>
                      {gap.rationale && (
                        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] mt-1 leading-relaxed">{gap.rationale}</p>
                      )}
                    </div>
                  </div>

                  {/* RPG stat comparison bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-[Silkscreen,monospace] text-xs text-[#555577] w-10 text-right flex-shrink-0">YOU</span>
                      <div className="flex-1 h-3 bg-[#0a0a1a] border border-[#333355]">
                        <div
                          className="h-full bg-[#4a3f8f]"
                          style={{ width: `${Math.round(gap.user_score * 100)}%` }}
                        />
                      </div>
                      <span className="font-[Silkscreen,monospace] text-xs text-[#888888] w-8 flex-shrink-0">
                        {Math.round(gap.user_score * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-[Silkscreen,monospace] text-xs text-[#555577] w-10 text-right flex-shrink-0">REQ</span>
                      <div className="flex-1 h-3 bg-[#0a0a1a] border border-[#333355]">
                        <div
                          className="h-full"
                          style={{ width: `${Math.round(gap.target_weight * 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="font-[Silkscreen,monospace] text-xs text-[#888888] w-8 flex-shrink-0">
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
