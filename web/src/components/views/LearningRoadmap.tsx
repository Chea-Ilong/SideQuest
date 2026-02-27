import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { RoadmapItem } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import { Badge } from '../common/Badge.js';
import { Card } from '../common/Card.js';

interface LearningRoadmapProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
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

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <p className="text-red-500 py-4">{error}</p>;
  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-2xl">🗺️</p>
        <p className="text-slate-500">No roadmap generated yet.</p>
        <p className="text-sm text-slate-400">Run a gap analysis first by selecting a target role.</p>
      </div>
    );
  }

  const totalHours = items.reduce((sum, item) => sum + (item.estimated_hours ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Learning Roadmap</h3>
          <p className="text-sm text-slate-500">
            {items.length} skills to develop • ~{totalHours} hours estimated
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expanded === item.id;
          const priorityColor = item.priority <= 3 ? 'error' : item.priority <= 6 ? 'warning' : 'default';

          return (
            <Card key={item.id} padding="md" className="space-y-3">
              <div className="flex items-start gap-3">
                {/* Priority badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {item.priority}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => onSkillClick(item.esco_uri)}
                      className="font-semibold text-slate-900 hover:text-indigo-600 text-left transition-colors"
                    >
                      {item.title}
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.estimated_hours && (
                        <span className="text-xs text-slate-500">~{item.estimated_hours}h</span>
                      )}
                      <Badge variant={priorityColor}>P{item.priority}</Badge>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {isExpanded ? item.description : `${item.description.slice(0, 120)}${item.description.length > 120 ? '...' : ''}`}
                    </p>
                  )}

                  {/* Resources */}
                  {isExpanded && item.resources.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Resources</p>
                      {item.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <span>{r.type === 'video' ? '📹' : r.type === 'docs' ? '📚' : '🔍'}</span>
                          {r.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-11"
              >
                {isExpanded ? 'Show less' : 'Show resources'}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
