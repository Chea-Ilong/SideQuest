import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveShareToken, uploadResume } from '../lib/api.js';
import { GitHubInput } from '../components/scan/GitHubInput.js';
import { ResumeUpload } from '../components/scan/ResumeUpload.js';
import { ManualInput } from '../components/scan/ManualInput.js';
import { Tabs } from '../components/common/Tabs.js';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PageContainer maxWidth="2xl">
        <div className="space-y-8">
          {/* Page header */}
          <div className="text-center pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-700 font-medium mb-4">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              New Analysis
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Build Your Skill DNA</h1>
            <p className="text-slate-500 max-w-md mx-auto">
              Add one or more sources, then run the analysis to generate your personalized Skill DNA profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input form */}
            <div className="md:col-span-2">
              <Card padding="none" className="overflow-hidden shadow-md">
                <div className="px-6 pt-5 border-b border-slate-100">
                  <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                  />
                </div>
                <div className="p-6">
                  {activeTab === 'github' && (
                    <GitHubInput onSubmit={handleGitHub} loading={isLoading} />
                  )}
                  {activeTab === 'resume' && (
                    <ResumeUpload onUpload={handleResume} loading={isLoading} />
                  )}
                  {activeTab === 'manual' && (
                    <ManualInput onSubmit={handleManual} loading={isLoading} />
                  )}
                </div>
              </Card>
            </div>

            {/* Status panel */}
            <div className="space-y-4">
              <Card padding="md" className="shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Sources Added</h3>
                  {addedSources.length > 0 && (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {addedSources.filter(s => s.status === 'done').length} ready
                    </span>
                  )}
                </div>

                {addedSources.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-sm text-slate-400">No sources added yet</p>
                    <p className="text-xs text-slate-300 mt-1">Add at least one source to begin</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addedSources.map((s, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm transition-colors ${
                        s.status === 'done' ? 'bg-emerald-50 border border-emerald-100' :
                        s.status === 'error' ? 'bg-red-50 border border-red-100' :
                        'bg-slate-50 border border-slate-100'
                      }`}>
                        <span className="text-base flex-shrink-0 mt-0.5">
                          {SOURCE_ICONS[s.type] ?? '📌'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 font-medium truncate">{s.label}</p>
                          {s.status === 'adding' && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Adding...
                            </p>
                          )}
                          {s.status === 'done' && <p className="text-xs text-emerald-600 mt-0.5">✓ Added successfully</p>}
                          {s.error && <p className="text-xs text-red-500 mt-0.5">{s.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {createError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <span className="flex-shrink-0">⚠️</span>
                  <p>{createError}</p>
                </div>
              )}

              <Button
                onClick={handleRunAnalysis}
                loading={running}
                disabled={!hasAnyDoneSource || isLoading}
                size="lg"
                variant="gradient"
                className="w-full shadow-md shadow-indigo-200"
              >
                {running ? 'Starting Analysis...' : 'Run Analysis →'}
              </Button>

              <div className="text-center space-y-1">
                <p className="text-xs text-slate-400">
                  ⏱ Analysis takes 30–120 seconds
                </p>
                <p className="text-xs text-slate-300">
                  depending on the number of sources
                </p>
              </div>

              {/* Tips */}
              <Card padding="sm" className="bg-indigo-50 border-indigo-100">
                <p className="text-xs font-semibold text-indigo-800 mb-2">💡 Tips for best results</p>
                <ul className="text-xs text-indigo-700 space-y-1">
                  <li>• Add GitHub + Resume for comprehensive analysis</li>
                  <li>• Use a GitHub PAT for more repos analyzed</li>
                  <li>• Manual input fills gaps not in other sources</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
