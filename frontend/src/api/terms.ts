// src/api/terms.ts
import { apiClient } from './client';
import { Term } from '../types';

export const termsApi = {
  async listTerms(termType?: 'preferred' | 'banned'): Promise<Term[]> {
    const params = new URLSearchParams();
    if (termType) params.append('term_type', termType);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ terms: Term[] }>(`/terms${query}`);
    return res.terms || (Array.isArray(res) ? res : []);
  },

  async createTerm(term: Partial<Term>): Promise<Term> {
    const res = await apiClient.post<{ term: Term }>('/terms', term);
    return res.term || (res as any);
  },

  async deleteTerm(id: string): Promise<void> {
    await apiClient.delete(`/terms/${id}`);
  }
};
