import type { ProcedureType, UpsertProcedurePayload } from '../types/catalog';
import { apiRequest } from './apiClient';

export const catalogService = {
  getProcedures() {
    return apiRequest<ProcedureType[]>('/api/catalog/procedures');
  },

  createProcedure(payload: UpsertProcedurePayload) {
    return apiRequest<ProcedureType>('/api/catalog/procedures', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProcedure(id: string, payload: UpsertProcedurePayload) {
    return apiRequest<ProcedureType>(
      '/api/catalog/procedures/' + encodeURIComponent(id),
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },
};
