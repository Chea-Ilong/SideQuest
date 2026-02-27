import type { Express } from 'express';
import { supabase } from '../lib/supabase.js';
import { extractTextFromBuffer } from './tikaService.js';
import { logger } from '../utils/logger.js';
import type { EvidenceType } from '../types/index.js';

// Common resume section headings
const SECTION_PATTERNS = [
  /^(experience|work experience|professional experience|employment|employment history)/im,
  /^(skills|technical skills|key skills|core competencies|competencies)/im,
  /^(education|academic|qualifications)/im,
  /^(projects|personal projects|side projects|open source)/im,
  /^(summary|profile|objective|about)/im,
];

const SECTION_NAMES: Record<string, string> = {
  experience: 'Experience',
  'work experience': 'Experience',
  'professional experience': 'Experience',
  employment: 'Experience',
  'employment history': 'Experience',
  skills: 'Skills',
  'technical skills': 'Skills',
  'key skills': 'Skills',
  'core competencies': 'Skills',
  competencies: 'Skills',
  education: 'Education',
  academic: 'Education',
  qualifications: 'Education',
  projects: 'Projects',
  'personal projects': 'Projects',
  'side projects': 'Projects',
  'open source': 'Projects',
  summary: 'Summary',
  profile: 'Summary',
  objective: 'Summary',
  about: 'Summary',
};

interface ResumeSection {
  name: string;
  content: string;
}

function splitIntoSections(text: string): ResumeSection[] {
  const lines = text.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a section heading
    let isHeading = false;
    for (const pattern of SECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        if (currentSection) sections.push(currentSection);
        const headingKey = trimmed.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        const sectionName = SECTION_NAMES[headingKey] ?? trimmed.slice(0, 30);
        currentSection = { name: sectionName, content: '' };
        isHeading = true;
        break;
      }
    }

    if (!isHeading && currentSection) {
      currentSection.content += line + '\n';
    } else if (!isHeading && !currentSection) {
      currentSection = { name: 'Header', content: line + '\n' };
    }
  }

  if (currentSection) sections.push(currentSection);

  // If no sections found, return the whole text as one section
  if (sections.length === 0 && text.trim()) {
    return [{ name: 'Content', content: text }];
  }

  return sections;
}

function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match bullet patterns: •, -, *, numbers, or plain sentences
    const bulletMatch = trimmed.match(/^[•\-\*\u2022\u2023\u25E6\u2043]\s*(.+)/) ||
      trimmed.match(/^\d+[.)]\s+(.+)/);
    if (bulletMatch) {
      const bullet = bulletMatch[1]!.trim();
      if (bullet.length > 10) bullets.push(bullet);
    } else if (trimmed.length > 20 && trimmed.length < 300 && !trimmed.match(/^\d{4}/)) {
      // Plain sentences that aren't dates
      bullets.push(trimmed);
    }
  }

  return bullets;
}

function evidenceStrengthForSection(sectionName: string): number {
  switch (sectionName) {
    case 'Skills': return 0.85;
    case 'Experience': return 0.7;
    case 'Projects': return 0.7;
    case 'Education': return 0.5;
    case 'Summary': return 0.6;
    default: return 0.5;
  }
}

export async function processResumeUpload(
  sourceId: string,
  scanId: string,
  file: Express.Multer.File
): Promise<void> {
  logger.info({ scanId, filename: file.originalname, size: file.size }, 'Processing resume');

  await supabase
    .schema('app')
    .from('sources')
    .update({ status: 'processing' })
    .eq('id', sourceId);

  try {
    // 1. Upload to Supabase Storage
    const storagePath = `${scanId}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage
      .from('skillDNA')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.warn({ uploadError }, 'Storage upload failed, continuing with parse');
    }

    // 2. Extract text via Tika
    const extractedText = await extractTextFromBuffer(file.buffer, file.mimetype);

    // 3. Store artifact
    await supabase.schema('app').from('artifacts').insert({
      scan_id: scanId,
      source_id: sourceId,
      type: 'resume_upload',
      storage_path: uploadError ? null : storagePath,
      metadata: {
        filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        extracted_text: extractedText.slice(0, 50000), // cap stored text
        text_length: extractedText.length,
      },
    });

    // 4. Parse into sections + bullets → evidence items
    const sections = splitIntoSections(extractedText);
    const evidenceItems: Array<{
      scan_id: string;
      source_id: string;
      evidence_type: EvidenceType;
      ref: Record<string, unknown>;
      text_snippet: string;
      strength: number;
    }> = [];

    for (const section of sections) {
      const bullets = extractBullets(section.content);
      const strength = evidenceStrengthForSection(section.name);

      for (const bullet of bullets.slice(0, 50)) { // cap per section
        evidenceItems.push({
          scan_id: scanId,
          source_id: sourceId,
          evidence_type: 'resume_bullet',
          ref: { section: section.name, filename: file.originalname },
          text_snippet: bullet.slice(0, 300),
          strength,
        });
      }
    }

    // Batch insert
    for (let i = 0; i < evidenceItems.length; i += 500) {
      await supabase.schema('app').from('evidence_items').insert(evidenceItems.slice(i, i + 500));
    }

    await supabase
      .schema('app')
      .from('sources')
      .update({ status: 'done' })
      .eq('id', sourceId);

    logger.info({ scanId, evidenceCount: evidenceItems.length, sections: sections.length }, 'Resume processed');
  } catch (err) {
    logger.error({ err, scanId }, 'Resume processing error');
    await supabase
      .schema('app')
      .from('sources')
      .update({ status: 'error', error_details: { message: String(err) } })
      .eq('id', sourceId);
    throw err;
  }
}
