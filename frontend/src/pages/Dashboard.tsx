// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentApi } from '../api/content';
import { insightsApi } from '../api/insights';
import { ContentItem, DashboardStats } from '../types';
import {
  FilePlus,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Search
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, contentData] = await Promise.allSettled([
          insightsApi.getDashboardStats(),
          contentApi.listContent(),
        ]);

        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value);
        }
        if (contentData.status === 'fulfilled' && contentData.value) {
          setRecentDrafts(contentData.value.slice(0, 5));
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">Approved</span>;
      case 'in_review':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">In Review</span>;
      case 'changes_requested':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">Changes Requested</span>;
      case 'checked':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">Checked</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">Draft</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/50 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Brand Governance Active · ApexCloud Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Welcome back, {user?.fullName || 'Sarah'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Every promotional claim matches an approved fact, every finding cites its source guideline, and human judgement remains the final gate.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to="/content/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <FilePlus className="w-4 h-4" />
              <span>Launch Pre-Check Workspace</span>
            </Link>

            {(role === 'reviewer' || role === 'brand_manager' || role === 'admin') && (
              <Link
                to="/review/queue"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Open Review Queue</span>
              </Link>
            )}

            {(role === 'brand_manager' || role === 'admin') && (
              <Link
                to="/source-of-truth/rules"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Compile New Rules</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Content */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Content Checked</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_content_items}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">
              {Math.round(stats.approval_rate * 100)}% approval rate
            </span>
            <span>across all drafts</span>
          </div>
        </div>

        {/* Violations Blocked */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Issues Caught</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_findings_detected}</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-rose-400 font-semibold">{stats.critical_findings} critical</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400 font-semibold">{stats.warning_findings} warnings</span>
          </div>
        </div>

        {/* Rules in Force */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Rulebook</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.active_rules_count}</div>
          <div className="mt-2 text-xs text-slate-400">
            Compiled from guidelines & SLA docs
          </div>
        </div>

        {/* Facts Vault */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Claim Passport Vault</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.active_facts_count}</div>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            384-d vector embeddings active
          </div>
        </div>
      </div>

      {/* Main Content Area: Recent Submissions & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Content in Governance Pipeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track revisions, check status, and approval decisions</p>
            </div>
            <Link
              to="/content/mine"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentDrafts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No drafts found. Click "Launch Pre-Check Workspace" to test your first piece of copy.
              </div>
            ) : (
              recentDrafts.map(item => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="capitalize">{item.content_type} format</span>
                      <span>·</span>
                      <span>v{item.current_version?.version_number || 1}</span>
                      {item.intent_purpose && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[200px]">Goal: {item.intent_purpose}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/content/${item.id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
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
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>BrandProof Pillars</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-semibold text-indigo-300 mb-1">1. Rulebook Compiler</div>
              <p className="text-slate-400 text-[11px]">
                Turns guideline PDFs into testable rule objects with good and bad examples and source page citations.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-semibold text-emerald-300 mb-1">2. Hybrid Review Engine</div>
              <p className="text-slate-400 text-[11px]">
                Deterministic regex, terms, and contrast math run first; AI handles only tone and claims.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-semibold text-amber-300 mb-1">3. Claim Passport</div>
              <p className="text-slate-400 text-[11px]">
                Verifies factual claims against owner-verified facts with explicit expiration dates.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-semibold text-cyan-300 mb-1">4. Intent Lock</div>
              <p className="text-slate-400 text-[11px]">
                Preserves creator audience, purpose, and key message across all AI suggested revisions.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-semibold text-purple-300 mb-1">5. Rule Health Insights</div>
              <p className="text-slate-400 text-[11px]">
                Tracks dispute rates on guidelines and proposes clear AI rewrites for ambiguous rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
