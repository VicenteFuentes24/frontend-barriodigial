import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/services/apiClient';
import { reportErrorMessage, ReportResponseError, reportService } from '../src/services/reportService';
import { msalInstance } from '../src/auth/authConfig';
import { admitted, hours, kpis, top } from './fixtures';

vi.mock('../src/auth/authConfig', () => ({
  azureConfig: { apiBaseUrl: 'http://localhost:8080/', apiScope: 'api://test/access_as_user' },
  getApiTokenRequest: (account: unknown) => ({ account, scopes: ['api://test/access_as_user'] }),
  msalInstance: { getActiveAccount: vi.fn(), getAllAccounts: vi.fn(), acquireTokenSilent: vi.fn() },
}));

const fetchMock = vi.fn<typeof fetch>();
function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(msalInstance.getActiveAccount).mockReturnValue({ homeAccountId: 'test' } as never);
  vi.mocked(msalInstance.acquireTokenSilent).mockResolvedValue({ accessToken: 'unit-test-token' } as never);
});

describe('real Report DTOs through the existing authenticated BFF client', () => {
  it.each([
    ['kpis', 'last24h', kpis(), reportService.getKpis],
    ['kpis', 'last7d', admitted(), reportService.getKpis],
    ['top-procedures', 'last7d', top, reportService.getTopProcedures],
    ['requests-by-hour', 'last24h', hours, reportService.getRequestsByHour],
  ] as const)('GET %s?range=%s preserves the DTO and token flow', async (path, period, body, load) => {
    response(body);
    const signal = new AbortController().signal;
    expect(await load(period, signal)).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:8080/api/report/${path}?range=${period}`, expect.objectContaining({ signal }));
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer unit-test-token');
    expect(msalInstance.acquireTokenSilent).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['api://test/access_as_user'] }));
  });

  it.each([
    undefined, {}, { ...kpis(), totalRequests: -1 }, { ...kpis(), averageResolutionSeconds: '0' },
    { ...kpis(), requestsByStatus: { ADMITIDO: 2 } }, { ...kpis(), range: { from: 'invalid', to: 'invalid' } },
  ])('rejects malformed KPIs without pretending missing fields are zero', async (body) => {
    response(body ?? null);
    await expect(reportService.getKpis('last24h')).rejects.toBeInstanceOf(ReportResponseError);
  });
  it('rejects the obsolete ranking array contract', async () => {
    response([{ procedureName: 'name', total: 2 }]);
    await expect(reportService.getTopProcedures('last7d')).rejects.toBeInstanceOf(ReportResponseError);
  });
  it('rejects invalid hourly timestamps', async () => {
    response({ ...hours, hours: [{ hour: 'today', totalRequests: 1 }] });
    await expect(reportService.getRequestsByHour('last24h')).rejects.toBeInstanceOf(ReportResponseError);
  });
  it('accepts empty responses with valid envelopes', async () => {
    response({ ...top, procedures: [] });
    response({ ...hours, hours: [] });
    expect((await reportService.getTopProcedures('last7d')).procedures).toEqual([]);
    expect((await reportService.getRequestsByHour('last24h')).hours).toEqual([]);
  });
  it.each([[401, /sesión/], [403, /Admin/], [503, /no está disponible/]])('handles HTTP %i without exposing upstream details', async (status, message) => {
    response({ message: 'sensitive downstream text' }, status as number);
    const error = await reportService.getKpis('last24h').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(reportErrorMessage(error)).toMatch(message as RegExp);
    expect(reportErrorMessage(error)).not.toContain('sensitive');
  });
  it('handles a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('private server address'));
    const error = await reportService.getKpis('last24h').catch((caught: unknown) => caught);
    expect(reportErrorMessage(error)).toMatch(/conexión/);
    expect(reportErrorMessage(error)).not.toContain('private');
  });
  it('handles malformed JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{', { headers: { 'Content-Type': 'application/json' } }));
    const error = await reportService.getKpis('last24h').catch((caught: unknown) => caught);
    expect(reportErrorMessage(error)).toMatch(/respuesta de reportería no válida/);
  });
  it('does not fetch when token acquisition fails', async () => {
    vi.mocked(msalInstance.acquireTokenSilent).mockRejectedValueOnce(new Error('private MSAL details'));
    await expect(reportService.getKpis('last24h')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
