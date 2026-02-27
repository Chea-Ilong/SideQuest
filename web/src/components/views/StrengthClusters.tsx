import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { ClusterView } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';

interface StrengthClustersProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.round(score * 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-slate-400 w-7 text-right font-medium">{Math.round(score * 100)}%</span>
    </div>
  );
}

export function StrengthClusters({ scanId, onSkillClick }: StrengthClustersProps) {
  const [clusters, setClusters] = useState<ClusterView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.views.clusters(scanId)
      .then((r) => setClusters(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Loading clusters...</p>
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

  if (clusters.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">📊</div>
        <p className="text-slate-500 font-medium">No clusters computed yet.</p>
        <p className="text-sm text-slate-400">Run analysis to see your skill clusters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{clusters.length}</span> skill clusters identified
        </p>
        <p className="text-xs text-slate-400">Click any skill to see evidence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster) => {
          const isExpanded = expanded === cluster.id;
          const topSkills = cluster.skills.slice(0, 5);
          const restSkills = cluster.skills.slice(5);
          const avgScore = cluster.skills.reduce((sum, s) => sum + s.score, 0) / cluster.skills.length;

          return (
            <div
              key={cluster.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              {/* Cluster header with color accent */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: cluster.color }}
              />
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${cluster.color}20` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cluster.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{cluster.label}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{cluster.skills.length} skills</span>
                      <span className="text-slate-200">•</span>
                      <span className="text-xs font-medium" style={{ color: cluster.color }}>
                        avg {Math.round(avgScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top skills */}
                <div className="space-y-2.5">
                  {topSkills.map((skill) => (
                    <button
                      key={skill.esco_uri}
                      onClick={() => onSkillClick(skill.esco_uri)}
                      className="w-full text-left space-y-1.5 hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                          {skill.preferred_label}
                        </span>
                        <svg className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 ml-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <ScoreBar score={skill.score} color={cluster.color} />
                    </button>
                  ))}
                </div>

                {/* Expand/collapse */}
                {restSkills.length > 0 && (
                  <>
                    {isExpanded && (
                      <div className="space-y-2.5 border-t border-slate-100 pt-2.5">
                        {restSkills.map((skill) => (
                          <button
                            key={skill.esco_uri}
                            onClick={() => onSkillClick(skill.esco_uri)}
                            className="w-full text-left space-y-1.5 hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                                {skill.preferred_label}
                              </span>
                              <svg className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 ml-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            <ScoreBar score={skill.score} color={cluster.color} />
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : cluster.id)}
                      className="flex items-center gap-1 text-xs font-medium transition-colors"
                      style={{ color: cluster.color }}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      {isExpanded ? 'Show less' : `+${restSkills.length} more skills`}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
