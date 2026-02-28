import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { ClusterView } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';

interface StrengthClustersProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
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
        <Spinner size="lg" color="#00d4ff" />
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">Loading clusters...</p>
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

  if (clusters.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">📊</div>
        <p className="font-[Silkscreen,monospace] text-sm text-[#888888] uppercase tracking-wider">No clusters yet</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">Run analysis to see your skill clusters.</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#222244]">Make sure ESCO data is imported.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">
          <span className="text-[#00d4ff]">{clusters.length}</span> skill clusters
        </p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">Click skill for evidence</p>
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
              className="bg-[#12122a] border-2 shadow-[4px_4px_0_#000000] overflow-hidden hover:shadow-[4px_4px_0_#000000] transition-all duration-75"
              style={{ borderColor: cluster.color }}
            >
              {/* Cluster header */}
              <div className="p-4 border-b-2" style={{ borderColor: `${cluster.color}44`, backgroundColor: `${cluster.color}11` }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 flex-shrink-0 mt-0.5 border-2"
                    style={{ backgroundColor: cluster.color, borderColor: cluster.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider leading-tight"
                      style={{ color: cluster.color }}
                    >
                      {cluster.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-[Silkscreen,monospace] text-xs text-[#555577]">{cluster.skills.length} skills</span>
                      <span className="font-[Silkscreen,monospace] text-xs" style={{ color: cluster.color }}>
                        avg {Math.round(avgScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="p-4 space-y-2.5">
                {topSkills.map((skill) => (
                  <button
                    key={skill.esco_uri}
                    onClick={() => onSkillClick(skill.esco_uri)}
                    className="w-full text-left space-y-1.5 hover:bg-[#1a1a2e] p-1.5 -mx-1.5 transition-colors duration-75 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] truncate group-hover:text-[#f0f0f0]">
                        {skill.preferred_label}
                      </span>
                      <span className="font-[Silkscreen,monospace] text-xs ml-2 flex-shrink-0" style={{ color: cluster.color }}>
                        {Math.round(skill.score * 100)}%
                      </span>
                    </div>
                    {/* HP-style bar */}
                    <div className="h-2 bg-[#0a0a1a] border border-[#333355]">
                      <div
                        className="h-full"
                        style={{ width: `${Math.round(skill.score * 100)}%`, backgroundColor: cluster.color }}
                      />
                    </div>
                  </button>
                ))}

                {restSkills.length > 0 && (
                  <>
                    {isExpanded && (
                      <div className="space-y-2.5 border-t-2 border-[#333355] pt-2.5">
                        {restSkills.map((skill) => (
                          <button
                            key={skill.esco_uri}
                            onClick={() => onSkillClick(skill.esco_uri)}
                            className="w-full text-left space-y-1.5 hover:bg-[#1a1a2e] p-1.5 -mx-1.5 transition-colors duration-75 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] truncate group-hover:text-[#f0f0f0]">
                                {skill.preferred_label}
                              </span>
                              <span className="font-[Silkscreen,monospace] text-xs ml-2 flex-shrink-0" style={{ color: cluster.color }}>
                                {Math.round(skill.score * 100)}%
                              </span>
                            </div>
                            <div className="h-2 bg-[#0a0a1a] border border-[#333355]">
                              <div className="h-full" style={{ width: `${Math.round(skill.score * 100)}%`, backgroundColor: cluster.color }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : cluster.id)}
                      className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider transition-colors duration-75"
                      style={{ color: cluster.color }}
                    >
                      {isExpanded ? '▲ Show less' : `▼ +${restSkills.length} more`}
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
