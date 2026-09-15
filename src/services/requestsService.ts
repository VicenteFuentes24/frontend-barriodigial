import type {
  CreateRequestPayload,
  RequestDetail,
  ServiceRequest,
  UpdateRequestStatusPayload,
} from '../types/request';
import { apiRequest } from './apiClient';

export const requestsService = {
  getRequests() {
    return apiRequest<ServiceRequest[]>('/api/requests');
  },

  getRequest(id: string) {
    return apiRequest<RequestDetail>('/api/requests/' + encodeURIComponent(id));
  },

  createRequest(payload: CreateRequestPayload) {
    return apiRequest<RequestDetail>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateRequestStatus(id: string, payload: UpdateRequestStatusPayload) {
    return apiRequest<RequestDetail>(
      '/api/requests/' + encodeURIComponent(id) + '/status',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },
};
