import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { reportRequestTimeoutMs, useReportQuery } from '../src/hooks/useReportQuery';

vi.mock('../src/auth/authConfig', () => ({ azureConfig: {}, msalInstance: {}, getApiTokenRequest: vi.fn() }));
afterEach(() => vi.useRealTimers());

it('aborts on timeout, shows an error and allows retry without an indefinite spinner', async () => {
  vi.useFakeTimers();
  const load = vi.fn<(signal: AbortSignal) => Promise<string>>().mockImplementation(() => new Promise(() => {}));
  const { result } = renderHook(() => useReportQuery('24h', load));
  const signal = load.mock.calls[0][0];
  act(() => vi.advanceTimersByTime(reportRequestTimeoutMs));
  expect(signal.aborted).toBe(true);
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toMatch(/tardando demasiado/);
  load.mockResolvedValueOnce('recovered');
  await act(async () => result.current.retry());
  expect(result.current.data).toBe('recovered');
  expect(result.current.error).toBeNull();
});

it('aborts on unmount', () => {
  const load = vi.fn<(signal: AbortSignal) => Promise<string>>().mockImplementation(() => new Promise(() => {}));
  const { unmount } = renderHook(() => useReportQuery('24h', load));
  unmount();
  expect(load.mock.calls[0][0].aborted).toBe(true);
});
