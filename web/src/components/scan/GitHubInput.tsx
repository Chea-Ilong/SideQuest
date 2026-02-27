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
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">GitHub Profile Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            We'll analyze your public repositories for languages, dependencies, and topics.
            Without a token, we analyze your 10 most recent repos.
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
          <label className="block text-sm font-medium text-slate-700">
            Personal Access Token{' '}
            <span className="text-slate-400 font-normal text-xs">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowTokenInfo(!showTokenInfo)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Why?
          </button>
        </div>

        {showTokenInfo && (
          <div className="flex items-start gap-2 text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <span className="flex-shrink-0 mt-0.5">💡</span>
            <p>
              GitHub limits unauthenticated requests to 60/hour. With a PAT (no special
              scopes needed for public repos), you get 5,000/hour and access to all repos.
              Your token is used only during this ingest and never stored.
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
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showToken ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" variant="gradient">
        Add GitHub Source
      </Button>
    </form>
  );
}
