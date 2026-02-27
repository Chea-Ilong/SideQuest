import type { ScanProgress } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';

interface ProgressTrackerProps {
  status: string;
  progress: ScanProgress;
  error?: string | null;
}

const PHASE_LABELS: Record<string, string> = {
  starting: 'Starting analysis...',
  waiting_for_sources: 'Waiting for data sources...',
  extracting_mentions: 'Extracting skill mentions...',
  normalizing: 'Normalizing to ESCO taxonomy...',
  scoring: 'Computing skill scores...',
  clustering: 'Clustering skills...',
  timeline: 'Building career timeline...',
  gaps: 'Analyzing skill gaps...',
  roadmap: 'Generating learning roadmap...',
  done: 'Analysis complete!',
  error: 'Analysis failed',
};

const PHASE_ICONS: Record<string, string> = {
  starting: '🚀',
  waiting_for_sources: '⏳',
  extracting_mentions: '🔍',
  normalizing: '🗂️',
  scoring: '📊',
  clustering: '🔮',
  timeline: '📅',
  gaps: '🎯',
  roadmap: '🗺️',
  done: '✅',
  error: '❌',
};

export function ProgressTracker({ status, progress, error }: ProgressTrackerProps) {
  const percent = progress.percent ?? 0;
  const phase = progress.phase ?? 'starting';
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const phaseIcon = PHASE_ICONS[phase] ?? '⚙️';
  const errors = progress.errors ?? [];
  const stepsCompleted = progress.steps_completed ?? [];

  const isDone = status === 'ready';
  const isError = status === 'error';
  const isRunning = status === 'running';

  const displayPercent = isDone ? 100 : percent;

  return (
    <div className="space-y-6">
      {/* Current phase */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
          isDone ? 'bg-emerald-100' :
          isError ? 'bg-red-100' :
          'bg-indigo-100'
        }`}>
          {isRunning ? (
            <div className="relative">
              <span className="text-xl">{phaseIcon}</span>
            </div>
          ) : (
            <span>{phaseIcon}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isRunning && <Spinner size="sm" />}
            <span className={`font-semibold ${isError ? 'text-red-700' : isDone ? 'text-emerald-700' : 'text-slate-800'}`}>
              {phaseLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
                  isError ? 'bg-red-500' :
                  isDone ? 'bg-emerald-500' :
                  'bg-gradient-to-r from-indigo-500 to-violet-500 progress-animated'
                }`}
                style={{ width: `${displayPercent}%` }}
              />
            </div>
            <span className={`text-sm font-semibold w-10 text-right flex-shrink-0 ${
              isError ? 'text-red-600' : isDone ? 'text-emerald-600' : 'text-indigo-600'
            }`}>
              {displayPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Completed steps */}
      {stepsCompleted.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Completed Steps</p>
          <div className="flex flex-wrap gap-2">
            {stepsCompleted.map((step) => (
              <span
                key={step}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {step.replace(/:.*/, '').replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Warnings</p>
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
          <span className="flex-shrink-0 mt-0.5">❌</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
