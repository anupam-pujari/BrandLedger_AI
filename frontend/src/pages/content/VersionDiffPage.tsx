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
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to={id ? `/content/${id}` : '/content/mine'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              <span>Version History & Semantic Diff</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review line-by-line editorial and governance revisions across version cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
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
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
          <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Governance Revision Summary</span>
          </h4>
          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
            <li>
              Replaced banned guarantee keyword <code className="text-rose-400">guaranteed 100% uptime</code> with SLA-bounded statement per <strong>Rule R-21</strong>.
            </li>
            <li>
              Corrected outdated telemetry claim from <code className="text-rose-400">60%</code> to approved vault benchmark <code className="text-emerald-400">45%</code> per <strong>Fact F-07</strong>.
            </li>
            <li>
              Updated non-descriptive anchor <code className="text-rose-400">[click here]</code> to descriptive label per <strong>WCAG 2.1 AA (Rule A-03)</strong>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
