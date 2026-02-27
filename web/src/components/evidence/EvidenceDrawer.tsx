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

const EVIDENCE_TYPE_COLORS: Record<string, 'info' | 'success' | 'warning' | 'default' | 'error'> = {
  repo_language: 'info',
  repo_topic: 'info',
  dependency: 'success',
  readme_snippet: 'default',
  resume_bullet: 'warning',
  manual_claim: 'default',
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-indigo-600"
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{Math.round(score * 100)}%</span>
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
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">
              {skill?.preferred_label ?? '...'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">{escoUri}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {!loading && skill && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Score summary */}
            <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-900">Skill Strength</span>
                <span className="text-2xl font-bold text-indigo-700">
                  {Math.round(skill.score * 100)}%
                </span>
              </div>
              <ScoreBar score={skill.score} />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="info">{skill.evidence_count} evidence item{skill.evidence_count !== 1 ? 's' : ''}</Badge>
                <Badge variant="default">{skill.normalization_method}</Badge>
                <Badge variant="default">{Math.round(skill.normalization_confidence * 100)}% confidence</Badge>
              </div>
            </div>

            {/* Evidence items */}
            {skill.evidence.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Evidence</h4>
                {skill.evidence.map((ev) => (
                  <div key={ev.id} className="border border-slate-200 rounded-lg p-3 space-y-2 hover:border-indigo-200">
                    <div className="flex items-center gap-2">
                      <Badge variant={EVIDENCE_TYPE_COLORS[ev.evidence_type] ?? 'default'}>
                        {EVIDENCE_TYPE_LABELS[ev.evidence_type] ?? ev.evidence_type}
                      </Badge>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                        <div
                          className="h-1.5 rounded-full bg-indigo-400"
                          style={{ width: `${Math.round(ev.strength * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{Math.round(ev.strength * 100)}%</span>
                    </div>
                    {ev.text_snippet && (
                      <p className="text-sm text-slate-700 bg-slate-50 rounded p-2 italic">
                        "{ev.text_snippet.slice(0, 200)}{ev.text_snippet.length > 200 ? '...' : ''}"
                      </p>
                    )}
                    {ev.ref && (
                      <p className="text-xs text-slate-500">
                        {(ev.ref as any).repo && `📦 ${(ev.ref as any).repo}`}
                        {(ev.ref as any).section && `📄 ${(ev.ref as any).section}`}
                        {(ev.ref as any).project && `🔧 ${(ev.ref as any).project}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {skill.evidence.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No detailed evidence available for this skill.
              </p>
            )}
          </div>
        )}

        {!loading && !skill && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Skill details not found</p>
          </div>
        )}

        <div className="p-4 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
