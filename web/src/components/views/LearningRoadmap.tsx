import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { RoadmapItem } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import { Badge } from '../common/Badge.js';

interface LearningRoadmapProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', variant: 'error' as const, bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' },
  medium: { label: 'Medium Priority', variant: 'warning' as const, bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  low: { label: 'Low Priority', variant: 'default' as const, bg: 'bg-slate-50', border: 'border-slate-100', dot: 'bg-slate-400' },
};

function getPriorityConfig(priority: number) {
  if (priority <= 3) return PRIORITY_CONFIG.high;
  if (priority <= 6) return PRIORITY_CONFIG.medium;
  return PRIORITY_CONFIG.low;
}

export function LearningRoadmap({ scanId, onSkillClick }: LearningRoadmapProps) {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.views.roadmap(scanId)
      .then((r) => setItems(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Generating your roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🗺️</div>
        <p className="text-slate-700 font-semibold">No roadmap generated yet.</p>
        <p className="text-sm text-slate-400">Run a gap analysis first by selecting a target role in the Gaps tab.</p>
      </div>
    );
  }

  const totalHours = items.reduce((sum, item) => sum + (item.estimated_hours ?? 0), 0);
  const highPriorityCount = items.filter(i => i.priority <= 3).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-700">{items.length}</div>
          <div className="text-xs text-indigo-500 font-medium mt-0.5">Skills to Learn</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">~{totalHours}h</div>
          <div className="text-xs text-amber-500 font-medium mt-0.5">Estimated Time</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{highPriorityCount}</div>
          <div className="text-xs text-red-500 font-medium mt-0.5">High Priority</div>
        </div>
      </div>

      {/* Roadmap items */}
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expanded === item.id;
          const config = getPriorityConfig(item.priority);

          return (
            <div
              key={item.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                isExpanded ? `${config.border} shadow-md` : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`p-4 ${isExpanded ? config.bg : 'bg-white'}`}>
                <div className="flex items-start gap-4">
                  {/* Priority number */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                    item.priority <= 3 ? 'bg-red-100 text-red-700' :
                    item.priority <= 6 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.priority}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onSkillClick(item.esco_uri)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 text-left transition-colors leading-tight"
                      >
                        {item.title}
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.estimated_hours && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                            ~{item.estimated_hours}h
                          </span>
                        )}
                        <Badge variant={config.variant} dot size="md">P{item.priority}</Badge>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                        {isExpanded ? item.description : `${item.description.slice(0, 120)}${item.description.length > 120 ? '...' : ''}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Resources (expanded) */}
                {isExpanded && item.resources.length > 0 && (
                  <div className="mt-4 ml-13 pl-4 border-l-2 border-indigo-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Learning Resources</p>
                    {item.resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-indigo-600 hover:text-indigo-700 group"
                      >
                        <span className="text-base flex-shrink-0">
                          {r.type === 'video' ? '📹' : r.type === 'docs' ? '📚' : '🔍'}
                        </span>
                        <span className="group-hover:underline">{r.title}</span>
                        <svg className="w-3 h-3 text-indigo-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-3 ml-13 transition-colors"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {isExpanded ? 'Show less' : `Show resources${item.resources.length > 0 ? ` (${item.resources.length})` : ''}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
