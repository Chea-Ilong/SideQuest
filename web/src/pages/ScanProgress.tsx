import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useScanStatus } from '../hooks/useScan.js';
import { ProgressTracker } from '../components/scan/ProgressTracker.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { saveShareToken } from '../lib/api.js';

export function ScanProgress() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shareToken = searchParams.get('share_token') ?? '';

  useEffect(() => {
    if (id && shareToken) {
      saveShareToken(id, shareToken);
    }
  }, [id, shareToken]);

  const { status, progress, error } = useScanStatus(id ?? null);

  useEffect(() => {
    if (status === 'ready' && id) {
      setTimeout(() => {
        navigate(`/scan/${id}/results?share_token=${shareToken}`);
      }, 1500);
    }
  }, [status, id, shareToken, navigate]);

  if (!id) return null;

  return (
    <div className="min-h-screen pixel-grid-bg">
      <PageContainer maxWidth="2xl">
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="text-center py-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 border-2 mb-6 text-3xl ${
              status === 'ready' ? 'bg-[#003322] border-[#00ff88]' :
              status === 'error' ? 'bg-[#330011] border-[#ff2244]' :
              'bg-[#0a1a2a] border-[#4a3f8f]'
            }`}>
              {status === 'ready' ? '✅' : status === 'error' ? '❌' : '🧬'}
            </div>
            <h1 className="font-[Press_Start_2P,monospace] text-lg text-[#f0f0f0] mb-2" style={{ textShadow: '2px 2px 0 #000000' }}>
              {status === 'ready' ? 'ANALYSIS COMPLETE' :
               status === 'error' ? 'ANALYSIS FAILED' :
               'ANALYZING SKILLS'}
            </h1>
            <p className="font-[Silkscreen,monospace] text-xs text-[#555577] max-w-md mx-auto">
              {status === 'ready' ? 'Your Skill DNA is ready. Redirecting...' :
               status === 'error' ? 'Something went wrong during analysis.' :
               'Please wait while we process your sources and build your Skill DNA profile.'}
            </p>
          </div>

          {/* Progress card */}
          <div className="bg-[#12122a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000] p-6">
            <ProgressTracker status={status} progress={progress} error={error} />
          </div>

          {status === 'ready' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#003322] border-2 border-[#00ff88] shadow-[2px_2px_0_#000000] font-[Silkscreen,monospace] text-xs text-[#00ff88]">
                <span className="pixel-pulse">▶</span>
                Redirecting to your Skill DNA...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">
                You can still view partial results that were generated.
              </p>
              <button
                onClick={() => navigate(`/scan/${id}/results?share_token=${shareToken}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4a3f8f] text-[#00d4ff] border-2 border-[#00d4ff] shadow-[2px_2px_0_#000000] font-[Silkscreen,monospace] text-xs uppercase tracking-wider hover:bg-[#5a4f9f] active:translate-y-[2px] active:shadow-none transition-all duration-75"
              >
                ▶ View Partial Results
              </button>
            </div>
          )}

          {/* Info cards */}
          {status === 'running' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '🔍', title: 'Extracting Skills', desc: 'Scanning sources for skill mentions' },
                { icon: '🗂️', title: 'ESCO Mapping', desc: 'Normalizing to EU skills taxonomy' },
                { icon: '📊', title: 'Scoring & Clustering', desc: 'Computing evidence strength' },
              ].map((item) => (
                <div key={item.title} className="bg-[#0a0a1a] border-2 border-[#333355] shadow-[2px_2px_0_#000000] p-3 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="font-[Silkscreen,monospace] text-xs text-[#888888] uppercase tracking-wider">{item.title}</p>
                  <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
