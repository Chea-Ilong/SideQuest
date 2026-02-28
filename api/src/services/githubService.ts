import { supabase } from '../lib/supabase.js';
import { githubGet, type GitHubRepo } from '../lib/github.js';
import { getSkillsForDep } from '../utils/depSkillMap.js';
import { logger } from '../utils/logger.js';
import type { EvidenceType } from '../types/index.js';

/**
 * Retry a function with exponential backoff.
 * Retries on any error except 404 (not found) and 403 (forbidden/rate limit exceeded).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Don't retry on 404 (resource doesn't exist) or 403 (auth/rate limit)
      const status = (err as any)?.status ?? (err as any)?.response?.status;
      if (status === 404 || status === 403) throw err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// GitHub language → skill name mapping
const LANGUAGE_SKILL_MAP: Record<string, string[]> = {
  JavaScript: ['JavaScript'],
  TypeScript: ['TypeScript', 'JavaScript'],
  Python: ['Python'],
  Java: ['Java'],
  Go: ['Go'],
  Rust: ['Rust'],
  'C#': ['C#'],
  'C++': ['C++'],
  C: ['C'],
  Ruby: ['Ruby'],
  PHP: ['PHP'],
  Swift: ['Swift'],
  Kotlin: ['Kotlin'],
  Scala: ['Scala'],
  Dart: ['Dart'],
  Shell: ['Bash', 'scripting'],
  Dockerfile: ['Docker'],
  'HTML': ['HTML'],
  CSS: ['CSS'],
  SQL: ['SQL'],
  R: ['R'],
  MATLAB: ['MATLAB'],
};

interface ParsedDependencies {
  [key: string]: string;
}

function parsePackageJson(content: string): string[] {
  try {
    const pkg = JSON.parse(content) as { dependencies?: ParsedDependencies; devDependencies?: ParsedDependencies };
    return [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim().split(/[>=<![\s]/)[0]!.toLowerCase())
    .filter((name) => name && !name.startsWith('#'));
}

function parseGoMod(content: string): string[] {
  const deps: string[] = [];
  const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
  if (requireBlock) {
    const lines = requireBlock[1]!.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^([\w./-]+)/);
      if (match) deps.push(match[1]!.split('/').pop()!);
    }
  }
  return deps;
}

function parseCargoToml(content: string): string[] {
  const deps: string[] = [];
  const depSection = content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
  if (depSection) {
    const lines = depSection[1]!.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^([\w-]+)\s*=/);
      if (match) deps.push(match[1]!);
    }
  }
  return deps;
}

async function fetchDependencies(
  owner: string,
  repo: string,
  token?: string
): Promise<{ name: string; file: string }[]> {
  const manifests = [
    { path: 'package.json', parser: parsePackageJson },
    { path: 'requirements.txt', parser: parseRequirementsTxt },
    { path: 'go.mod', parser: parseGoMod },
    { path: 'Cargo.toml', parser: parseCargoToml },
  ];

  const deps: { name: string; file: string }[] = [];

  for (const { path, parser } of manifests) {
    try {
      const data = await githubGet<{ content: string; encoding: string }>(
        `/repos/${owner}/${repo}/contents/${path}`,
        token
      );
      const content =
        data.encoding === 'base64'
          ? Buffer.from(data.content, 'base64').toString('utf-8')
          : data.content;
      const names = parser(content);
      deps.push(...names.map((name) => ({ name, file: path })));
    } catch {
      // file doesn't exist in this repo — normal
    }
  }

  return deps;
}

export async function ingestGitHub(
  sourceId: string,
  scanId: string,
  username: string,
  token?: string
): Promise<void> {
  logger.info({ scanId, username }, 'GitHub ingest started');

  // Update source status to processing
  await supabase
    .schema('app')
    .from('sources')
    .update({ status: 'processing' })
    .eq('id', sourceId);

  try {
    // Fetch repositories
    const repos = await githubGet<GitHubRepo[]>(
      `/users/${username}/repos?sort=pushed&per_page=${token ? '100' : '10'}`,
      token
    );

    // Filter out forks for MVP (signal is weaker)
    const ownRepos = repos.filter((r) => !r.fork).slice(0, token ? 50 : 10);
    logger.info({ scanId, repoCount: ownRepos.length }, 'Fetched repos');

    const evidenceItems: Array<{
      scan_id: string;
      source_id: string;
      evidence_type: EvidenceType;
      ref: Record<string, unknown>;
      text_snippet: string;
      timestamp?: string;
      strength: number;
    }> = [];

    for (const repo of ownRepos) {
      const owner = repo.full_name.split('/')[0]!;

      // Languages (with retry)
      try {
        const languages = await withRetry(() =>
          githubGet<Record<string, number>>(`/repos/${owner}/${repo.name}/languages`, token)
        );
        for (const [lang, bytes] of Object.entries(languages)) {
          const strength = Math.min(1, Math.log10(bytes + 1) / 7);
          evidenceItems.push({
            scan_id: scanId,
            source_id: sourceId,
            evidence_type: 'repo_language',
            ref: { repo: repo.full_name, language: lang, bytes },
            text_snippet: lang,
            timestamp: repo.pushed_at ?? undefined,
            strength: Math.round(strength * 100) / 100,
          });
        }
      } catch (err) {
        logger.warn({ err, repo: repo.name }, 'Failed to fetch languages after retries');
      }

      // Topics (with retry)
      try {
        const topicData = await withRetry(() =>
          githubGet<{ names: string[] }>(`/repos/${owner}/${repo.name}/topics`, token)
        );
        for (const topic of topicData.names ?? []) {
          evidenceItems.push({
            scan_id: scanId,
            source_id: sourceId,
            evidence_type: 'repo_topic',
            ref: { repo: repo.full_name, topic },
            text_snippet: topic,
            timestamp: repo.pushed_at ?? undefined,
            strength: 0.6,
          });
        }
      } catch (err) {
        logger.warn({ err, repo: repo.name }, 'Failed to fetch topics after retries');
      }

      // Dependencies (with retry)
      try {
        const deps = await withRetry(() => fetchDependencies(owner, repo.name, token));
        for (const dep of deps) {
          const skills = getSkillsForDep(dep.name);
          if (skills.length > 0 || dep.name) {
            evidenceItems.push({
              scan_id: scanId,
              source_id: sourceId,
              evidence_type: 'dependency',
              ref: { repo: repo.full_name, file: dep.file, package: dep.name },
              text_snippet: dep.name,
              timestamp: repo.pushed_at ?? undefined,
              strength: 0.8,
            });
          }
        }
      } catch (err) {
        logger.warn({ err, repo: repo.name }, 'Failed to fetch dependencies after retries');
      }

      // README snippet (first 500 chars, with retry)
      try {
        const readmeData = await withRetry(() =>
          githubGet<{ content: string; encoding: string }>(`/repos/${owner}/${repo.name}/readme`, token)
        );
        const readmeText =
          readmeData.encoding === 'base64'
            ? Buffer.from(readmeData.content, 'base64').toString('utf-8')
            : readmeData.content;
        const snippet = readmeText.slice(0, 500).replace(/\s+/g, ' ').trim();
        if (snippet.length > 20) {
          evidenceItems.push({
            scan_id: scanId,
            source_id: sourceId,
            evidence_type: 'readme_snippet',
            ref: { repo: repo.full_name },
            text_snippet: snippet,
            timestamp: repo.pushed_at ?? undefined,
            strength: 0.4,
          });
        }
      } catch {
        // No README — normal
      }
    }

    // Batch insert evidence items (500 at a time)
    for (let i = 0; i < evidenceItems.length; i += 500) {
      const batch = evidenceItems.slice(i, i + 500);
      const { error } = await supabase.schema('app').from('evidence_items').insert(batch);
      if (error) {
        logger.error({ error, scanId }, 'Failed to insert evidence batch');
      }
    }

    // Save GitHub snapshot artifact
    await supabase.schema('app').from('artifacts').insert({
      scan_id: scanId,
      source_id: sourceId,
      type: 'github_snapshot',
      metadata: {
        username,
        repos_processed: ownRepos.length,
        evidence_count: evidenceItems.length,
        repo_names: ownRepos.map((r) => r.full_name),
      },
    });

    // Mark source as done
    await supabase
      .schema('app')
      .from('sources')
      .update({ status: 'done' })
      .eq('id', sourceId);

    logger.info({ scanId, evidenceCount: evidenceItems.length }, 'GitHub ingest complete');
  } catch (err) {
    logger.error({ err, scanId }, 'GitHub ingest error');
    await supabase
      .schema('app')
      .from('sources')
      .update({ status: 'error', error_details: { message: String(err) } })
      .eq('id', sourceId);
    throw err;
  }
}
