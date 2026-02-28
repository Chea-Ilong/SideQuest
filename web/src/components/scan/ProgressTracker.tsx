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
  const subMessage = progress.message;

  const isDone = status === 'ready';
  const isError = status === 'error';
  const isRunning = status === 'running';

  const displayPercent = isDone ? 100 : percent;

  return (
    <div className="space-y-5">
      {/* Current phase */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 border-2 flex items-center justify-center text-2xl flex-shrink-0 ${
          isDone ? 'bg-[#003322] border-[#00ff88]' :
          isError ? 'bg-[#330011] border-[#ff2244]' :
          'bg-[#0a1a2a] border-[#4a3f8f]'
        }`}>
          {isRunning ? (
            <Spinner size="sm" color="#00d4ff" />
          ) : (
            <span>{phaseIcon}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-[Silkscreen,monospace] text-sm uppercase tracking-wider ${
              isError ? 'text-[#ff2244]' : isDone ? 'text-[#00ff88]' : 'text-[#c8c8c8]'
            }`}>
              {phaseLabel}
            </span>
          </div>
          {subMessage && isRunning && (
            <p className="font-[Silkscreen,monospace] text-xs text-[#555577] mb-1">{subMessage}</p>
          )}

          {/* Pixel progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 pixel-progress-track">
              <div
                className={`pixel-progress-fill ${isDone ? 'pixel-progress-fill-green' : isError ? 'pixel-progress-fill-red' : ''}`}
                style={{ width: `${displayPercent}%` }}
              />
            </div>
            <span className={`font-[Press_Start_2P,monospace] text-xs w-10 text-right flex-shrink-0 ${
              isError ? 'text-[#ff2244]' : isDone ? 'text-[#00ff88]' : 'text-[#00d4ff]'
            }`}>
              {displayPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Completed steps */}
      {stepsCompleted.length > 0 && (
        <div>
          <p className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#555577] mb-2">
            Completed Steps
          </p>
          <div className="flex flex-wrap gap-2">
            {stepsCompleted.map((step) => (
              <span
                key={step}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#003322] border border-[#00aa55] font-[Silkscreen,monospace] text-xs text-[#00ff88] shadow-[1px_1px_0_#000000]"
              >
                ✓ {step.replace(/:.*/, '').replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#555577]">Warnings</p>
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 font-[Silkscreen,monospace] text-xs text-[#ffd700] bg-[#332200] border border-[#aa7700] p-2">
              <span className="flex-shrink-0">⚠</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 font-[Silkscreen,monospace] text-xs text-[#ff2244] bg-[#330011] border-2 border-[#aa0022] p-3">
          <span className="flex-shrink-0">✗</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
