import type { AuditEvent, AuditFilters } from '../types/audit';
import { apiRequest } from './apiClient';

function buildAuditQuery(filters: AuditFilters) {
  const params = new URLSearchParams();

  if (filters.user) {
    params.set('user', filters.user);
  }

  if (filters.date) {
    params.set('date', filters.date);
  }

  if (filters.eventType) {
    params.set('eventType', filters.eventType);
  }

  const query = params.toString();
  return query ? '?' + query : '';
}

export const auditService = {
  getAuditEvents(filters: AuditFilters = {}) {
    return apiRequest<AuditEvent[]>('/api/audit' + buildAuditQuery(filters));
  },
};
