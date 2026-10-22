// src/api/rules.ts
import { apiClient } from './client';
import { Rule } from '../types';

export const rulesApi = {
  async listRules(category?: string, status?: string): Promise<Rule[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ rules: Rule[] }>(`/rules${query}`);
    return res.rules || (Array.isArray(res) ? res : []);
  },

  async createRule(rule: Partial<Rule>): Promise<Rule> {
    const res = await apiClient.post<{ rule: Rule }>('/rules', rule);
    return res.rule || (res as any);
  },

  async updateRule(id: string, updates: Partial<Rule>): Promise<Rule> {
    const res = await apiClient.put<{ rule: Rule }>(`/rules/${id}`, updates);
    return res.rule || (res as any);
  },

  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/rules/${id}`);
  },

  async compileFromPdf(file: File): Promise<{ proposed_rules: Rule[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = apiClient.getToken();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/rules/compile`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('PDF Rule compilation failed');
    const json = await response.json();
    return json.data;
  }
};
