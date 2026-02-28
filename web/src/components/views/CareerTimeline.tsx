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

// 8-bit color palette
const COLORS = ['#00d4ff', '#ffd700', '#00ff88', '#ff2244', '#bf7fff'];

function PixelTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a1a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000] p-3">
      <p className="font-[Silkscreen,monospace] text-xs text-[#888888] uppercase tracking-wider mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: entry.fill }} />
          <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8]">{entry.name}:</span>
          <span className="font-[Silkscreen,monospace] text-xs" style={{ color: entry.fill }}>{entry.value}%</span>
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
        <Spinner size="lg" color="#00d4ff" />
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">Building timeline...</p>
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

  if (points.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">📅</div>
        <p className="font-[Silkscreen,monospace] text-sm text-[#888888] uppercase tracking-wider">No timeline data</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">Timeline requires timestamped evidence.</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">(GitHub commits, resume dates)</p>
      </div>
    );
  }

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
      {/* Chart */}
      <div className="bg-[#0a0a1a] border-2 border-[#333355] shadow-[4px_4px_0_#000000] p-4">
        <div className="mb-4">
          <h3 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">
            Skill Evolution Over Time
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#1a1a2e" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 9, fill: '#555577', fontFamily: 'Silkscreen, monospace' }}
                axisLine={{ stroke: '#333355' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#555577', fontFamily: 'Silkscreen, monospace' }}
                unit="%"
                axisLine={{ stroke: '#333355' }}
                tickLine={false}
              />
              <Tooltip content={<PixelTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontFamily: 'Silkscreen, monospace', paddingTop: '12px' }}
                formatter={(value) => <span style={{ color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{value}</span>}
              />
              {allSkills.map((skill, i) => (
                <Bar
                  key={skill}
                  dataKey={skill}
                  fill={COLORS[i % COLORS.length]}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="space-y-3">
        <h4 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#555577]">Period Details</h4>
        {points.map((point, index) => (
          <div
            key={`${point.period_start}-${point.period_end}`}
            className="bg-[#12122a] border-2 border-[#333355] shadow-[2px_2px_0_#000000] overflow-hidden"
          >
            {/* Period header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a1a] border-b-2 border-[#333355]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-[#4a3f8f] border-2 border-[#7b6fcf] flex items-center justify-center font-[Press_Start_2P,monospace] text-xs text-[#00d4ff]">
                  {index + 1}
                </div>
                <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] uppercase tracking-wider">
                  {point.period_start.slice(0, 7)} — {point.period_end.slice(0, 7)}
                </span>
              </div>
              <span className="font-[Silkscreen,monospace] text-xs text-[#555577] bg-[#0a0a1a] border border-[#333355] px-2 py-0.5">
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
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#0a1a2a] border-2 border-[#0088aa] hover:border-[#00d4ff] hover:bg-[#0a2a3a] font-[Silkscreen,monospace] text-xs text-[#00d4ff] transition-all duration-75 shadow-[1px_1px_0_#000000]"
                  >
                    <span>{skill.preferred_label}</span>
                    <span className="text-[#555577]">{Math.round(skill.score * 100)}%</span>
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
