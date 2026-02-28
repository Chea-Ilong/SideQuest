import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllScans, removeShareToken } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { PageContainer } from '../components/layout/PageContainer.js';

export function ScanHistory() {
  const navigate = useNavigate();
  const [scans, setScans] = useState(() => getAllScans().reverse());

  function handleDelete(id: string) {
    if (!confirm('Remove this scan from history? (Only removes from browser — scan data is not deleted.)')) return;
    removeShareToken(id);
    setScans((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="min-h-screen pixel-grid-bg">
      <PageContainer maxWidth="2xl">
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-[Press_Start_2P,monospace] text-base text-[#f0f0f0]" style={{ textShadow: '2px 2px 0 #000000' }}>
                SCAN HISTORY
              </h1>
              <p className="font-[Silkscreen,monospace] text-xs text-[#555577] mt-1">
                Scans saved in your browser's local storage.
              </p>
            </div>
            <Link to="/scan/new">
              <Button variant="gradient" size="sm">+ New Scan</Button>
            </Link>
          </div>

          {scans.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-5xl">📋</div>
              <p className="font-[Silkscreen,monospace] text-sm text-[#888888] uppercase tracking-wider">No scans yet</p>
              <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">
                Start a new scan to see your Skill DNA profile.
              </p>
              <Link to="/scan/new">
                <Button variant="gradient" size="lg">▶ Start Your First Scan</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-[#12122a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000] p-4 flex items-center justify-between gap-4 hover:border-[#00d4ff] transition-all duration-75"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#4a3f8f] border-2 border-[#7b6fcf] flex items-center justify-center flex-shrink-0 text-lg">
                      🧬
                    </div>
                    <div className="min-w-0">
                      <p className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] uppercase tracking-wider">
                        Scan{' '}
                        <code className="font-[Silkscreen,monospace] text-xs bg-[#0a0a1a] border border-[#333355] px-1.5 py-0.5 text-[#555577]">
                          {scan.id.slice(0, 8)}...
                        </code>
                      </p>
                      <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-0.5 truncate">
                        Token: {scan.token.slice(0, 16)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/scan/${scan.id}/results?share_token=${scan.token}`)}
                    >
                      ▶ View
                    </Button>
                    <button
                      onClick={() => handleDelete(scan.id)}
                      className="p-2 font-[Silkscreen,monospace] text-xs text-[#555577] hover:text-[#ff2244] bg-[#0a0a1a] border-2 border-[#333355] hover:border-[#aa0022] transition-all duration-75 shadow-[1px_1px_0_#000000]"
                      title="Remove from history"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scans.length > 0 && (
            <p className="font-[Silkscreen,monospace] text-xs text-[#333355] text-center uppercase tracking-wider">
              {scans.length} scan{scans.length !== 1 ? 's' : ''} saved locally •{' '}
              Clearing browser data will remove these
            </p>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
