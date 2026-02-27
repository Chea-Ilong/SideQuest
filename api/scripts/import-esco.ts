/**
 * ESCO CSV Import Script
 *
 * Usage:
 *   npm run import:esco
 *
 * Prerequisites:
 *   1. Place ESCO CSV files in api/data/:
 *      - skills_en.csv
 *      - broaderRelationsSkillPillar.csv (optional)
 *      - skillSkillRelations.csv (optional)
 *   2. Supabase must be running (npx supabase start)
 *   3. .env must be configured
 *
 * Download ESCO data: https://esco.ec.europa.eu/en/use-esco/download
 */

import 'dotenv/config';
import { createReadStream, existsSync } from 'fs';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');

const supabase = createClient(
  process.env['SUPABASE_URL'] ?? 'http://127.0.0.1:54321',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { auth: { persistSession: false } }
);

interface EscoSkillRow {
  conceptUri: string;
  conceptType: string;
  preferredLabel: string;
  altLabels: string;
  hiddenLabels?: string;
  status?: string;
  modifiedDate?: string;
  scopeNote?: string;
  definition?: string;
  inScheme?: string;
  description?: string;
  skillType?: string;
  reuseLevel?: string;
}

interface HierarchyRow {
  conceptUri: string;
  broaderUri: string;
  conceptPT: string;
  broaderPT: string;
}

interface RelationRow {
  originalSkillUri: string;
  relatedSkillUri: string;
  relationType?: string;
}

async function streamParseCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const records: T[] = [];
    createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          relax_quotes: true,
          trim: true,
        })
      )
      .on('data', (row: T) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

async function batchUpsert<T extends Record<string, unknown>>(
  schema: string,
  table: string,
  rows: T[],
  batchSize = 500,
  conflictColumn = ''
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = conflictColumn
      ? await supabase.schema(schema).from(table).upsert(batch, { onConflict: conflictColumn })
      : await supabase.schema(schema).from(table).upsert(batch);
    if (error) {
      console.error(`Batch ${i}-${i + batchSize} failed:`, error.message);
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r  ${table}: ${inserted}/${rows.length}`);
  }
  console.log();
  return inserted;
}

function fileChecksum(filePath: string): string {
  try {
    const content = readFileSync(filePath);
    return createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

async function importSkills(skillsFile: string): Promise<{ skillCount: number; aliasCount: number }> {
  console.log(`\nImporting skills from ${skillsFile}...`);
  const rows = await streamParseCsv<EscoSkillRow>(skillsFile);
  console.log(`  Parsed ${rows.length} rows`);

  // Filter to skills only (not skill groups)
  const skillRows = rows.filter((r) => r.conceptUri?.includes('/skill/'));

  const skills = skillRows.map((r) => ({
    esco_uri: r.conceptUri,
    preferred_label: r.preferredLabel ?? '',
    alt_labels: r.altLabels ?? null,
    skill_type: r.skillType ?? null,
    reuse_level: r.reuseLevel ?? null,
    description: r.description?.slice(0, 2000) ?? null,
  }));

  console.log(`  Inserting ${skills.length} skills...`);
  await batchUpsert('ref', 'esco_skills', skills, 500, 'esco_uri');

  // Extract aliases from altLabels (semicolon-delimited)
  const aliases: Array<{ esco_uri: string; alias: string; lang: string }> = [];
  for (const r of skillRows) {
    // Add preferred label as an alias for exact matching
    if (r.preferredLabel) {
      aliases.push({ esco_uri: r.conceptUri, alias: r.preferredLabel.toLowerCase(), lang: 'en' });
    }
    if (r.altLabels) {
      const altList = r.altLabels.split('\n').map((s) => s.trim()).filter(Boolean);
      for (const alt of altList) {
        if (alt.length > 1 && alt.length < 200) {
          aliases.push({ esco_uri: r.conceptUri, alias: alt.toLowerCase(), lang: 'en' });
        }
      }
    }
  }

  console.log(`  Inserting ${aliases.length} aliases...`);
  await batchUpsert('ref', 'esco_skill_aliases', aliases, 500);

  return { skillCount: skills.length, aliasCount: aliases.length };
}

async function importHierarchy(hierarchyFile: string): Promise<number> {
  console.log(`\nImporting hierarchy from ${hierarchyFile}...`);
  const rows = await streamParseCsv<HierarchyRow>(hierarchyFile);

  const edges = rows
    .filter((r) => r.conceptUri && r.broaderUri)
    .map((r) => ({
      parent_uri: r.broaderUri,
      child_uri: r.conceptUri,
    }));

  console.log(`  Inserting ${edges.length} hierarchy edges...`);
  await batchUpsert('ref', 'esco_hierarchy', edges, 500, 'parent_uri,child_uri');
  return edges.length;
}

async function importRelations(relationsFile: string): Promise<number> {
  console.log(`\nImporting skill relations from ${relationsFile}...`);
  const rows = await streamParseCsv<RelationRow>(relationsFile);

  const relations = rows
    .filter((r) => r.originalSkillUri && r.relatedSkillUri)
    .map((r) => ({
      skill_uri_a: r.originalSkillUri,
      skill_uri_b: r.relatedSkillUri,
      relation_type: r.relationType ?? 'associated',
    }));

  console.log(`  Inserting ${relations.length} skill relations...`);
  await batchUpsert('ref', 'esco_skill_relations', relations, 500, 'skill_uri_a,skill_uri_b');
  return relations.length;
}

async function main(): Promise<void> {
  console.log('=== ESCO CSV Import ===');
  console.log(`Data directory: ${DATA_DIR}`);

  const skillsFile = join(DATA_DIR, 'skills_en.csv');
  const hierarchyFile = join(DATA_DIR, 'broaderRelationsSkillPillar.csv');
  const relationsFile = join(DATA_DIR, 'skillSkillRelations.csv');

  if (!existsSync(skillsFile)) {
    console.error(`\nERROR: ${skillsFile} not found.`);
    console.error('Download ESCO CSV files from: https://esco.ec.europa.eu/en/use-esco/download');
    console.error('Place skills_en.csv in api/data/');
    process.exit(1);
  }

  const checksums: Record<string, string> = {
    skills_en: fileChecksum(skillsFile),
    hierarchy: fileChecksum(hierarchyFile),
    relations: fileChecksum(relationsFile),
  };

  const { skillCount, aliasCount } = await importSkills(skillsFile);

  let hierarchyCount = 0;
  if (existsSync(hierarchyFile)) {
    hierarchyCount = await importHierarchy(hierarchyFile);
  } else {
    console.log('\nSkipping hierarchy (file not found)');
  }

  let relationCount = 0;
  if (existsSync(relationsFile)) {
    relationCount = await importRelations(relationsFile);
  } else {
    console.log('\nSkipping skill relations (file not found)');
  }

  // Save metadata
  const escoVersion = process.env['ESCO_VERSION'] ?? 'v1.2.1';
  await supabase.schema('ref').from('esco_metadata').insert({
    version: escoVersion,
    skill_count: skillCount,
    alias_count: aliasCount,
    hierarchy_count: hierarchyCount,
    relation_count: relationCount,
    file_checksums: checksums,
  });

  console.log('\n=== Import Summary ===');
  console.log(`ESCO version: ${escoVersion}`);
  console.log(`Skills:     ${skillCount}`);
  console.log(`Aliases:    ${aliasCount}`);
  console.log(`Hierarchy:  ${hierarchyCount}`);
  console.log(`Relations:  ${relationCount}`);
  console.log('\nImport complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
