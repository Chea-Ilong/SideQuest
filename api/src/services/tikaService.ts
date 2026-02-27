import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function extractWithTika(buffer: Buffer, mimeType: string): Promise<string> {
  const response = await fetch(`${config.tika.url}/tika`, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Accept': 'text/plain' },
    body: buffer,
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 422) throw new Error('Tika: unsupported or encrypted document');
  if (!response.ok) throw new Error(`Tika returned ${response.status}`);
  return response.text();
}

async function extractLocally(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf' || mimeType === 'application/x-pdf') {
    // @ts-ignore
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text as string;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/docx'
  ) {
    // @ts-ignore
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value as string;
  }

  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  throw new Error(`No local parser for MIME type: ${mimeType}`);
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // Try Tika first if it's configured and reachable
  const tikaHealthy = await checkTikaHealth();
  if (tikaHealthy) {
    try {
      const text = await extractWithTika(buffer, mimeType);
      logger.debug({ mimeType, textLength: text.length }, 'Tika extraction success');
      return text;
    } catch (err) {
      logger.warn({ err }, 'Tika failed, falling back to local parser');
    }
  }

  // Local fallback (pdf-parse / mammoth)
  const text = await extractLocally(buffer, mimeType);
  logger.debug({ mimeType, textLength: text.length }, 'Local extraction success');
  return text;
}

export async function checkTikaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.tika.url}/tika`, {
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
