// src/pages/insights/RecurringMistakesPage.tsx
import React, { useState, useEffect } from 'react';
import { insightsApi } from '../../api/insights';
import { RecurringMistake } from '../../types';
import { TrendingDown, Filter, AlertTriangle, Layers, BarChart3, AlertOctagon } from 'lucide-react';

export const RecurringMistakesPage: React.FC = () => {
  const [insights, setInsights] = useState<RecurringMistake[]>([]);
  const [groupBy, setGroupBy] = useState<'category' | 'severity'>('category');
  const [loading, setLoading] = useState(true);

  const fallbackData: RecurringMistake[] = [
    {
      group: 'terminology',
      total_violations: 14,
      top_issues: [
        { title: 'Banned promotional guarantee ("guaranteed 100%")', count: 9 },
        { title: 'Deprecated product naming ("ApexCloud Legacy v1")', count: 3 },
        { title: 'Competitor direct comparison without legal addendum', count: 2 },
      ]
    },
    {
      group: 'claims',
      total_violations: 8,
      top_issues: [
        { title: 'Outdated telemetry speed reduction (Fact F-07 expired)', count: 5 },
        { title: 'Unverified ranking assertion ("fastest in region")', count: 3 },
      ]
    },
    {
      group: 'accessibility',
      total_violations: 6,
      top_issues: [
        { title: 'Non-descriptive hyperlink anchor ("[click here]")', count: 4 },
        { title: 'Missing decorative alt-text tag on banner image', count: 2 },
      ]
    }
  ];

  useEffect(() => {
    async function load() {
      try {
        const data = await insightsApi.getRecurringMistakes(groupBy);
        setInsights(data.length > 0 ? data : fallbackData);
      } catch (err) {
        setInsights(fallbackData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupBy]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5 font-['Outfit']">
            <TrendingDown className="w-6 h-6 text-amber-400" />
            <span className="text-gradient-vibrant">Recurring Mistakes &amp; Violation Clusters</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Identify repeat organizational errors across categories to target creator training and refine brand guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold font-['Outfit']">Group by:</span>
          <button
            onClick={() => setGroupBy('category')}
            className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
              groupBy === 'category'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setGroupBy('severity')}
            className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
              groupBy === 'severity'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            Severity
          </button>
        </div>
      </div>

      {/* Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {insights.map(item => (
          <div
            key={item.group}
            className="glass-card rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between border border-white/[0.08] hover:border-amber-500/40"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                <span className="text-base font-bold text-white capitalize font-['Outfit'] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {item.group}
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                  {item.total_violations} Violations
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
                  Top Repeated Issues
                </div>
                {item.top_issues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#060814]/80 border border-white/[0.06] space-y-1 hover:border-white/[0.12] transition-colors">
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-slate-200 font-medium leading-snug">{issue.title}</span>
                      <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                        {issue.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cluster frequency</span>
              </span>
              <span className="font-mono text-cyan-300 font-semibold">{item.top_issues.length} active issue types</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
