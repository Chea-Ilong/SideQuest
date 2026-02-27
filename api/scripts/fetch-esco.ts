/**
 * Fetches ESCO skills from the public REST API and writes skills_en.csv
 * to api/data/ so import-esco.ts can run.
 *
 * Usage:  npx tsx scripts/fetch-esco.ts
 */

import { createWriteStream, mkdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');
const OUT_FILE = `${DATA_DIR}/skills_en.csv`;

const PAGE_SIZE = 500;
const RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

function escapeCsv(val: string): string {
  if (!val) return '';
  const s = String(val);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

interface EscoResult {
  uri: string;
  title: string;
  preferredLabel?: Record<string, string>;
  alternativeLabel?: Record<string, string[]>;
  skillType?: string;
  reuseLevel?: string;
  description?: Record<string, { literal: string }>;
}

async function fetchWithRetry(url: string): Promise<{ results: EscoResult[]; nextUrl: string | null; total: number }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const json = await res.json() as any;
      return {
        results: (json._embedded?.results ?? []) as EscoResult[],
        nextUrl: json._links?.next?.href ?? null,
        total: json.total as number,
      };
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) {
        console.error(`\n  Attempt ${attempt} failed: ${(err as Error).message} — retrying in ${RETRY_DELAY_MS * attempt}ms...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastErr;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const stream = createWriteStream(OUT_FILE, { encoding: 'utf-8' });
  stream.write('conceptUri,conceptType,preferredLabel,altLabels,skillType,reuseLevel,description\n');

  let nextUrl: string | null =
    `https://ec.europa.eu/esco/api/search?language=en&type=skill&offset=0&limit=${PAGE_SIZE}&full=true`;
  let written = 0;
  let total = 0;

  console.log('Fetching ESCO skills from REST API...');

  while (nextUrl) {
    const { results, nextUrl: n, total: t } = await fetchWithRetry(nextUrl);
    total = t;
    nextUrl = n;

    for (const skill of results) {
      const uri = skill.uri ?? '';
      const label = skill.preferredLabel?.['en'] ?? skill.title ?? '';
      const altLabels = Object.values(skill.alternativeLabel ?? {})
        .flat()
        .filter(Boolean)
        .join('\n');
      const skillType = skill.skillType ?? '';
      const reuseLevel = skill.reuseLevel ?? '';
      const description = skill.description?.['en']?.literal ?? '';

      stream.write(
        [
          escapeCsv(uri),
          escapeCsv('KnowledgeSkillCompetence'),
          escapeCsv(label),
          escapeCsv(altLabels),
          escapeCsv(skillType),
          escapeCsv(reuseLevel),
          escapeCsv(description),
        ].join(',') + '\n'
      );
      written++;
    }

    process.stdout.write(`\r  ${written}/${total} skills fetched...`);
    if (results.length === 0) break;
    if (nextUrl) await new Promise((r) => setTimeout(r, 200));
  }

  await new Promise<void>((resolve, reject) => {
    stream.end((err: Error | null | undefined) => (err ? reject(err) : resolve()));
  });

  console.log(`\n✓ Written ${written}/${total} skills to ${OUT_FILE}`);
  if (written < total) {
    console.warn(`⚠ Only fetched ${written} of ${total} — re-run to retry`);
    process.exit(1);
  }
  console.log('Now run: npm run import:esco');
}

main().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
