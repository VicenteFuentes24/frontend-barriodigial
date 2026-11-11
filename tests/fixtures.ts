import type { ReportKpis, ReportTimeRange, RequestsByHour, TopProcedures } from '../src/types/report';

// Test fixtures only. Production renders exclusively validated API responses.
export const range: ReportTimeRange = { from: '2026-11-09T12:00:00Z', to: '2026-11-10T12:00:00Z' };
export const week = { from: '2026-11-03T12:00:00Z', to: range.to };
export function kpis(overrides: Partial<ReportKpis> = {}): ReportKpis {
  return {
    range, totalRequests: 0, resolvedRequests: 0, averageResolutionSeconds: null,
    requestsByStatus: { INGRESADO: 0, ADMITIDO: 0, EN_GESTION: 0, EN_TERRENO: 0, RESUELTO: 0, RECHAZADO: 0 },
    ...overrides,
  };
}
export function admitted(): ReportKpis {
  return kpis({ range: week, totalRequests: 2, requestsByStatus: { ...kpis().requestsByStatus, ADMITIDO: 2 } });
}
export const top: TopProcedures = { range: week, procedures: [{ procedureId: 'P-1', procedureName: 'Permiso de circulación', totalRequests: 2 }] };
export const hours: RequestsByHour = { range, hours: [
  { hour: '2026-11-10T11:00:00Z', totalRequests: 2 },
  { hour: '2026-11-10T09:00:00Z', totalRequests: 1 },
] };
