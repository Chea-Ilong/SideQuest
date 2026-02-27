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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">GitHub Profile</h3>
        <p className="text-sm text-slate-500 mb-4">
          We'll analyze your public repositories for languages, dependencies, and topics.
          Without a token, we analyze your 10 most recent repos.
        </p>
      </div>

      <Input
        label="GitHub Username"
        placeholder="octocat"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={error}
        required
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Personal Access Token{' '}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            {showToken ? 'Hide' : 'Why?'}
          </button>
        </div>

        {showToken && (
          <p className="text-xs text-slate-500 bg-slate-50 rounded p-2 border">
            GitHub limits unauthenticated requests to 60/hour. With a PAT (no special
            scopes needed for public repos), you get 5,000/hour and access to all repos.
            Your token is used only during this ingest and never stored.
          </p>
        )}

        <Input
          type="password"
          placeholder="ghp_xxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          hint="GitHub PAT — used only for this scan, never stored in database"
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Add GitHub Source
      </Button>
    </form>
  );
}
