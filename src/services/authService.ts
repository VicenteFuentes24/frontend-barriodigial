import { filterAppRoles } from '../auth/authUtils';
import type { BffMeResponse, ValidatedBffMeResponse } from '../types/auth';
import { apiRequest } from './apiClient';

export const authService = {
  async getMe(): Promise<ValidatedBffMeResponse> {
    const response = await apiRequest<BffMeResponse>('/api/bff/me');

    return {
      ...response,
      roles: filterAppRoles(Array.isArray(response.roles) ? response.roles : []),
    };
  },
};
