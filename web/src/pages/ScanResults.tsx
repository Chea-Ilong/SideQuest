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
  { id: 'map', label: 'DNA Map', icon: <span>🧬</span> },
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
      <div className="min-h-screen pixel-grid-bg flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" color="#00d4ff" />
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">
          Loading Skill DNA...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pixel-grid-bg flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="font-[Silkscreen,monospace] text-sm text-[#ff2244]">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>◀ Back to Home</Button>
      </div>
    );
  }

  const statusVariant = scan?.status === 'ready' ? 'success' : scan?.status === 'error' ? 'error' : 'warning';

  return (
    <>
      <div className="min-h-screen pixel-grid-bg">
        <PageContainer maxWidth="7xl">
          <div className="space-y-5 py-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-[Press_Start_2P,monospace] text-base text-[#f0f0f0]" style={{ textShadow: '2px 2px 0 #000000' }}>
                    YOUR SKILL DNA
                  </h1>
                  {scan && (
                    <Badge variant={statusVariant} dot size="md">
                      {scan.status}
                    </Badge>
                  )}
                </div>
                <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">
                  Scan{' '}
                  <code className="font-[Silkscreen,monospace] text-xs bg-[#0a0a1a] border border-[#333355] px-1.5 py-0.5 text-[#555577]">
                    {id?.slice(0, 8)}...
                  </code>
                  {' '}•{' '}
                  {scan ? new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShare}
                >
                  {shareCopied ? '✓ Copied!' : '📋 Share'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  🗑 Delete
                </Button>
              </div>
            </div>

            {/* Status banners */}
            {scan?.status === 'running' && (
              <div className="bg-[#332200] border-2 border-[#aa7700] shadow-[2px_2px_0_#000000] p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#332200] border-2 border-[#ffd700] flex items-center justify-center flex-shrink-0">
                  <Spinner size="sm" color="#ffd700" />
                </div>
                <div className="flex-1">
                  <p className="font-[Silkscreen,monospace] text-xs text-[#ffd700] uppercase tracking-wider">Analysis in progress</p>
                  <p className="font-[Silkscreen,monospace] text-xs text-[#aa7700] mt-0.5">
                    {scan.progress?.phase ?? 'Processing'}... {scan.progress?.percent ?? 0}%
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
              <div className="bg-[#0a1a2a] border-2 border-[#0088aa] shadow-[2px_2px_0_#000000] p-4 flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">ℹ️</div>
                <div className="flex-1">
                  <p className="font-[Silkscreen,monospace] text-xs text-[#00d4ff] uppercase tracking-wider">Analysis not started</p>
                  <p className="font-[Silkscreen,monospace] text-xs text-[#555577] mt-0.5">Add sources and run analysis to see results.</p>
                </div>
                <Button size="sm" onClick={() => navigate(`/scan/new`)}>
                  Add Sources
                </Button>
              </div>
            )}

            {/* Tabs + Views */}
            <div className="bg-[#12122a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000] overflow-hidden">
              <div className="border-b-2 border-[#333355]">
                <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
              </div>
              <div className="p-5">
                {activeTab === 'map' && <SkillDNAMap scanId={id} onSkillClick={setSelectedSkill} />}
                {activeTab === 'clusters' && <StrengthClusters scanId={id} onSkillClick={setSelectedSkill} />}
                {activeTab === 'gaps' && <SkillGaps scanId={id} onSkillClick={setSelectedSkill} />}
                {activeTab === 'timeline' && <CareerTimeline scanId={id} onSkillClick={setSelectedSkill} />}
                {activeTab === 'roadmap' && <LearningRoadmap scanId={id} onSkillClick={setSelectedSkill} />}
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

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
