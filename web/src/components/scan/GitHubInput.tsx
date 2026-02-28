import React, { useState } from 'react';
import { Input } from '../common/Input.js';
import { Button } from '../common/Button.js';

interface GitHubInputProps {
  onSubmit: (username: string, token?: string) => Promise<void>;
  loading?: boolean;
}

export function GitHubInput({ onSubmit, loading }: GitHubInputProps) {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('GitHub username is required');
      return;
    }
    setError('');
    await onSubmit(username.trim(), token.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 p-3 bg-[#0a0a1a] border-2 border-[#333355]">
        <div className="w-10 h-10 bg-[#1a1a2e] border-2 border-[#555577] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#c8c8c8]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">GitHub Profile Analysis</h3>
          <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-0.5 leading-relaxed">
            Analyzes public repos for languages, dependencies, and topics.
          </p>
        </div>
      </div>

      <Input
        label="GitHub Username"
        placeholder="octocat"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={error}
        required
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">
            Personal Access Token{' '}
            <span className="text-[#333355]">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowTokenInfo(!showTokenInfo)}
            className="font-[Silkscreen,monospace] text-xs text-[#4a3f8f] hover:text-[#00d4ff] uppercase tracking-wider transition-colors duration-75"
          >
            {showTokenInfo ? '▲ Hide' : '▼ Why?'}
          </button>
        </div>

        {showTokenInfo && (
          <div className="flex items-start gap-2 font-[Silkscreen,monospace] text-xs text-[#555577] bg-[#0a1a2a] border-2 border-[#0088aa] p-3">
            <span className="flex-shrink-0 text-[#00d4ff]">ℹ</span>
            <p className="leading-relaxed">
              GitHub limits unauthenticated requests to 60/hour. With a PAT you get 5,000/hour and access to all repos.
              Your token is used only during this scan and never stored.
            </p>
          </div>
        )}

        <div className="relative">
          <Input
            type={showToken ? 'text' : 'password'}
            placeholder="ghp_xxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            hint="GitHub PAT — used only for this scan, never stored"
          />
          {token && (
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 font-[Silkscreen,monospace] text-xs text-[#555577] hover:text-[#888888] transition-colors duration-75"
            >
              {showToken ? 'HIDE' : 'SHOW'}
            </button>
          )}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" variant="gradient">
        ▶ Add GitHub Source
      </Button>
    </form>
  );
}
