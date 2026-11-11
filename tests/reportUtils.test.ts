import { describe, expect, it } from 'vitest';
import { activeRequests, formatReportInstant, formatResolution, hourlySeries, statusSeries } from '../src/utils/report';
import { admitted, hours, kpis } from './fixtures';

describe('Report statistics presentation', () => {
  it('preserves legitimate zero counts', () => expect(activeRequests(kpis())).toBe(0));
  it('counts two admitted requests as active', () => expect(activeRequests(admitted())).toBe(2));
  it('excludes resolved and rejected requests from active requests', () => {
    const data = kpis({ totalRequests: 21, requestsByStatus: { INGRESADO: 1, ADMITIDO: 2, EN_GESTION: 3, EN_TERRENO: 4, RESUELTO: 5, RECHAZADO: 6 } });
    expect(activeRequests(data)).toBe(10);
    expect(statusSeries(data)).toEqual([
      { status: 'INGRESADO', count: 1, active: true }, { status: 'ADMITIDO', count: 2, active: true },
      { status: 'EN_GESTION', count: 3, active: true }, { status: 'EN_TERRENO', count: 4, active: true },
      { status: 'RESUELTO', count: 5, active: false }, { status: 'RECHAZADO', count: 6, active: false },
    ]);
  });
  it.each([[null, 'Sin solicitudes resueltas'], [0, '0 s'], [30, '30 s'], [90, '1,5 min'], [5400, '1,5 h'], [172800, '2 días']])('formats duration %s', (seconds, expected) => {
    expect(formatResolution(seconds as number | null)).toBe(expected);
  });
  it('sorts hourly buckets without filling gaps or changing the response', () => {
    expect(hourlySeries(hours)).toEqual([hours.hours[1], hours.hours[0]]);
    expect(hours.hours[0].hour).toBe('2026-11-10T11:00:00Z');
    expect(hourlySeries(hours)).toHaveLength(2);
  });
  it('uses Santiago time and an explicit offset across summer/winter', () => {
    expect(formatReportInstant('2026-11-10T12:00:00Z')).toMatch(/09:00.*GMT-3/);
    expect(formatReportInstant('2026-07-10T12:00:00Z')).toMatch(/08:00.*GMT-4/);
  });
});
