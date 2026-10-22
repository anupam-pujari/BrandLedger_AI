// src/api/auth.ts
import { apiClient } from './client';
import { UserProfile, Organization } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
  organisation: Organization;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    if (res.access_token) {
      apiClient.setToken(res.access_token);
    }
    return res;
  },

  async signup(email: string, password: string, displayName: string, orgName: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/signup', {
      email,
      password,
      display_name: displayName,
      org_name: orgName,
    });
    if (res.access_token) {
      apiClient.setToken(res.access_token);
    }
    return res;
  },

  async getMe(): Promise<{ user: UserProfile; organisation: Organization }> {
    return apiClient.get('/auth/me');
  },

  logout() {
    apiClient.setToken(null);
  }
};
