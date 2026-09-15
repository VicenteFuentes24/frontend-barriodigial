import type { ReportKpis, ReportRange, TopProcedure } from '../types/report';
import { apiRequest } from './apiClient';

export const reportService = {
  getKpis(range: ReportRange) {
    return apiRequest<ReportKpis>(
      '/api/report/kpis?range=' + encodeURIComponent(range),
    );
  },

  getTopProcedures(range: ReportRange) {
    return apiRequest<TopProcedure[]>(
      '/api/report/top-procedures?range=' + encodeURIComponent(range),
    );
  },
};
