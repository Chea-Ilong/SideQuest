import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useScan } from '../hooks/useScan.js';
import { saveShareToken, api } from '../lib/api.js';
import { Tabs } from '../components/common/Tabs.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Spinner } from '../components/common/Spinner.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { EvidenceDrawer } from '../components/evidence/EvidenceDrawer.js';
import { SkillDNAMap } from '../components/views/SkillDNAMap.js';
import { StrengthClusters } from '../components/views/StrengthClusters.js';
import { SkillGaps } from '../components/views/SkillGaps.js';
import { CareerTimeline } from '../components/views/CareerTimeline.js';
import { LearningRoadmap } from '../components/views/LearningRoadmap.js';

const TABS = [
  { id: 'map', label: 'Skill Map', icon: <span>🧬</span> },
  { id: 'clusters', label: 'Clusters', icon: <span>📊</span> },
  { id: 'gaps', label: 'Gaps', icon: <span>🎯</span> },
  { id: 'timeline', label: 'Timeline', icon: <span>📅</span> },
  { id: 'roadmap', label: 'Roadmap', icon: <span>🗺️</span> },
];

export function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shareToken = searchParams.get('share_token') ?? '';

  // Save token synchronously before any child renders fetch data
  if (id && shareToken) {
    saveShareToken(id, shareToken);
  }

  const [activeTab, setActiveTab] = useState('map');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { scan, loading, error } = useScan(id ?? null);

  async function handleDelete() {
    if (!id || !confirm('Delete this scan and all data? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.scans.delete(id);
      navigate('/');
    } catch {
      setDeleting(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/scan/${id}/results?share_token=${shareToken}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  if (!id) return null;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-slate-500 text-sm">Loading your Skill DNA...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-32 space-y-4">
          <div className="text-5xl">😕</div>
          <p className="text-red-500 font-medium">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </PageContainer>
    );
  }

  const statusVariant = scan?.status === 'ready' ? 'success' : scan?.status === 'error' ? 'error' : 'warning';

  return (
    <>
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">Your Skill DNA</h1>
                {scan && (
                  <Badge variant={statusVariant} dot size="md">
                    {scan.status}
                  </Badge>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                Scan{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">{id?.slice(0, 8)}...</code>
                {' '}•{' '}
                {scan ? new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                icon={
                  shareCopied ? (
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )
                }
              >
                {shareCopied ? 'Copied!' : 'Share'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Status banners */}
          {scan?.status === 'running' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Spinner size="sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900 text-sm">Analysis in progress</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {scan.progress?.phase ?? 'Processing'}... {scan.progress?.percent ?? 0}% complete
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/scan/${id}/progress?share_token=${shareToken}`)}
              >
                View Progress
              </Button>
            </div>
          )}

          {scan?.status === 'new' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-lg">
                ℹ️
              </div>
              <div className="flex-1">
                <p className="text-blue-800 font-medium text-sm">Analysis not started</p>
                <p className="text-xs text-blue-600 mt-0.5">Add sources and run analysis to see results.</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/scan/new`)}
              >
                Add Sources
              </Button>
            </div>
          )}

          {/* Tabs + Views */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100">
              <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
            </div>
            <div className="p-6">
              {activeTab === 'map' && (
                <SkillDNAMap scanId={id} onSkillClick={setSelectedSkill} />
              )}
              {activeTab === 'clusters' && (
                <StrengthClusters scanId={id} onSkillClick={setSelectedSkill} />
              )}
              {activeTab === 'gaps' && (
                <SkillGaps scanId={id} onSkillClick={setSelectedSkill} />
              )}
              {activeTab === 'timeline' && (
                <CareerTimeline scanId={id} onSkillClick={setSelectedSkill} />
              )}
              {activeTab === 'roadmap' && (
                <LearningRoadmap scanId={id} onSkillClick={setSelectedSkill} />
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Evidence Drawer */}
      {selectedSkill && (
        <EvidenceDrawer
          scanId={id}
          escoUri={selectedSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </>
  );
}
