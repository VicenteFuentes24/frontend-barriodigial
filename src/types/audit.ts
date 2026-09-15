export interface AuditEvent {
  id: string;
  user?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  occurredAt?: string;
  detail?: string;
}

export interface AuditFilters {
  user?: string;
  date?: string;
  eventType?: string;
}
