// src/api/content.ts
import { apiClient } from './client';
import { ContentItem, Finding, AIDisclosure } from '../types';

export const contentApi = {
  async listContent(status?: string, authorId?: string): Promise<ContentItem[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (authorId) params.append('author_id', authorId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ content_items: ContentItem[] }>(`/content${query}`);
    return res.content_items || (Array.isArray(res) ? res : []);
  },

  async getContent(id: string): Promise<ContentItem> {
    const res = await apiClient.get<{ content_item: ContentItem }>(`/content/${id}`);
    return res.content_item || (res as any);
  },

  async createContent(payload: {
    title: string;
    content_type?: string;
    body: string;
    intent_purpose?: string;
    intent_audience?: string;
    intent_key_message?: string;
    rules_only_mode?: boolean;
  }): Promise<ContentItem> {
    const res = await apiClient.post<{ content_item: ContentItem }>('/content', payload);
    return res.content_item || (res as any);
  },

  async updateContent(id: string, payload: {
    title?: string;
    body?: string;
    intent_purpose?: string;
    intent_audience?: string;
    intent_key_message?: string;
    rules_only_mode?: boolean;
  }): Promise<any> {
    return apiClient.put(`/content/${id}`, payload);
  },

  async triggerCheck(id: string): Promise<{ check_id: string; status: string; findings_count: number; findings: Finding[]; ai_disclosure: any }> {
    return apiClient.post(`/content/${id}/check`);
  },

  async getCheckStatus(id: string): Promise<{ status: string; findings_count: number; progress_percent: number }> {
    return apiClient.get(`/content/${id}/check-status`);
  },

  async listFindings(id: string, category?: string, severity?: string): Promise<Finding[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (severity && severity !== 'all') params.append('severity', severity);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ findings: Finding[] }>(`/content/${id}/findings${query}`);
    return res.findings || (Array.isArray(res) ? res : []);
  },

  async resolveFinding(
    contentId: string,
    findingId: string,
    status: 'accepted' | 'dismissed' | 'edited',
    dismissReason?: string,
    editedText?: string
  ): Promise<Finding> {
    const res = await apiClient.patch<{ finding: Finding }>(`/content/${contentId}/findings/${findingId}`, {
      status,
      dismiss_reason: dismissReason,
      edited_text: editedText,
    });
    return res.finding || (res as any);
  },

  async submitForReview(id: string): Promise<ContentItem> {
    const res = await apiClient.post<{ content_item: ContentItem }>(`/content/${id}/submit-for-review`);
    return res.content_item || (res as any);
  },

  async approveContent(id: string): Promise<ContentItem> {
    const res = await apiClient.post<{ content_item: ContentItem }>(`/content/${id}/approve`);
    return res.content_item || (res as any);
  },

  async requestChanges(id: string, notes: string): Promise<ContentItem> {
    const res = await apiClient.post<{ content_item: ContentItem }>(`/content/${id}/request-changes`, { notes });
    return res.content_item || (res as any);
  },

  async getVersionDiff(id: string, v1: number, v2: number): Promise<{ diff: Array<[number, string]> }> {
    return apiClient.get(`/content/${id}/versions/${v1}/diff/${v2}`);
  },

  async getAIDisclosures(id: string): Promise<AIDisclosure[]> {
    const res = await apiClient.get<{ disclosures: AIDisclosure[] }>(`/content/${id}/ai-disclosures`);
    return res.disclosures || (Array.isArray(res) ? res : []);
  },

  async exportPdf(id: string): Promise<Blob> {
    return apiClient.request<Blob>(`/content/${id}/export/pdf`, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
    });
  }
};
