import type { ScanProgress } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import { Badge } from '../common/Badge.js';

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

export function ProgressTracker({ status, progress, error }: ProgressTrackerProps) {
  const percent = progress.percent ?? 0;
  const phase = progress.phase ?? 'starting';
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const errors = progress.errors ?? [];
  const stepsCompleted = progress.steps_completed ?? [];

  const isDone = status === 'ready';
  const isError = status === 'error';
  const isRunning = status === 'running';

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isRunning && <Spinner size="sm" />}
            {isDone && <span className="text-emerald-600 font-medium">✓</span>}
            {isError && <span className="text-red-600">✗</span>}
            <span className={`font-medium ${isError ? 'text-red-600' : isDone ? 'text-emerald-600' : 'text-slate-700'}`}>
              {phaseLabel}
            </span>
          </div>
          <span className="text-slate-500">{percent}%</span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isError ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${isDone ? 100 : percent}%` }}
          />
        </div>
      </div>

      {/* Completed steps */}
      {stepsCompleted.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stepsCompleted.map((step) => (
            <Badge key={step} variant="success">
              ✓ {step.replace(/:.*/, '').replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠ {err}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}
    </div>
  );
}
