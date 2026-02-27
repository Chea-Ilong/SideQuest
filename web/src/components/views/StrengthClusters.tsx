import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { ClusterView } from '../../types/index.js';
import { Card } from '../common/Card.js';
import { Spinner } from '../common/Spinner.js';

interface StrengthClustersProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${Math.round(score * 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-400 w-7 text-right">{Math.round(score * 100)}%</span>
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

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <p className="text-red-500 py-4">{error}</p>;
  if (clusters.length === 0) return <p className="text-slate-500 py-4 text-center">No clusters computed yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clusters.map((cluster) => {
        const isExpanded = expanded === cluster.id;
        const topSkills = cluster.skills.slice(0, 5);
        const restSkills = cluster.skills.slice(5);

        return (
          <Card key={cluster.id} padding="md" className="space-y-3">
            {/* Cluster header */}
            <div className="flex items-start gap-3">
              <div
                className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                style={{ backgroundColor: cluster.color }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm leading-tight">{cluster.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cluster.skills.length} skills</p>
              </div>
            </div>

            {/* Top skills */}
            <div className="space-y-2">
              {topSkills.map((skill) => (
                <button
                  key={skill.esco_uri}
                  onClick={() => onSkillClick(skill.esco_uri)}
                  className="w-full text-left space-y-1 hover:bg-slate-50 p-1 -mx-1 rounded transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 truncate">{skill.preferred_label}</span>
                  </div>
                  <ScoreBar score={skill.score} color={cluster.color} />
                </button>
              ))}
            </div>

            {/* Expand/collapse */}
            {restSkills.length > 0 && (
              <>
                {isExpanded && restSkills.map((skill) => (
                  <button
                    key={skill.esco_uri}
                    onClick={() => onSkillClick(skill.esco_uri)}
                    className="w-full text-left space-y-1 hover:bg-slate-50 p-1 -mx-1 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 truncate">{skill.preferred_label}</span>
                    </div>
                    <ScoreBar score={skill.score} color={cluster.color} />
                  </button>
                ))}
                <button
                  onClick={() => setExpanded(isExpanded ? null : cluster.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {isExpanded ? 'Show less' : `+${restSkills.length} more skills`}
                </button>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
