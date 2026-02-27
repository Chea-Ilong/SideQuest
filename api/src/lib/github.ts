import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const GITHUB_API_BASE = 'https://api.github.com';

export interface RateLimitState {
  remaining: number;
  resetAt: number; // unix timestamp
  limit: number;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  pushed_at: string | null;
  topics?: string[];
  language: string | null;
  stargazers_count: number;
  fork: boolean;
}

let rateLimitState: RateLimitState = { remaining: 60, resetAt: 0, limit: 60 };

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const tok = token || config.github.defaultToken;
  if (tok) {
    headers['Authorization'] = `Bearer ${tok}`;
  }
  return headers;
}

function parseRateLimit(headers: Headers): void {
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const limit = headers.get('x-ratelimit-limit');
  if (remaining) rateLimitState.remaining = parseInt(remaining, 10);
  if (reset) rateLimitState.resetAt = parseInt(reset, 10) * 1000;
  if (limit) rateLimitState.limit = parseInt(limit, 10);
}

async function waitForRateLimit(): Promise<void> {
  if (rateLimitState.remaining <= 2) {
    const waitMs = Math.max(0, rateLimitState.resetAt - Date.now()) + 1000;
    logger.warn({ waitMs, resetAt: rateLimitState.resetAt }, 'GitHub rate limit low, waiting');
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

export async function githubGet<T>(path: string, token?: string): Promise<T> {
  await waitForRateLimit();

  const url = path.startsWith('http') ? path : `${GITHUB_API_BASE}${path}`;
  const response = await fetch(url, {
    headers: buildHeaders(token),
    signal: AbortSignal.timeout(15_000),
  });

  parseRateLimit(response.headers);

  if (response.status === 404) {
    throw new Error(`GitHub resource not found: ${path}`);
  }
  if (response.status === 403 || response.status === 429) {
    const msg = await response.text();
    throw new Error(`GitHub rate limited: ${msg}`);
  }
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} on ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getRateLimitState(): RateLimitState {
  return { ...rateLimitState };
}
