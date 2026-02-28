import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveShareToken, uploadResume } from '../lib/api.js';
import { GitHubInput } from '../components/scan/GitHubInput.js';
import { ResumeUpload } from '../components/scan/ResumeUpload.js';
import { ManualInput } from '../components/scan/ManualInput.js';
import { Tabs } from '../components/common/Tabs.js';
import { Button } from '../components/common/Button.js';
import { PageContainer } from '../components/layout/PageContainer.js';

type SourceStatus = 'pending' | 'adding' | 'done' | 'error';

interface AddedSource {
  type: string;
  label: string;
  status: SourceStatus;
  error?: string;
}

const SOURCE_ICONS: Record<string, string> = {
  github: '📦',
  resume: '📄',
  manual: '✏️',
};

export function ScanSetup() {
  const navigate = useNavigate();
  const [scanId, setScanId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('github');
  const [addedSources, setAddedSources] = useState<AddedSource[]>([]);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);
  const [createError, setCreateError] = useState('');

  async function ensureScanExists(): Promise<{ id: string; token: string }> {
    if (scanId && shareToken) return { id: scanId, token: shareToken };
    setCreating(true);
    try {
      const result = await api.scans.create();
      const { id, share_token } = result.data;
      saveShareToken(id, share_token);
      setScanId(id);
      setShareToken(share_token);
      return { id, token: share_token };
    } finally {
      setCreating(false);
    }
  }

  function updateSource(label: string, type: string, status: SourceStatus, error?: string) {
    setAddedSources((prev) => {
      const existing = prev.find((s) => s.label === label && s.type === type);
      if (existing) {
        return prev.map((s) => s.label === label && s.type === type ? { ...s, status, error } : s);
      }
      return [...prev, { type, label, status, error }];
    });
  }

  async function handleGitHub(username: string, token?: string) {
    const label = `GitHub: ${username}`;
    updateSource(label, 'github', 'adding');
    try {
      const { id } = await ensureScanExists();
      await api.scans.addGitHubSource(id, username, token);
      updateSource(label, 'github', 'done');
    } catch (err) {
      updateSource(label, 'github', 'error', err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleResume(file: File) {
    const label = `Resume: ${file.name}`;
    updateSource(label, 'resume', 'adding');
    try {
      const { id } = await ensureScanExists();
      await uploadResume(id, file);
      updateSource(label, 'resume', 'done');
    } catch (err) {
      updateSource(label, 'resume', 'error', err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleManual(data: any) {
    const label = `Manual (${data.skills.length} skills, ${data.roles.length} roles)`;
    updateSource(label, 'manual', 'adding');
    try {
      const { id } = await ensureScanExists();
      await api.scans.addManualSource(id, data);
      updateSource(label, 'manual', 'done');
    } catch (err) {
      updateSource(label, 'manual', 'error', err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleRunAnalysis() {
    if (!scanId) {
      setCreateError('Please add at least one source first');
      return;
    }
    setRunning(true);
    try {
      await api.scans.run(scanId);
      navigate(`/scan/${scanId}/progress?share_token=${shareToken}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to start analysis');
    } finally {
      setRunning(false);
    }
  }

  const hasAnyDoneSource = addedSources.some((s) => s.status === 'done');
  const isLoading = addedSources.some((s) => s.status === 'adding') || creating;

  const tabs = [
    { id: 'github', label: 'GitHub', icon: <span>📦</span> },
    { id: 'resume', label: 'Resume', icon: <span>📄</span> },
    { id: 'manual', label: 'Manual', icon: <span>✏️</span> },
  ];

  return (
    <div className="min-h-screen pixel-grid-bg">
      <PageContainer maxWidth="2xl">
        <div className="space-y-6 py-4">
          {/* Page header */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a1a2a] border-2 border-[#00d4ff] shadow-[2px_2px_0_#000000] text-xs font-[Silkscreen,monospace] uppercase tracking-wider text-[#00d4ff] mb-4">
              <span className="w-2 h-2 bg-[#00d4ff]" />
              New Analysis
            </div>
            <h1 className="font-[Press_Start_2P,monospace] text-xl text-[#f0f0f0] mb-2" style={{ textShadow: '2px 2px 0 #000000' }}>
              BUILD YOUR SKILL DNA
            </h1>
            <p className="font-[Silkscreen,monospace] text-xs text-[#555577] max-w-md mx-auto">
              Add one or more sources, then run the analysis to generate your Skill DNA profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Input form */}
            <div className="md:col-span-2">
              <div className="bg-[#12122a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000] overflow-hidden">
                <div className="px-5 pt-4 border-b-2 border-[#333355]">
                  <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>
                <div className="p-5">
                  {activeTab === 'github' && <GitHubInput onSubmit={handleGitHub} loading={isLoading} />}
                  {activeTab === 'resume' && <ResumeUpload onUpload={handleResume} loading={isLoading} />}
                  {activeTab === 'manual' && <ManualInput onSubmit={handleManual} loading={isLoading} />}
                </div>
              </div>
            </div>

            {/* Status panel */}
            <div className="space-y-4">
              <div className="bg-[#12122a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">
                    Sources Added
                  </h3>
                  {addedSources.length > 0 && (
                    <span className="font-[Silkscreen,monospace] text-xs text-[#00ff88] border border-[#00aa55] px-2 py-0.5">
                      {addedSources.filter(s => s.status === 'done').length} ready
                    </span>
                  )}
                </div>

                {addedSources.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">No sources added yet</p>
                    <p className="font-[Silkscreen,monospace] text-xs text-[#222244] mt-1">Add at least one to begin</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addedSources.map((s, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2 border text-xs ${
                        s.status === 'done' ? 'bg-[#003322] border-[#00aa55]' :
                        s.status === 'error' ? 'bg-[#330011] border-[#aa0022]' :
                        'bg-[#0a0a1a] border-[#333355]'
                      }`}>
                        <span className="flex-shrink-0 mt-0.5">{SOURCE_ICONS[s.type] ?? '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-[Silkscreen,monospace] text-[#c8c8c8] truncate">{s.label}</p>
                          {s.status === 'adding' && (
                            <p className="font-[Silkscreen,monospace] text-[#555577] text-xs mt-0.5">Loading...</p>
                          )}
                          {s.status === 'done' && <p className="font-[Silkscreen,monospace] text-[#00ff88] text-xs mt-0.5">✓ Added</p>}
                          {s.error && <p className="font-[Silkscreen,monospace] text-[#ff2244] text-xs mt-0.5">{s.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {createError && (
                <div className="flex items-start gap-2 font-[Silkscreen,monospace] text-xs text-[#ff2244] bg-[#330011] border-2 border-[#aa0022] shadow-[2px_2px_0_#000000] p-3">
                  <span>▶</span>
                  <p>{createError}</p>
                </div>
              )}

              <Button
                onClick={handleRunAnalysis}
                loading={running}
                disabled={!hasAnyDoneSource || isLoading}
                size="lg"
                variant="gradient"
                className="w-full"
              >
                {running ? 'Starting...' : '▶ Run Analysis'}
              </Button>

              <div className="text-center">
                <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">
                  ⏱ 30–120 seconds depending on sources
                </p>
              </div>

              {/* Tips */}
              <div className="bg-[#0a1a2a] border-2 border-[#0088aa] shadow-[2px_2px_0_#000000] p-3">
                <p className="font-[Silkscreen,monospace] text-xs text-[#00d4ff] mb-2 uppercase tracking-wider">
                  💡 Tips
                </p>
                <ul className="font-[Silkscreen,monospace] text-xs text-[#555577] space-y-1">
                  <li>▸ GitHub + Resume = best results</li>
                  <li>▸ Use PAT for more repos</li>
                  <li>▸ Manual fills gaps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
