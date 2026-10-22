// src/api/insights.ts
import { apiClient } from './client';
import { RuleHealthStat, RecurringMistake, DashboardStats } from '../types';

export const insightsApi = {
  async getRuleHealth(category?: string, period: string = '30d'): Promise<RuleHealthStat[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    params.append('period', period);
    const res = await apiClient.get<{ rules: RuleHealthStat[] }>(`/insights/rule-health?${params.toString()}`);
    return res.rules || (Array.isArray(res) ? res : []);
  },

  async getRecurringMistakes(groupBy: string = 'category', period: string = '30d'): Promise<RecurringMistake[]> {
    const params = new URLSearchParams({ group_by: groupBy, period });
    const res = await apiClient.get<{ insights: RecurringMistake[] }>(`/insights/recurring-mistakes?${params.toString()}`);
    return res.insights || (Array.isArray(res) ? res : []);
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<{ stats: DashboardStats }>('/insights/dashboard');
    return res.stats || (res as any);
  }
};
