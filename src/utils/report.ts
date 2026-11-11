import type { ReportKpis, RequestsByHour } from '../types/report';
import { requestStatuses, type RequestStatus } from '../types/request';

export const reportTimeZone = 'America/Santiago';
export const kpiRangeLabels = { last24h: 'Últimas 24 horas', last7d: 'Últimos 7 días' } as const;
const activeStatuses: readonly RequestStatus[] = ['INGRESADO', 'ADMITIDO', 'EN_GESTION', 'EN_TERRENO'];

export function activeRequests(kpis: ReportKpis): number {
  return activeStatuses.reduce((total, status) => total + kpis.requestsByStatus[status], 0);
}

export function statusSeries(kpis: ReportKpis) {
  return requestStatuses.map((status) => ({ status, count: kpis.requestsByStatus[status], active: activeStatuses.includes(status) }));
}

export function hourlySeries(response: RequestsByHour) {
  // Keep precisely the buckets supplied by Report; do not fill gaps with invented values.
  return [...response.hours].sort((a, b) => Date.parse(a.hour) - Date.parse(b.hour));
}

export function formatReportInstant(value: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: reportTimeZone, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset',
  }).format(new Date(value));
}

export function formatResolution(seconds: number | null): string {
  if (seconds === null) return 'Sin solicitudes resueltas';
  const [value, unit]: [number, string] = seconds < 60 ? [seconds, 's']
    : seconds < 3600 ? [seconds / 60, 'min']
      : seconds < 86400 ? [seconds / 3600, 'h'] : [seconds / 86400, 'días'];
  return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}
