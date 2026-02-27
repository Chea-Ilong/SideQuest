import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${config.tika.url}/tika`, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          'Accept': 'text/plain',
        },
        body: buffer,
        signal: AbortSignal.timeout(60_000),
      });

      if (response.status === 422) {
        throw new Error('Tika: unsupported or encrypted document');
      }
      if (!response.ok) {
        throw new Error(`Tika returned ${response.status}: ${await response.text()}`);
      }

      const text = await response.text();
      logger.debug({ mimeType, textLength: text.length }, 'Tika extraction success');
      return text;
    } catch (err) {
      lastError = err as Error;
      if (attempt < RETRY_ATTEMPTS) {
        logger.warn({ err, attempt }, `Tika attempt ${attempt} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error(`Tika extraction failed after ${RETRY_ATTEMPTS} attempts: ${lastError?.message}`);
}

export async function checkTikaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.tika.url}/tika`, {
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
