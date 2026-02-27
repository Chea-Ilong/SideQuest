import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import type { TimelinePoint } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

interface CareerTimelineProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Building your career timeline...</p>
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

  if (points.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">📅</div>
        <p className="text-slate-700 font-semibold">No timeline data available.</p>
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
      {/* Chart section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900">Skill Evolution Over Time</h3>
          <p className="text-sm text-slate-500 mt-0.5">Your top skills across time periods based on evidence timestamps.</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
              />
              {allSkills.map((skill, i) => (
                <Bar
                  key={skill}
                  dataKey={skill}
                  fill={COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Period Details</h4>
        {points.map((point, index) => (
          <div
            key={`${point.period_start}-${point.period_end}`}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Period header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                  {index + 1}
                </div>
                <span className="font-semibold text-slate-800 text-sm">
                  {point.period_start.slice(0, 7)} — {point.period_end.slice(0, 7)}
                </span>
              </div>
              <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {point.top_skills.length} skills
              </span>
            </div>

            {/* Skills */}
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {point.top_skills.map((skill) => (
                  <button
                    key={skill.esco_uri}
                    onClick={() => onSkillClick(skill.esco_uri)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-xl text-xs font-medium transition-all duration-150 group"
                  >
                    <span>{skill.preferred_label}</span>
                    <span className="text-indigo-400 font-semibold">{Math.round(skill.score * 100)}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
