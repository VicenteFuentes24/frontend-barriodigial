import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportsPage from '../src/pages/ReportsPage';
import { ApiError } from '../src/services/apiClient';
import { reportService, ReportResponseError } from '../src/services/reportService';
import type { ReportKpis } from '../src/types/report';
import { admitted, hours, kpis, top } from './fixtures';

vi.mock('../src/auth/authConfig', () => ({ azureConfig: {}, msalInstance: {}, getApiTokenRequest: vi.fn() }));

beforeEach(() => {
  vi.spyOn(reportService, 'getKpis').mockResolvedValue(kpis());
  vi.spyOn(reportService, 'getTopProcedures').mockResolvedValue(top);
  vi.spyOn(reportService, 'getRequestsByHour').mockResolvedValue(hours);
});
const metric = (name: string) => screen.getByRole('article', { name });

describe('existing Reports page', () => {
  it('renders zero, null resolution, real ranking envelope and sorted hours independently', async () => {
    render(<ReportsPage />);
    await screen.findByRole('article', { name: 'Total de trámites' });
    expect(within(metric('Total de trámites')).getByText('0')).toBeVisible();
    expect(within(metric('Trámites activos')).getByText('0')).toBeVisible();
    expect(within(metric('Trámites resueltos')).getByText('0')).toBeVisible();
    expect(metric('Tiempo de resolución')).toHaveTextContent('Sin solicitudes resueltas');
    expect(screen.getByText('Permiso de circulación')).toBeVisible();
    const hourly = screen.getByRole('region', { name: 'Trámites por hora' });
    expect(within(hourly).getAllByRole('listitem')).toHaveLength(2);
    expect(within(hourly).getAllByRole('listitem')[0].querySelector('time')).toHaveAttribute('datetime', hours.hours[1].hour);
    expect(screen.queryByText('---')).not.toBeInTheDocument();
  });

  it('changes KPI period and preserves it during manual refresh; hours and ranking keep their own ranges', async () => {
    const user = userEvent.setup();
    vi.mocked(reportService.getKpis).mockImplementation(async (period) => period === 'last7d' ? admitted() : kpis());
    render(<ReportsPage />);
    await screen.findByRole('article', { name: 'Total de trámites' });
    await user.selectOptions(screen.getByLabelText('Período de indicadores'), 'last7d');
    await waitFor(() => expect(metric('Trámites activos')).toHaveTextContent('2'));
    expect(metric('Total de trámites')).toHaveTextContent('2');
    expect(screen.getByText('Admitido')).toBeVisible();
    expect(reportService.getRequestsByHour).toHaveBeenCalledTimes(1);
    expect(reportService.getTopProcedures).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(reportService.getKpis).toHaveBeenCalledTimes(3));
    expect(screen.getByLabelText('Período de indicadores')).toHaveValue('last7d');
    expect(reportService.getKpis).toHaveBeenLastCalledWith('last7d', expect.any(AbortSignal));
    expect(reportService.getRequestsByHour).toHaveBeenLastCalledWith('last24h', expect.any(AbortSignal));
    expect(reportService.getTopProcedures).toHaveBeenLastCalledWith('last7d', expect.any(AbortSignal));
  });

  it('shows converted resolution time and genuine empty sections', async () => {
    vi.mocked(reportService.getKpis).mockResolvedValue(kpis({ totalRequests: 1, resolvedRequests: 1, averageResolutionSeconds: 7200, requestsByStatus: { ...kpis().requestsByStatus, RESUELTO: 1 } }));
    vi.mocked(reportService.getTopProcedures).mockResolvedValue({ ...top, procedures: [] });
    vi.mocked(reportService.getRequestsByHour).mockResolvedValue({ ...hours, hours: [] });
    render(<ReportsPage />);
    await screen.findByText('2 h');
    expect(metric('Trámites activos')).toHaveTextContent('0');
    expect(metric('Trámites resueltos')).toHaveTextContent('1');
    expect(screen.getByText('Sin solicitudes creadas en las últimas 24 horas.')).toBeVisible();
    expect(screen.getByText('Sin solicitudes para mostrar en los últimos siete días.')).toBeVisible();
  });

  it.each([
    [new ApiError('sensitive details', 401), /sesión no pudo validarse/],
    [new ApiError('sensitive details', 403), /Se requiere una cuenta Admin/],
    [new ApiError('sensitive details', 503), /no está disponible/],
    [new ApiError('sensitive details'), /Revisa tu conexión/],
    [new ReportResponseError(), /respuesta de reportería no válida/],
    [new Error('sensitive details'), /No fue posible cargar esta sección/],
  ])('isolates and safely presents section failure %#', async (error, message) => {
    vi.mocked(reportService.getTopProcedures).mockRejectedValueOnce(error);
    render(<ReportsPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(message as RegExp);
    expect(metric('Total de trámites')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Trámites por hora' })).toHaveTextContent('2');
    expect(screen.queryByText(/sensitive details/)).not.toBeInTheDocument();
    await userEvent.click(within(alert).getByRole('button'));
    await screen.findByText('Permiso de circulación');
    expect(reportService.getKpis).toHaveBeenCalledTimes(1);
    expect(reportService.getTopProcedures).toHaveBeenCalledTimes(2);
  });

  it('ignores an obsolete KPI response even if the transport ignores abort', async () => {
    let resolveOld!: (value: ReportKpis) => void;
    vi.mocked(reportService.getKpis).mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValue(admitted());
    render(<ReportsPage />);
    const oldSignal = vi.mocked(reportService.getKpis).mock.calls[0][1];
    await userEvent.selectOptions(screen.getByLabelText('Período de indicadores'), 'last7d');
    await screen.findByRole('article', { name: 'Trámites activos' });
    expect(oldSignal?.aborted).toBe(true);
    expect(metric('Trámites activos')).toHaveTextContent('2');
    await act(async () => resolveOld(kpis()));
    expect(metric('Trámites activos')).toHaveTextContent('2');
    expect(metric('Total de trámites')).toHaveTextContent('Últimos 7 días');
  });
});
