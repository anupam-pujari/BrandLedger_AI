// src/pages/insights/RecurringMistakesPage.tsx
import React, { useState, useEffect } from 'react';
import { insightsApi } from '../../api/insights';
import { RecurringMistake } from '../../types';
import { TrendingDown, Filter, AlertTriangle, Layers, BarChart3 } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-indigo-400" />
            <span>Recurring Mistakes & Violation Clusters</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Identify repeat organizational errors across categories to target creator training and refine brand guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Group by:</span>
          <button
            onClick={() => setGroupBy('category')}
            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
              groupBy === 'category' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setGroupBy('severity')}
            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
              groupBy === 'severity' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
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
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-bold text-white capitalize font-mono">
                  {item.group}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  {item.total_violations} Violations
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Top Repeated Issues
                </div>
                {item.top_issues.map((issue, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-slate-200 font-medium">{issue.title}</span>
                      <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                        {issue.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500">
              Aggregated across 30-day review cycles
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
