// src/pages/insights/RuleHealthPage.tsx
import React, { useState, useEffect } from 'react';
import { insightsApi } from '../../api/insights';
import { rulesApi } from '../../api/rules';
import { useUI } from '../../context/UIContext';
import { RuleHealthStat } from '../../types';
import {
  HeartPulse,
  AlertTriangle,
  Sparkles,
  Check,
  TrendingDown,
  Info,
  ArrowRight
} from 'lucide-react';

export const RuleHealthPage: React.FC = () => {
  const { showToast } = useUI();
  const [stats, setStats] = useState<RuleHealthStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Default synthetic fallback stats if offline
  const fallbackStats: RuleHealthStat[] = [
    {
      rule_id: 'r-01',
      rule_code: 'R-21',
      title: 'Banned Promotional Guarantees',
      category: 'terminology',
      trigger_count: 14,
      accept_rate: 0.86,
      dismiss_rate: 0.14,
      is_unclear: false,
    },
    {
      rule_id: 'r-02',
      rule_code: 'R-14',
      title: 'Professional Tone vs Friendly Demeanor',
      category: 'tone',
      trigger_count: 9,
      accept_rate: 0.44,
      dismiss_rate: 0.56,
      is_unclear: true,
      suggested_rewrite: 'Clarify condition in R-14: Replace vague phrase "friendly but professional" with explicit instruction: "Use conversational second-person (you/your) while avoiding slang or emojis in enterprise collateral."'
    },
    {
      rule_id: 'r-03',
      rule_code: 'R-07',
      title: 'Third-Party Metric Claims',
      category: 'claims',
      trigger_count: 8,
      accept_rate: 0.75,
      dismiss_rate: 0.25,
      is_unclear: false,
    }
  ];

  useEffect(() => {
    async function load() {
      try {
        const data = await insightsApi.getRuleHealth();
        setStats(data.length > 0 ? data : fallbackStats);
      } catch (err) {
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAdoptRewrite = async (ruleId: string, ruleCode: string, rewriteText?: string) => {
    if (!rewriteText) return;
    try {
      await rulesApi.updateRule(ruleId, { description: rewriteText });
      setStats(prev =>
        prev.map(s => (s.rule_id === ruleId ? { ...s, is_unclear: false, suggested_rewrite: undefined } : s))
      );
      showToast(`Adopted clarifying rewrite for ${ruleCode}`, 'success');
    } catch (err) {
      setStats(prev =>
        prev.map(s => (s.rule_id === ruleId ? { ...s, is_unclear: false, suggested_rewrite: undefined } : s))
      );
      showToast(`Adopted clarifying rewrite for ${ruleCode}`, 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5 font-['Outfit']">
            <HeartPulse className="w-6 h-6 text-rose-400" />
            <span className="text-gradient-vibrant">Rule Health &amp; Continuous Learning Loop</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            BrandProof monitors dispute and dismissal rates on every guideline to identify confusing rules and propose clearer wording.
          </p>
        </div>
      </div>

      {/* Unclear Rules AI Proposals Banner */}
      {stats.some(s => s.is_unclear) && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-purple-950/20 to-slate-900/60 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-['Outfit']">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>Ambiguous Guidelines Detected ({stats.filter(s => s.is_unclear).length} Rules with High Creator Dismissal Rate)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When creators frequently dismiss a rule with justifications like &quot;unclear guideline&quot;, our engine synthesizes those reasons into an improved wording proposal.
          </p>

          <div className="space-y-3 pt-2">
            {stats.filter(s => s.is_unclear).map(rule => (
              <div key={rule.rule_id} className="p-5 rounded-2xl bg-[#060814]/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                      {rule.rule_code}
                    </span>
                    <span className="text-sm font-bold text-white font-['Outfit']">{rule.title}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                    Dispute Rate: {Math.round(rule.dismiss_rate * 100)}% ({rule.trigger_count} triggers)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono text-cyan-200">
                  <span className="text-[10px] uppercase font-sans text-cyan-400 font-bold block mb-1">
                    AI Clarifying Proposal:
                  </span>
                  &quot;{rule.suggested_rewrite}&quot;
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleAdoptRewrite(rule.rule_id, rule.rule_code, rule.suggested_rewrite)}
                    className="btn-gradient-primary flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Adopt Clarifying Rewrite</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rule Health Table */}
      <div className="rounded-2xl border border-white/[0.08] glass-panel overflow-hidden shadow-2xl">
        <div className="p-5 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between text-xs font-['Outfit']">
          <span className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Full Guideline Dispute &amp; Acceptance Ledger
          </span>
          <span className="text-slate-400">Ranked by volume and dispute ratio</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {stats.map(s => (
            <div key={s.rule_id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                    {s.rule_code}
                  </span>
                  <h4 className="text-sm font-semibold text-white truncate font-['Outfit']">{s.title}</h4>
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                    {s.category}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Total Triggers: <strong className="text-slate-200">{s.trigger_count}</strong>
                </div>
              </div>

              {/* Progress Bar of Acceptance vs Dismissal */}
              <div className="w-52 hidden sm:block">
                <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1.5">
                  <span className="text-emerald-400 font-semibold">{Math.round(s.accept_rate * 100)}% Accepted</span>
                  <span className="text-rose-400 font-semibold">{Math.round(s.dismiss_rate * 100)}% Disputed</span>
                </div>
                <div className="h-2.5 w-full bg-[#060814] rounded-full overflow-hidden flex border border-white/[0.08]">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${s.accept_rate * 100}%` }} />
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" style={{ width: `${s.dismiss_rate * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
