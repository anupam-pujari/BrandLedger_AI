// src/pages/sourceOfTruth/AssetsPage.tsx
import React, { useState, useEffect } from 'react';
import { assetsApi } from '../../api/assets';
import { BrandAsset } from '../../types';
import { Palette, Shield, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Default color palette tokens if database is still seeding
  const defaultColors: BrandAsset[] = [
    {
      id: 'col-1',
      org_id: 'org-1',
      name: 'Apex Midnight Navy',
      asset_type: 'color',
      metadata: { hex: '#0B0F19', role: 'Primary Background', usage: 'Main canvas and deep surfaces', min_contrast_ratio: 15.2 }
    },
    {
      id: 'col-2',
      org_id: 'org-1',
      name: 'Electric Indigo',
      asset_type: 'color',
      metadata: { hex: '#6366F1', role: 'Primary Brand Accent', usage: 'Buttons, badges, focus outlines', min_contrast_ratio: 4.8 }
    },
    {
      id: 'col-3',
      org_id: 'org-1',
      name: 'Cyan Telemetry Glow',
      asset_type: 'color',
      metadata: { hex: '#06B6D4', role: 'Secondary Accent', usage: 'AI highlights and metric indicators', min_contrast_ratio: 5.1 }
    },
    {
      id: 'col-4',
      org_id: 'org-1',
      name: 'Verified Emerald',
      asset_type: 'color',
      metadata: { hex: '#10B981', role: 'Verification & Success', usage: 'Claim verified badges and approved states', min_contrast_ratio: 4.6 }
    },
    {
      id: 'col-5',
      org_id: 'org-1',
      name: 'Critical Crimson',
      asset_type: 'color',
      metadata: { hex: '#DC2626', role: 'Critical Governance Alerts', usage: 'Banned terms and legal violations', min_contrast_ratio: 5.4 }
    },
    {
      id: 'col-6',
      org_id: 'org-1',
      name: 'Pure Cloud White',
      asset_type: 'color',
      metadata: { hex: '#FFFFFF', role: 'Typography & Highlights', usage: 'Headings and high-contrast body text', min_contrast_ratio: 18.1 }
    }
  ];

  useEffect(() => {
    async function load() {
      try {
        const data = await assetsApi.listAssets();
        setAssets(data.length > 0 ? data : defaultColors);
      } catch (err) {
        setAssets(defaultColors);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Palette className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span className="text-gradient-vibrant">Brand Palette &amp; Visual Asset Library</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Maintain WCAG 2.1 AA contrast compliance, authorized color swatches, and logo clearance rules.
          </p>
        </div>
      </div>

      {/* Palette Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 font-['Outfit']">
          Approved Color Palette &amp; WCAG AA Contrast Ratios
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => {
            const hex = asset.metadata?.hex || '#6366F1';
            const contrast = asset.metadata?.min_contrast_ratio || 4.5;
            const meetsAA = contrast >= 4.5;

            return (
              <div
                key={asset.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Color preview box */}
                  <div className="h-28 w-full p-4 flex flex-col justify-between relative shadow-inner" style={{ backgroundColor: hex }}>
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase bg-black/70 text-white backdrop-blur-sm">
                        {hex}
                      </span>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${
                          meetsAA ? 'bg-emerald-950/80 text-emerald-300' : 'bg-amber-950/80 text-amber-300'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>WCAG AA {contrast}:1</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">{asset.name}</h3>
                    <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">{asset.metadata?.role || 'Brand Color'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{asset.metadata?.usage || 'General brand marketing applications.'}</p>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Enforced in Visual Engine</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logo & Asset Usage Rules */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/60 p-5 space-y-3 shadow-sm dark:shadow-xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <ImageIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Brand Mark &amp; Logo Usage Directives</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white font-['Outfit']">Minimum Clear Space</h4>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Maintain clear space equal to 50% of the logo height around all sides. Never crowd the primary logomark with typography or edge borders.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white font-['Outfit']">Resolution &amp; Aspect Ratio Constraints</h4>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Minimum digital width is 120px at 72 DPI. For print assets, ensure 300 DPI vector SVG or uncompressed PNG formats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
