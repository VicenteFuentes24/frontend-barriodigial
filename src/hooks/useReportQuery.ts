import { useCallback, useEffect, useState } from 'react';
import { reportErrorMessage } from '../services/reportService';

export const reportRequestTimeoutMs = 20000;

interface State<T> {
  key: string;
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useReportQuery<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const requestKey = `${key}:${revision}`;
  const [state, setState] = useState<State<T>>({ key: requestKey, data: null, error: null, loading: true });
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    setState({ key: requestKey, data: null, error: null, loading: true });
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (current) setState({ key: requestKey, data: null, error: 'La consulta está tardando demasiado. Intenta nuevamente.', loading: false });
    }, reportRequestTimeoutMs);

    void load(controller.signal).then((data) => {
      if (current && !controller.signal.aborted) setState({ key: requestKey, data, error: null, loading: false });
    }).catch((error: unknown) => {
      if (current && !controller.signal.aborted) setState({ key: requestKey, data: null, error: reportErrorMessage(error), loading: false });
    }).finally(() => window.clearTimeout(timeout));

    return () => {
      current = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [load, requestKey]);

  // Also hide the previous period during the render before effect cleanup runs.
  const visible = state.key === requestKey ? state : { key: requestKey, data: null, error: null, loading: true };
  return { ...visible, retry };
}
