// src/api/assets.ts
import { apiClient } from './client';
import { BrandAsset } from '../types';

export const assetsApi = {
  async listAssets(assetType?: string): Promise<BrandAsset[]> {
    const params = new URLSearchParams();
    if (assetType && assetType !== 'all') params.append('asset_type', assetType);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ assets: BrandAsset[] }>(`/assets${query}`);
    return res.assets || (Array.isArray(res) ? res : []);
  },

  async createAsset(asset: Partial<BrandAsset>): Promise<BrandAsset> {
    const res = await apiClient.post<{ asset: BrandAsset }>('/assets', asset);
    return res.asset || (res as any);
  },

  async deleteAsset(id: string): Promise<void> {
    await apiClient.delete(`/assets/${id}`);
  }
};
