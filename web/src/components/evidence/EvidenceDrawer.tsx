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
  repo_topic: 'GitHub Topic',
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

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b';

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span className="text-lg font-bold text-slate-800">{pct}%</span>
    </div>
  );
}

export function EvidenceDrawer({ scanId, escoUri, onClose }: EvidenceDrawerProps) {
  const [skill, setSkill] = useState<SkillView | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!escoUri) return;
    setLoading(true);
    setSkill(null);

    api.views.skills(scanId)
      .then((r) => {
        const found = r.data.find((s) => s.esco_uri === escoUri) ?? null;
        setSkill(found);
      })
      .catch(() => setSkill(null))
      .finally(() => setLoading(false));
  }, [scanId, escoUri]);

  if (!escoUri) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-slate-900 text-lg leading-tight">
              {skill?.preferred_label ?? (loading ? '...' : 'Skill Details')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono truncate">{escoUri}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/80 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Spinner size="lg" />
              <p className="text-sm text-slate-400">Loading skill details...</p>
            </div>
          </div>
        )}

        {!loading && skill && (
          <div className="flex-1 overflow-y-auto">
            {/* Score summary */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-5">
                <ScoreRing score={skill.score} />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Skill Strength</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="info" size="md">
                      {skill.evidence_count} evidence item{skill.evidence_count !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="default" size="md">{skill.normalization_method}</Badge>
                    <Badge variant="success" size="md">
                      {Math.round(skill.normalization_confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence items */}
            <div className="p-5 space-y-4">
              {skill.evidence.length > 0 ? (
                <>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Evidence ({skill.evidence.length})
                  </h4>
                  <div className="space-y-3">
                    {skill.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{EVIDENCE_TYPE_ICONS[ev.evidence_type] ?? '📌'}</span>
                            <Badge variant={EVIDENCE_TYPE_COLORS[ev.evidence_type] ?? 'default'} size="md">
                              {EVIDENCE_TYPE_LABELS[ev.evidence_type] ?? ev.evidence_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-indigo-400"
                                style={{ width: `${Math.round(ev.strength * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 font-medium w-8 text-right">
                              {Math.round(ev.strength * 100)}%
                            </span>
                          </div>
                        </div>

                        {ev.text_snippet && (
                          <blockquote className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border-l-2 border-indigo-300 italic leading-relaxed">
                            "{ev.text_snippet.slice(0, 200)}{ev.text_snippet.length > 200 ? '...' : ''}"
                          </blockquote>
                        )}

                        {ev.ref && (
                          <div className="flex flex-wrap gap-2">
                            {(ev.ref as any).repo && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                📦 {(ev.ref as any).repo}
                              </span>
                            )}
                            {(ev.ref as any).section && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                📄 {(ev.ref as any).section}
                              </span>
                            )}
                            {(ev.ref as any).project && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
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
                  <p className="text-sm text-slate-500">No detailed evidence available for this skill.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !skill && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-3xl">😕</div>
              <p className="text-slate-500 text-sm">Skill details not found</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
