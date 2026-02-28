import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { SkillView } from '../../types/index.js';
import { Badge } from '../common/Badge.js';
import { Spinner } from '../common/Spinner.js';
import { Button } from '../common/Button.js';

interface EvidenceDrawerProps {
  scanId: string;
  escoUri: string | null;
  onClose: () => void;
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  repo_language: 'Language',
  repo_topic: 'Topic',
  dependency: 'Dependency',
  readme_snippet: 'README',
  resume_bullet: 'Resume',
  manual_claim: 'Manual',
};

const EVIDENCE_TYPE_ICONS: Record<string, string> = {
  repo_language: '💻',
  repo_topic: '🏷️',
  dependency: '📦',
  readme_snippet: '📝',
  resume_bullet: '📄',
  manual_claim: '✏️',
};

const EVIDENCE_TYPE_COLORS: Record<string, 'info' | 'success' | 'warning' | 'default' | 'error'> = {
  repo_language: 'info',
  repo_topic: 'info',
  dependency: 'success',
  readme_snippet: 'default',
  resume_bullet: 'warning',
  manual_claim: 'default',
};

export function EvidenceDrawer({ scanId, escoUri, onClose }: EvidenceDrawerProps) {
  const [skill, setSkill] = useState<SkillView | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!escoUri) return;
    setLoading(true);
    setSkill(null);

    api.views.skillEvidence(scanId, escoUri)
      .then((r) => setSkill(r.data))
      .catch(() => setSkill(null))
      .finally(() => setLoading(false));
  }, [scanId, escoUri]);

  if (!escoUri) return null;

  const scorePercent = skill ? Math.round(skill.score * 100) : 0;
  const scoreColor = scorePercent >= 70 ? '#00ff88' : scorePercent >= 40 ? '#00d4ff' : '#ffd700';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a1a] border-l-2 border-[#4a3f8f] shadow-[-4px_0_0_#000000] z-50 flex flex-col pixel-slide-right">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b-2 border-[#333355] bg-[#12122a]">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-[Silkscreen,monospace] text-sm uppercase tracking-wider text-[#00d4ff] leading-tight">
              {skill?.preferred_label ?? (loading ? '...' : 'Skill Details')}
            </h3>
            <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-1 truncate">{escoUri}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1a1a2e] border-2 border-[#333355] hover:border-[#ff2244] hover:text-[#ff2244] text-[#555577] transition-all duration-75 font-[Silkscreen,monospace] text-xs"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Spinner size="lg" color="#00d4ff" />
              <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">Loading...</p>
            </div>
          </div>
        )}

        {!loading && skill && (
          <div className="flex-1 overflow-y-auto">
            {/* Score summary */}
            <div className="p-4 border-b-2 border-[#333355]">
              <div className="flex items-center gap-4">
                {/* XP-style score display */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className="font-[Press_Start_2P,monospace] text-2xl"
                    style={{ color: scoreColor, textShadow: `0 0 12px ${scoreColor}` }}
                  >
                    {scorePercent}%
                  </div>
                  <div className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider mt-1">
                    Skill XP
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {/* XP bar */}
                  <div className="pixel-progress-track">
                    <div
                      className="pixel-progress-fill"
                      style={{
                        width: `${scorePercent}%`,
                        background: `repeating-linear-gradient(90deg, ${scoreColor}88 0px, ${scoreColor}88 8px, ${scoreColor} 8px, ${scoreColor} 16px)`,
                        boxShadow: `0 0 8px ${scoreColor}88`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="info" size="md">
                      {skill.evidence_count} evidence
                    </Badge>
                    <Badge variant="default" size="md">{skill.normalization_method}</Badge>
                    <Badge variant="success" size="md">
                      {Math.round(skill.normalization_confidence * 100)}% conf
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence items */}
            <div className="p-4 space-y-4">
              {skill.evidence.length > 0 ? (
                <>
                  <p className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#555577]">
                    Evidence ({skill.evidence.length})
                  </p>
                  <div className="space-y-3">
                    {skill.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="border-2 border-[#333355] bg-[#12122a] p-3 space-y-2 hover:border-[#4a3f8f] transition-all duration-75"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{EVIDENCE_TYPE_ICONS[ev.evidence_type] ?? '📌'}</span>
                            <Badge variant={EVIDENCE_TYPE_COLORS[ev.evidence_type] ?? 'default'} size="md">
                              {EVIDENCE_TYPE_LABELS[ev.evidence_type] ?? ev.evidence_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-[#0a0a1a] border border-[#333355]">
                              <div
                                className="h-full bg-[#4a3f8f]"
                                style={{ width: `${Math.round(ev.strength * 100)}%` }}
                              />
                            </div>
                            <span className="font-[Silkscreen,monospace] text-xs text-[#555577] w-8 text-right">
                              {Math.round(ev.strength * 100)}%
                            </span>
                          </div>
                        </div>

                        {ev.text_snippet && (
                          <div className="bg-[#0a0a1a] border-l-2 border-[#4a3f8f] p-2">
                            <p className="font-[Silkscreen,monospace] text-xs text-[#888888] leading-relaxed">
                              "{ev.text_snippet.slice(0, 200)}{ev.text_snippet.length > 200 ? '...' : ''}"
                            </p>
                          </div>
                        )}

                        {ev.ref && (
                          <div className="flex flex-wrap gap-1.5">
                            {(ev.ref as any).repo && (
                              <span className="font-[Silkscreen,monospace] text-xs text-[#555577] bg-[#0a0a1a] border border-[#333355] px-1.5 py-0.5">
                                📦 {(ev.ref as any).repo}
                              </span>
                            )}
                            {(ev.ref as any).section && (
                              <span className="font-[Silkscreen,monospace] text-xs text-[#555577] bg-[#0a0a1a] border border-[#333355] px-1.5 py-0.5">
                                📄 {(ev.ref as any).section}
                              </span>
                            )}
                            {(ev.ref as any).project && (
                              <span className="font-[Silkscreen,monospace] text-xs text-[#555577] bg-[#0a0a1a] border border-[#333355] px-1.5 py-0.5">
                                🔧 {(ev.ref as any).project}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <div className="text-3xl">🔍</div>
                  <p className="font-[Silkscreen,monospace] text-xs text-[#333355] uppercase tracking-wider">
                    No evidence available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !skill && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-3xl">😕</div>
              <p className="font-[Silkscreen,monospace] text-xs text-[#333355] uppercase tracking-wider">
                Skill not found
              </p>
            </div>
          </div>
        )}

        <div className="p-4 border-t-2 border-[#333355] bg-[#12122a]">
          <Button variant="secondary" onClick={onClose} className="w-full">
            ✕ Close
          </Button>
        </div>
      </div>
    </>
  );
}
