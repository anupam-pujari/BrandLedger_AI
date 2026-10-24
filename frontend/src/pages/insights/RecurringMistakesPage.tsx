// src/pages/insights/RecurringMistakesPage.tsx
import React, { useState, useEffect } from 'react';
import { AlertOctagon, TrendingDown, Layers, BarChart3 } from 'lucide-react';
import { insightsApi } from '../../api/insights';
import { RecurringMistake } from '../../types';

export const RecurringMistakesPage: React.FC = () => {
  const [insights, setInsights] = useState<RecurringMistake[]>([]);
  const [groupBy, setGroupBy] = useState<'category' | 'severity'>('category');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMistakes() {
      try {
        const data = await insightsApi.getRecurringMistakes(groupBy);
        setInsights(data);
      } catch (err) {
        console.warn('Fallback mistakes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMistakes();
  }, [groupBy]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <TrendingDown className="w-6 h-6 text-amber-500" />
            <span className="text-gradient-vibrant">Recurring Mistakes &amp; Violation Clusters</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Identify repeat organizational errors across categories to target creator training and refine brand guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold font-['Outfit']">Group by:</span>
          <button
            onClick={() => setGroupBy('category')}
            className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
              groupBy === 'category'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setGroupBy('severity')}
            className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
              groupBy === 'severity'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
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
            className="rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between bg-white/95 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.08]">
                <span className="text-base font-bold text-slate-900 dark:text-white capitalize font-['Outfit'] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  {item.group}
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 shadow-sm">
                  {item.total_violations} Violations
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-['Outfit']">
                  Top Repeated Issues
                </div>
                {item.top_issues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/[0.06] space-y-1 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-slate-800 dark:text-slate-200 font-medium leading-snug">{issue.title}</span>
                      <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shrink-0">
                        {issue.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                <span>Cluster frequency</span>
              </span>
              <span className="font-mono text-sky-700 dark:text-cyan-300 font-semibold">{item.top_issues.length} active issue types</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
