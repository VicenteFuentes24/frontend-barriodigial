export const requestStatuses = [
  'INGRESADO',
  'ADMITIDO',
  'EN_GESTION',
  'EN_TERRENO',
  'RESUELTO',
  'RECHAZADO',
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export interface ServiceRequest {
  id: string;
  procedureTypeId?: string;
  procedureName?: string;
  description?: string;
  status: RequestStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  requesterName?: string;
  assignedToName?: string;
}

export interface RequestStatusHistoryItem {
  status: RequestStatus;
  changedAt?: string;
  changedBy?: string;
  comment?: string;
}

export interface RequestDetail extends ServiceRequest {
  resolutionComment?: string;
  statusHistory?: RequestStatusHistoryItem[];
}

export interface CreateRequestPayload {
  procedureTypeId: string;
  description: string;
}

export interface UpdateRequestStatusPayload {
  status: RequestStatus;
  comment?: string;
}
