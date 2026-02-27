import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useScanStatus } from '../hooks/useScan.js';
import { ProgressTracker } from '../components/scan/ProgressTracker.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Card } from '../components/common/Card.js';
import { saveShareToken } from '../lib/api.js';

export function ScanProgress() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shareToken = searchParams.get('share_token') ?? '';

  // Save token if passed in URL
  useEffect(() => {
    if (id && shareToken) {
      saveShareToken(id, shareToken);
    }
  }, [id, shareToken]);

  const { status, progress, error } = useScanStatus(id ?? null);

  // Auto-redirect when done
  useEffect(() => {
    if (status === 'ready' && id) {
      setTimeout(() => {
        navigate(`/scan/${id}/results?share_token=${shareToken}`);
      }, 1500);
    }
  }, [status, id, shareToken, navigate]);

  if (!id) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PageContainer maxWidth="2xl">
        <div className="space-y-8 py-4">
          {/* Header */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
              status === 'ready' ? 'bg-emerald-100' :
              status === 'error' ? 'bg-red-100' :
              'bg-indigo-100'
            }`}>
              {status === 'ready' ? (
                <span className="text-3xl">✅</span>
              ) : status === 'error' ? (
                <span className="text-3xl">❌</span>
              ) : (
                <span className="text-3xl animate-pulse">🧬</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {status === 'ready' ? 'Analysis Complete!' :
               status === 'error' ? 'Analysis Failed' :
               'Analyzing Your Skills'}
            </h1>
            <p className="text-slate-500 max-w-md mx-auto">
              {status === 'ready' ? 'Your Skill DNA is ready. Redirecting you now...' :
               status === 'error' ? 'Something went wrong during analysis.' :
               'Please wait while we process your sources and build your Skill DNA profile.'}
            </p>
          </div>

          <Card padding="lg" variant="elevated" className="shadow-lg">
            <ProgressTracker status={status} progress={progress} error={error} />
          </Card>

          {status === 'ready' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to your Skill DNA...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-500">You can still view partial results that were generated.</p>
              <button
                onClick={() => navigate(`/scan/${id}/results?share_token=${shareToken}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                View Partial Results →
              </button>
            </div>
          )}

          {/* Info cards */}
          {status === 'running' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🔍', title: 'Extracting Skills', desc: 'Scanning your sources for skill mentions' },
                { icon: '🗂️', title: 'ESCO Mapping', desc: 'Normalizing to the EU skills taxonomy' },
                { icon: '📊', title: 'Scoring & Clustering', desc: 'Computing evidence strength and groupings' },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-sm font-medium text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
