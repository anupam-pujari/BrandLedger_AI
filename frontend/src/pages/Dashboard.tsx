// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../api/content';
import { insightsApi } from '../api/insights';
import { rulesApi } from '../api/rules';
import { factsApi } from '../api/facts';
import { ContentItem, DashboardStats, Rule, Fact } from '../types';
import { Modal } from '../components/common/Modal';
import {
  FilePlus,
  ClipboardCheck,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Tag,
  ArrowUpRight,
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_content_items: 11,
    approved_content_items: 6,
    approval_rate: 0.55,
    total_findings_detected: 24,
    critical_findings: 5,
    warning_findings: 11,
    active_rules_count: 16,
    active_facts_count: 15,
    review_engine_health: 'operational',
  });
  const [recentDrafts, setRecentDrafts] = useState<ContentItem[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive KPI modal state
  const [activeModal, setActiveModal] = useState<'content' | 'issues' | 'rules' | 'facts' | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, contentData, rulesData, factsData] = await Promise.allSettled([
          insightsApi.getDashboardStats(),
          contentApi.listContent(),
          rulesApi.listRules(),
          factsApi.listFacts(),
        ]);

        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value);
        }
        if (contentData.status === 'fulfilled' && contentData.value) {
          setRecentDrafts(contentData.value.slice(0, 5));
        }
        if (rulesData.status === 'fulfilled' && rulesData.value) {
          setRules(rulesData.value);
        }
        if (factsData.status === 'fulfilled' && factsData.value) {
          setFacts(factsData.value);
        }
      } catch (err) {
        console.warn('Dashboard fetch fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'in_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            In Review
          </span>
        );
      case 'changes_requested':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Changes Requested
          </span>
        );
      case 'checked':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Checked
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      {/* Welcome Hero Banner with Dual Theme Multi-Color Mesh */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-slate-50 to-emerald-50/60 dark:from-[#0F172A] dark:via-[#131E32] dark:to-[#0D1524] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm dark:shadow-xl backdrop-blur-xl">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-400/15 via-blue-500/10 to-transparent dark:from-sky-500/10 dark:via-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-tr from-emerald-400/15 via-teal-400/10 to-transparent dark:from-emerald-500/10 dark:via-teal-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin-slow" />
            <span>Brand Governance Active · ApexCloud Enterprise</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-['Outfit']">
            Welcome back, <span className="text-sky-600 dark:text-sky-400">{user?.fullName || 'Sarah'}</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Every promotional claim matches an approved fact, every finding cites its source guideline, and human judgement remains the final gate.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            <Link
              to="/content/new"
              className="btn-gradient-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(2,132,199,0.35)]"
            >
              <FilePlus className="w-4 h-4" />
              <span>Launch Pre-Check Workspace</span>
            </Link>

            {(role === 'reviewer' || role === 'brand_manager' || role === 'admin') && (
              <Link
                to="/review/queue"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-amber-500/40 backdrop-blur-md transition-all shadow-sm"
              >
                <ClipboardCheck className="w-4 h-4 text-amber-500" />
                <span>Open Review Queue</span>
              </Link>
            )}

            {(role === 'brand_manager' || role === 'admin') && (
              <Link
                to="/source-of-truth/rules"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-blue-500/40 backdrop-blur-md transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Compile New Rules</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modern KPI Cards Grid - NOW FULLY INTERACTIVE WITH CLICK MODALS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Interactive System Metrics <span className="text-[11px] font-normal text-slate-400">(Click any card to inspect full telemetry)</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Content Checked Card - Interactive */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('content')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('content')}
            className="p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/90 dark:bg-slate-900/60 border border-sky-200 dark:border-sky-500/20 hover:border-sky-400 dark:hover:border-sky-500/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Content Checked
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)] group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight font-['Outfit']">
              {stats.total_content_items}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  {Math.round(stats.approval_rate * 100)}%
                </span>
                <span>approval rate overall</span>
              </div>
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* 2. Issues Caught Card - Interactive */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('issues')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('issues')}
            className="p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/90 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Issues Caught
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight font-['Outfit']">
              {stats.total_findings_detected}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-rose-700 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                  {stats.critical_findings} critical
                </span>
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  {stats.warning_findings} warnings
                </span>
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* 3. Active Rulebook Card - Interactive */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('rules')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('rules')}
            className="p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/90 dark:bg-slate-900/60 border border-blue-200 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Rulebook
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.15)] group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight font-['Outfit']">
              {stats.active_rules_count}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Compiled with AST citations</span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* 4. Claim Passport Vault Card - Interactive */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('facts')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('facts')}
            className="p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/90 dark:bg-slate-900/60 border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Claim Passport Vault
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight font-['Outfit']">
              {stats.active_facts_count}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified &amp; owner-attributed</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Recent Submissions & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08]">
          <div className="p-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                <span>Recent Content in Governance Pipeline</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  Live
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track revisions, check status, and approval decisions
              </p>
            </div>
            <Link
              to="/content/mine"
              className="text-xs font-semibold text-sky-600 dark:text-cyan-400 hover:text-sky-700 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {recentDrafts.length === 0 ? (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                No drafts found. Click &quot;Launch Pre-Check Workspace&quot; to test your first piece of copy.
              </div>
            ) : (
              recentDrafts.map(item => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-200 transition-colors truncate font-['Outfit']">
                        {item.title}
                      </h4>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 font-medium">
                        {item.content_type}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        v{item.current_version?.version_number || 1}
                      </span>
                      {item.intent_purpose && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[240px] text-slate-500 dark:text-slate-400">
                            Goal: {item.intent_purpose}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/content/${item.id}`}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/[0.05] hover:bg-sky-600 hover:text-white dark:hover:bg-indigo-600/30 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.10] hover:border-sky-500 transition-all shadow-sm"
                    >
                      Workspace
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Five Signature Pillars Quick Reference */}
        <div className="rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08]">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Outfit']">
            <Shield className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>BrandProof Pillars</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-blue-200/60 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/40 transition-colors">
              <div className="font-bold text-blue-700 dark:text-blue-300 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                1. Rulebook Compiler
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Turns guideline PDFs into testable rule objects with good and bad examples and source page citations.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-emerald-200/60 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-colors">
              <div className="font-bold text-emerald-700 dark:text-emerald-300 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                2. Hybrid Review Engine
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Deterministic regex, terms, and contrast math run in &lt;15ms; AI handles only tone and claims.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-amber-200/60 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40 transition-colors">
              <div className="font-bold text-amber-700 dark:text-amber-300 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                3. Claim Passport
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Verifies factual claims against owner-verified facts with explicit expiration dates.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-sky-200/60 dark:border-cyan-500/20 hover:border-sky-400 dark:hover:border-cyan-500/40 transition-colors">
              <div className="font-bold text-sky-700 dark:text-cyan-300 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                4. Intent Lock
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Preserves creator audience, purpose, and key message across all AI suggested revisions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-rose-200/60 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/40 transition-colors">
              <div className="font-bold text-rose-700 dark:text-rose-300 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                5. Rule Health Insights
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Tracks dispute rates on guidelines and proposes clear rewrites for ambiguous rules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONTENT CHECKED MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'content'}
        onClose={() => setActiveModal(null)}
        title="Content Checked & Governance Pipeline"
        description="Comprehensive audit of all promotional copy, landing pages, and marketing campaigns."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-center">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                Total Checked
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                {stats.total_content_items}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Approval Rate
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
                {Math.round(stats.approval_rate * 100)}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-center">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Approved Items
              </span>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
                {stats.approved_content_items}
              </span>
            </div>
          </div>

          {/* Governance Pipeline Status Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08]">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
              Pipeline Distribution
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">Approved</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {stats.approved_content_items}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">In Review</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {Math.max(1, stats.total_content_items - stats.approved_content_items - 3)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold block">Changes Req.</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">1</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold block">Draft</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">2</span>
              </div>
            </div>
          </div>

          {/* Quick List Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Content Items
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {recentDrafts.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between"
                >
                  <div className="truncate mr-3">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {item.content_type} · v{item.current_version?.version_number || 1}
                    </span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <Link
              to="/content/mine"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition"
            >
              Explore Full Library
            </Link>
            <Link
              to="/content/new"
              onClick={() => setActiveModal(null)}
              className="btn-gradient-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
            >
              Pre-Check New Copy
            </Link>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. ISSUES CAUGHT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'issues'}
        onClose={() => setActiveModal(null)}
        title="Issues Caught & Finding Telemetry"
        description="Comprehensive log of violations detected across all checks, categorized by severity and policy type."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Severity Split Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Critical Blockers
                </span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">
                  {stats.critical_findings}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Blocking violations including unverified claims, trademark misuse, competitor disparagement, and WCAG AA contrast failures.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Advisory Warnings
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {stats.warning_findings}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Brand tone deviations, informal colloquialisms, passive voice warnings, and anchor text optimizations.
              </p>
            </div>
          </div>

          {/* Finding Categories Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Issue Distribution by Rule Category
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Claims &amp; Factual Verifications (Expired / Unverified)</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">42% (10 issues)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Terminology &amp; Deprecated Language</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">28% (7 issues)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '28%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Brand Voice &amp; Tone Calibration</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">18% (4 issues)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '18%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Visuals &amp; Accessibility (WCAG AAA)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">12% (3 issues)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <Link
              to="/insights/mistakes"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition"
            >
              Analyze Mistakes
            </Link>
            <Link
              to="/review/queue"
              onClick={() => setActiveModal(null)}
              className="btn-gradient-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
            >
              Open Review Queue
            </Link>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. ACTIVE RULEBOOK MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'rules'}
        onClose={() => setActiveModal(null)}
        title="Active Rulebook & AST Engine"
        description="Deterministic AST checks and AI-hybrid guidelines compiled directly from brand styleguides."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Top Engine Banner */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                16 Compiled Rules Operating with Page Citations
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Rules are automatically compiled from guideline PDFs with exact page numbers, good/bad examples, and deterministic regular expression anchors.
              </p>
            </div>
          </div>

          {/* Rules Category Quick Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">Tone &amp; Voice</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">5 Rules</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">Terminology</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">4 Rules</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">Claims &amp; Proof</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">4 Rules</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Accessibility</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">3 Rules</span>
            </div>
          </div>

          {/* Active Rules List Sample */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sample Compiled Guidelines in Force
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {(rules.length > 0 ? rules.slice(0, 5) : [
                { id: '1', rule_code: 'R-TONE-001', title: 'Empowering & Optimistic Tone', category: 'tone', severity: 'warning' },
                { id: '2', rule_code: 'R-TRM-001', title: 'Deprecated Product Naming', category: 'terminology', severity: 'critical' },
                { id: '3', rule_code: 'R-CLM-001', title: 'Mandatory Fact Attribution', category: 'claims', severity: 'critical' },
                { id: '4', rule_code: 'R-A11Y-001', title: 'WCAG 2.1 AA Contrast Ratios', category: 'accessibility', severity: 'critical' },
              ]).map((r: any) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">{r.rule_code}</span>
                      <span>·</span>
                      <span>{r.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      Category: {r.category} · Severity: {r.severity}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                    AST Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <Link
              to="/insights/rule-health"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition"
            >
              Rule Health &amp; Rewrites
            </Link>
            <Link
              to="/source-of-truth/rules"
              onClick={() => setActiveModal(null)}
              className="btn-gradient-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
            >
              Open Full Rulebook
            </Link>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. CLAIM PASSPORT VAULT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'facts'}
        onClose={() => setActiveModal(null)}
        title="Claim Passport Vault & Fact Attribution"
        description="Owner-verified repository of approved marketing claims with explicit expiration timestamps."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Top Vault Status Card */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {stats.active_facts_count} Verified &amp; Active Claims in Vault
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Zero-tolerance claim verification: Any metric, benchmark, or market-share statistic used in copy must link to a valid fact in this vault.
              </p>
            </div>
          </div>

          {/* Fact Vault Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Validated</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                {stats.active_facts_count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">Expired Claims</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
                1 (F-07)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">Owner Verified</span>
              <span className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5 block">
                100%
              </span>
            </div>
          </div>

          {/* Sample Facts Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Verified Claims Sample
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {(facts.length > 0 ? facts.slice(0, 5) : [
                { id: '1', claim_text: 'SOC-2 Type II Certified infrastructure across all 14 regions', owner_name: 'Security Ops', expires_at: '2027-12-31' },
                { id: '2', claim_text: '99.99% Guaranteed uptime SLA under enterprise agreements', owner_name: 'Infrastructure Team', expires_at: '2027-06-30' },
                { id: '3', claim_text: 'Over 10,000 engineering teams build with BrandLedger', owner_name: 'Growth Lead', expires_at: '2026-11-15' },
              ]).map((f: any) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between"
                >
                  <div className="pr-3 truncate">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                      {f.claim_text || f.statement}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Owner: {f.owner_name || f.owner || 'Verified'} · Expires: {f.expires_at ? f.expires_at.slice(0, 10) : 'Active'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <Link
              to="/content/new"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition"
            >
              Test Copy Against Vault
            </Link>
            <Link
              to="/source-of-truth/facts"
              onClick={() => setActiveModal(null)}
              className="btn-gradient-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
            >
              Open Claim Passport Vault
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};
