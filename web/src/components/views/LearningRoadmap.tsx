import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { RoadmapItem } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import { Badge } from '../common/Badge.js';

interface LearningRoadmapProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

function getPriorityConfig(priority: number) {
  if (priority <= 3) return { variant: 'error' as const, color: '#ff2244', bg: '#330011', border: '#aa0022', label: 'HIGH' };
  if (priority <= 6) return { variant: 'warning' as const, color: '#ffd700', bg: '#332200', border: '#aa7700', label: 'MED' };
  return { variant: 'default' as const, color: '#888888', bg: '#1a1a2e', border: '#333355', label: 'LOW' };
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
        <Spinner size="lg" color="#ffd700" />
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">Generating roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="font-[Silkscreen,monospace] text-xs text-[#ff2244]">▶ {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🗺️</div>
        <p className="font-[Silkscreen,monospace] text-sm text-[#888888] uppercase tracking-wider">No roadmap yet</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">Run gap analysis first by selecting a target role.</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">Make sure ESCO data is imported.</p>
      </div>
    );
  }

  const totalHours = items.reduce((sum, item) => sum + (item.estimated_hours ?? 0), 0);
  const highPriorityCount = items.filter(i => i.priority <= 3).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0a1a2a] border-2 border-[#0088aa] shadow-[2px_2px_0_#000000] p-3 text-center">
          <div className="font-[Press_Start_2P,monospace] text-xl text-[#00d4ff]">{items.length}</div>
          <div className="font-[Silkscreen,monospace] text-xs text-[#0088aa] uppercase tracking-wider mt-1">Quests</div>
        </div>
        <div className="bg-[#332200] border-2 border-[#aa7700] shadow-[2px_2px_0_#000000] p-3 text-center">
          <div className="font-[Press_Start_2P,monospace] text-xl text-[#ffd700]">~{totalHours}h</div>
          <div className="font-[Silkscreen,monospace] text-xs text-[#aa7700] uppercase tracking-wider mt-1">Est. Time</div>
        </div>
        <div className="bg-[#330011] border-2 border-[#aa0022] shadow-[2px_2px_0_#000000] p-3 text-center">
          <div className="font-[Press_Start_2P,monospace] text-xl text-[#ff2244]">{highPriorityCount}</div>
          <div className="font-[Silkscreen,monospace] text-xs text-[#aa0022] uppercase tracking-wider mt-1">Urgent</div>
        </div>
      </div>

      {/* Quest log */}
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expanded === item.id;
          const config = getPriorityConfig(item.priority);

          return (
            <div
              key={item.id}
              className="border-2 shadow-[2px_2px_0_#000000] overflow-hidden transition-all duration-75"
              style={{ borderColor: isExpanded ? config.color : '#333355', backgroundColor: isExpanded ? config.bg : '#12122a' }}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Priority badge */}
                  <div
                    className="flex-shrink-0 w-8 h-8 border-2 flex items-center justify-center font-[Press_Start_2P,monospace] text-xs"
                    style={{ backgroundColor: config.bg, borderColor: config.color, color: config.color }}
                  >
                    {item.priority}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onSkillClick(item.esco_uri)}
                        className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-left transition-colors duration-75 hover:text-[#00d4ff]"
                        style={{ color: isExpanded ? config.color : '#c8c8c8' }}
                      >
                        {item.title}
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.estimated_hours && (
                          <span className="font-[Silkscreen,monospace] text-xs text-[#555577] bg-[#0a0a1a] border border-[#333355] px-1.5 py-0.5">
                            ~{item.estimated_hours}h
                          </span>
                        )}
                        <Badge variant={config.variant} size="md">P{item.priority}</Badge>
                      </div>
                    </div>

                    {item.description && (
                      <p className="font-[Silkscreen,monospace] text-xs text-[#555577] mt-1.5 leading-relaxed">
                        {isExpanded ? item.description : `${item.description.slice(0, 120)}${item.description.length > 120 ? '...' : ''}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Resources (expanded) */}
                {isExpanded && item.resources.length > 0 && (
                  <div className="mt-4 ml-11 border-l-2 border-[#333355] pl-3 space-y-2">
                    <p className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#555577]">Resources</p>
                    {item.resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-[Silkscreen,monospace] text-xs text-[#00d4ff] hover:text-[#ffffff] transition-colors duration-75"
                      >
                        <span className="flex-shrink-0">
                          {r.type === 'video' ? '📹' : r.type === 'docs' ? '📚' : '🔍'}
                        </span>
                        <span className="hover:underline">{r.title}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider mt-3 ml-11 transition-colors duration-75"
                  style={{ color: config.color }}
                >
                  {isExpanded ? '▲ Collapse' : `▼ Resources${item.resources.length > 0 ? ` (${item.resources.length})` : ''}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
