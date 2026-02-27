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
    { id: 'github', label: 'GitHub', icon: '📦' },
    { id: 'resume', label: 'Resume', icon: '📄' },
    { id: 'manual', label: 'Manual', icon: '✏️' },
  ];

  return (
    <PageContainer maxWidth="2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Skill DNA Scan</h1>
          <p className="text-slate-500 mt-1">
            Add one or more sources, then run the analysis to generate your Skill DNA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input form */}
          <div className="md:col-span-2">
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 pt-4">
                <Tabs
                  tabs={tabs.map((t) => ({ ...t, label: `${t.icon} ${t.label}` }))}
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
            <Card padding="md">
              <h3 className="font-semibold text-slate-900 mb-3">Sources Added</h3>
              {addedSources.length === 0 ? (
                <p className="text-sm text-slate-400">No sources added yet</p>
              ) : (
                <div className="space-y-2">
                  {addedSources.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span>
                        {s.status === 'done' && '✅'}
                        {s.status === 'adding' && '⏳'}
                        {s.status === 'error' && '❌'}
                      </span>
                      <div>
                        <p className="text-slate-700">{s.label}</p>
                        {s.error && <p className="text-xs text-red-500">{s.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {createError}
              </p>
            )}

            <Button
              onClick={handleRunAnalysis}
              loading={running}
              disabled={!hasAnyDoneSource || isLoading}
              size="lg"
              className="w-full"
            >
              Run Analysis →
            </Button>

            <p className="text-xs text-slate-400 text-center">
              Analysis takes 30–120 seconds depending on the number of sources.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
