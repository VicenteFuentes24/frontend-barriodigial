export type ReportRange = 'last24h' | 'last7d' | 'last30d';

export interface ReportDataPoint {
  label: string;
  value: number;
}

export interface ReportKpis {
  activeRequests?: number | null;
  resolvedRequests?: number | null;
  averageResolutionTime?: string | null;
  hourlyRequests?: ReportDataPoint[];
  activeStatuses?: ReportDataPoint[];
}

export interface TopProcedure {
  procedureId?: string;
  procedureName: string;
  total: number;
}
