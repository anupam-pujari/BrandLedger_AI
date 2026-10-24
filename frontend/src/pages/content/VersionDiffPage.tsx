// src/pages/content/VersionDiffPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentApi } from '../../api/content';
import { DiffViewer } from '../../components/content/DiffViewer';
import { ContentItem } from '../../types';
import { ArrowLeft, GitCompare, Clock, ShieldCheck } from 'lucide-react';

export const VersionDiffPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Sample texts for comparison fallback
  const sampleV1 = `ApexCloud is thrilled to offer our new cloud infrastructure with a guaranteed 100% uptime under all conditions.

Our telemetry engine cuts reporting time by up to 60%, making it the fastest in India.

Learn more by visiting [click here](https://apexcloud.io) or emailing sales@apexcloud.io.`;

  const sampleV2 = `ApexCloud is thrilled to offer our new cloud infrastructure designed to provide high reliability backed by SLA under standard conditions.

Our telemetry engine cuts reporting time by up to 45% (pending annual benchmark re-approval).

Learn more by visiting [Explore ApexCloud Infrastructure Specs](https://apexcloud.io) or emailing support@apexcloud.io.`;

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const item = await contentApi.getContent(id);
        setContent(item);
      } catch (err) {
        console.warn('Could not load specific content for diff:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const originalBody = sampleV1;
  const currentBody = content?.current_version?.body || sampleV2;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to={id ? `/content/${id}` : '/content/mine'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Version History & Semantic Diff</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Review line-by-line editorial and governance revisions across version cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold shadow-xs">
            Document: {content?.title || 'Launch Announcement'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Diff Component */}
        <DiffViewer
          originalText={originalBody}
          modifiedText={currentBody}
          v1Number={1}
          v2Number={content?.current_version?.version_number || 2}
        />

        {/* Change Rationale Legend */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/60 text-xs shadow-xs">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Governance Revision Summary</span>
          </h4>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300 list-disc list-inside">
            <li>
              Replaced banned guarantee keyword <code className="text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded">guaranteed 100% uptime</code> with SLA-bounded statement per <strong>Rule R-21</strong>.
            </li>
            <li>
              Corrected outdated telemetry claim from <code className="text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded">60%</code> to approved vault benchmark <code className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded">45%</code> per <strong>Fact F-07</strong>.
            </li>
            <li>
              Updated non-descriptive anchor <code className="text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded">[click here]</code> to descriptive label per <strong>WCAG 2.1 AA (Rule A-03)</strong>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
