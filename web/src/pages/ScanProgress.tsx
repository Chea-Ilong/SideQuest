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
    <PageContainer maxWidth="2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analyzing Your Skills</h1>
          <p className="text-slate-500 mt-1">
            Please wait while we process your sources and build your Skill DNA.
          </p>
        </div>

        <Card padding="lg">
          <ProgressTracker status={status} progress={progress} error={error} />
        </Card>

        {status === 'ready' && (
          <div className="text-center text-sm text-emerald-600 font-medium">
            ✓ Analysis complete! Redirecting to your Skill DNA...
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <button
              onClick={() => navigate(`/scan/${id}/results?share_token=${shareToken}`)}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              View partial results →
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
