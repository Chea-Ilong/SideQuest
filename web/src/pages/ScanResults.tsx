import { useState, useEffect } from 'react';
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
  { id: 'map', label: 'Skill DNA Map' },
  { id: 'clusters', label: 'Clusters' },
  { id: 'gaps', label: 'Gaps' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'roadmap', label: 'Roadmap' },
];

export function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shareToken = searchParams.get('share_token') ?? '';

  const [activeTab, setActiveTab] = useState('map');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Save token
  useEffect(() => {
    if (id && shareToken) {
      saveShareToken(id, shareToken);
    }
  }, [id, shareToken]);

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

  if (!id) return null;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-24 space-y-4">
          <p className="text-red-500">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </PageContainer>
    );
  }

  const statusColor = scan?.status === 'ready' ? 'success' : scan?.status === 'error' ? 'error' : 'warning';

  return (
    <>
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Your Skill DNA</h1>
                {scan && (
                  <Badge variant={statusColor}>
                    {scan.status}
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Scan ID: <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{id}</code>
                {' '}•{' '}
                Created {scan ? new Date(scan.created_at).toLocaleDateString() : '...'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/scan/${id}/results?share_token=${shareToken}`;
                  navigator.clipboard.writeText(url);
                  alert('Share link copied!');
                }}
              >
                Share
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

          {/* Status warning if not ready */}
          {scan?.status === 'running' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <Spinner size="sm" />
              <div>
                <p className="font-medium text-amber-900">Analysis in progress</p>
                <p className="text-sm text-amber-700">
                  {scan.progress?.phase ?? 'Processing'}... {scan.progress?.percent ?? 0}%
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/scan/${id}/progress?share_token=${shareToken}`)}
                className="ml-auto"
              >
                View Progress
              </Button>
            </div>
          )}

          {scan?.status === 'new' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 font-medium">Analysis not started</p>
              <p className="text-sm text-blue-600 mt-1">Add sources and run analysis to see results.</p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => navigate(`/scan/new`)}
              >
                Add Sources
              </Button>
            </div>
          )}

          {/* Tabs + Views */}
          <div>
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
            <div className="mt-6">
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
