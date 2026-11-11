import type { RequestStatus } from './request';

// RangeResolver supports these ranges on all three endpoints.
export type ReportRange = 'last24h' | 'last7d' | 'last30d';
export type KpiRange = Extract<ReportRange, 'last24h' | 'last7d'>;

export interface ReportTimeRange {
  from: string;
  to: string;
}

export interface ReportKpis {
  range: ReportTimeRange;
  totalRequests: number;
  requestsByStatus: Record<RequestStatus, number>;
  resolvedRequests: number;
  averageResolutionSeconds: number | null;
}

export interface TopProcedure {
  procedureId: string;
  procedureName: string;
  totalRequests: number;
}

export interface TopProcedures {
  range: ReportTimeRange;
  procedures: TopProcedure[];
}

export interface HourCount {
  hour: string;
  totalRequests: number;
}

export interface RequestsByHour {
  range: ReportTimeRange;
  hours: HourCount[];
}
