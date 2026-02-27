import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import type { Scan, ScanProgress } from '../types/index.js';

export function useScanStatus(scanId: string | null, enabled = true) {
  const [status, setStatus] = useState<string>('new');
  const [progress, setProgress] = useState<ScanProgress>({});
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!scanId || !enabled) return;

    const poll = async () => {
      try {
        const result = await api.scans.getStatus(scanId);
        setStatus(result.data.status);
        setProgress(result.data.progress ?? {});

        // Stop polling when done or error
        if (result.data.status === 'ready' || result.data.status === 'error') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get status');
      }
    };

    // Poll immediately then every 2s
    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scanId, enabled]);

  return { status, progress, error };
}

export function useScan(scanId: string | null) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    api.scans.get(scanId)
      .then((r) => setScan(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  return { scan, loading, error };
}
