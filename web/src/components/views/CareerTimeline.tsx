import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { TimelinePoint } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface CareerTimelineProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export function CareerTimeline({ scanId, onSkillClick }: CareerTimelineProps) {
  const [points, setPoints] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.views.timeline(scanId)
      .then((r) => setPoints(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <p className="text-red-500 py-4">{error}</p>;
  if (points.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-2xl">📅</p>
        <p className="text-slate-500">No timeline data available.</p>
        <p className="text-sm text-slate-400">Timeline requires timestamped evidence (GitHub commits, resume dates).</p>
      </div>
    );
  }

  // Build chart data
  const allSkills = [...new Set(points.flatMap((p) => p.top_skills.map((s) => s.preferred_label)))].slice(0, 5);

  const chartData = points.map((p) => {
    const entry: Record<string, unknown> = {
      period: `${p.period_start.slice(0, 7)}`,
    };
    for (const skill of allSkills) {
      const s = p.top_skills.find((ts) => ts.preferred_label === skill);
      entry[skill] = s ? Math.round(s.score * 100) : 0;
    }
    return entry;
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Skill Evolution Over Time</h3>
        <p className="text-sm text-slate-500">Showing your top skills across time periods based on evidence timestamps.</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(value) => [`${value}%`]} />
            <Legend />
            {allSkills.map((skill, i) => (
              <Bar key={skill} dataKey={skill} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Period breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Period Details</h4>
        {points.map((point) => (
          <div key={`${point.period_start}-${point.period_end}`} className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-slate-900">
                {point.period_start.slice(0, 7)} — {point.period_end.slice(0, 7)}
              </span>
              <span className="text-sm text-slate-500">{point.top_skills.length} skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {point.top_skills.map((skill) => (
                <button
                  key={skill.esco_uri}
                  onClick={() => onSkillClick(skill.esco_uri)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs transition-colors"
                >
                  <span>{skill.preferred_label}</span>
                  <span className="text-indigo-500">{Math.round(skill.score * 100)}%</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
