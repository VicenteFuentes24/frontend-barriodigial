import type { ReportKpis, ReportRange, RequestsByHour, TopProcedures } from '../types/report';
import { requestStatuses } from '../types/request';
import { ApiError, apiRequest } from './apiClient';

export class ReportResponseError extends Error {
  constructor() {
    super('El servicio devolvió una respuesta de reportería no válida. Intenta actualizar.');
    this.name = 'ReportResponseError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function instant(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function timeRange(value: unknown): boolean {
  return record(value) && instant(value.from) && instant(value.to)
    && Date.parse(value.from) < Date.parse(value.to);
}

function kpis(value: unknown): value is ReportKpis {
  if (!record(value) || !record(value.requestsByStatus)) return false;
  const statuses = value.requestsByStatus;
  return timeRange(value.range) && count(value.totalRequests) && count(value.resolvedRequests)
    && requestStatuses.every((status) => count(statuses[status]))
    && (value.averageResolutionSeconds === null || (typeof value.averageResolutionSeconds === 'number'
      && Number.isFinite(value.averageResolutionSeconds) && value.averageResolutionSeconds >= 0));
}

function topProcedures(value: unknown): value is TopProcedures {
  return record(value) && timeRange(value.range) && Array.isArray(value.procedures)
    && value.procedures.every((item) => record(item) && text(item.procedureId)
      && text(item.procedureName) && count(item.totalRequests));
}

function hourly(value: unknown): value is RequestsByHour {
  return record(value) && timeRange(value.range) && Array.isArray(value.hours)
    && value.hours.every((item) => record(item) && instant(item.hour) && count(item.totalRequests));
}

async function load<T>(endpoint: string, range: ReportRange, validate: (value: unknown) => value is T, signal?: AbortSignal): Promise<T> {
  const value = await apiRequest<unknown>(`/api/report/${endpoint}?range=${encodeURIComponent(range)}`, { signal });
  if (!validate(value)) throw new ReportResponseError();
  return value;
}

export const reportService = {
  getKpis: (range: ReportRange, signal?: AbortSignal) => load('kpis', range, kpis, signal),
  getTopProcedures: (range: ReportRange, signal?: AbortSignal) => load('top-procedures', range, topProcedures, signal),
  getRequestsByHour: (range: ReportRange, signal?: AbortSignal) => load('requests-by-hour', range, hourly, signal),
};

// Do not surface arbitrary upstream text (including ProblemDetail/HTML) or MSAL details.
// Scoped to Report so the other services, including Audit, keep their existing behavior.
export function reportErrorMessage(error: unknown): string {
  if (error instanceof ReportResponseError || (error instanceof ApiError && error.details instanceof SyntaxError)) {
    return new ReportResponseError().message;
  }
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Tu sesión no pudo validarse. Inicia sesión nuevamente para consultar reportería.';
    if (error.status === 403) return 'No tienes autorización para consultar reportería. Se requiere una cuenta Admin.';
    if (error.status !== undefined && error.status >= 500) return 'El servicio de reportería no está disponible. Intenta nuevamente más tarde.';
    if (error.status === undefined) return 'No fue posible conectar con reportería. Revisa tu conexión e intenta nuevamente.';
  }
  return 'No fue posible cargar esta sección de reportería. Intenta actualizar.';
}
