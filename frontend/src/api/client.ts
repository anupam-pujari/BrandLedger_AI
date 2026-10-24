// src/api/client.ts
// BrandProof Unified API Network Client

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('brandproof_api_url');
    if (override && override.trim()) {
      return override.trim().replace(/\/$/, '');
    }
  }
  return (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
};

const API_PREFIX = '/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
  meta?: any;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('brandproof_token');
  }

  getBaseUrl(): string {
    return getApiBaseUrl();
  }

  setApiUrl(url: string | null) {
    if (url && url.trim()) {
      localStorage.setItem('brandproof_api_url', url.trim().replace(/\/$/, ''));
    } else {
      localStorage.removeItem('brandproof_api_url');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('brandproof_token', token);
    } else {
      localStorage.removeItem('brandproof_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('brandproof_token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${baseUrl}${endpoint.startsWith('/api') ? '' : API_PREFIX}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Special case: blob / PDF downloads
      if (options.headers && (options.headers as any)['Accept'] === 'application/pdf') {
        if (!response.ok) throw new Error('PDF Export failed');
        return (await response.blob()) as unknown as T;
      }

      const json = await response.json();

      if (!response.ok || json.success === false) {
        const errorMsg = json.error?.message || json.detail || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      console.warn(`[API] ${options.method || 'GET'} ${url} failed:`, err.message);
      throw err;
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
