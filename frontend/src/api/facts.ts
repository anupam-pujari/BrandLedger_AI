// src/api/facts.ts
import { apiClient } from './client';
import { Fact } from '../types';

export const factsApi = {
  async listFacts(search?: string, status?: string): Promise<Fact[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ facts: Fact[] }>(`/facts${query}`);
    return res.facts || (Array.isArray(res) ? res : []);
  },

  async createFact(fact: Partial<Fact>): Promise<Fact> {
    const res = await apiClient.post<{ fact: Fact }>('/facts', fact);
    return res.fact || (res as any);
  },

  async updateFact(id: string, updates: Partial<Fact>): Promise<Fact> {
    const res = await apiClient.put<{ fact: Fact }>(`/facts/${id}`, updates);
    return res.fact || (res as any);
  },

  async deleteFact(id: string): Promise<void> {
    await apiClient.delete(`/facts/${id}`);
  }
};
