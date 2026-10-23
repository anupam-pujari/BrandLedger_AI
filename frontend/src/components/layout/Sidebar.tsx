// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  FilePlus2,
  FolderKanban,
  ClipboardCheck,
  BookOpen,
  Database,
  CaseSensitive,
  Palette,
  HeartPulse,
  TrendingDown,
  Users,
  Lock,
  ExternalLink
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const isCreator = role === 'creator';
  const isReviewer = role === 'reviewer';
  const isManager = role === 'brand_manager';
  const isAdmin = role === 'admin';

  const canApproveOrReview = isReviewer || isManager || isAdmin;
  const canManageRules = isManager || isAdmin;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
      isActive
        ? 'bg-indigo-600/90 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Logo & Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-['Outfit']">
              BrandProof
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                AI
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Proof-First Governance</div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Main workspace section */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/content/new" className={navItemClass}>
                <FilePlus2 className="w-4 h-4" />
                <span>Pre-Check Workspace</span>
              </NavLink>

              <NavLink to="/content/mine" className={navItemClass}>
                <FolderKanban className="w-4 h-4" />
                <span>My Drafts & Submissions</span>
              </NavLink>

              {canApproveOrReview && (
                <NavLink to="/review/queue" className={navItemClass}>
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="flex-1">Review Queue</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800">
                    Active
                  </span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Source of truth repository */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Source of Truth
            </div>
            <nav className="space-y-1">
              <NavLink to="/source-of-truth/rules" className={navItemClass}>
                <BookOpen className="w-4 h-4" />
                <span>Rulebook & Compiler</span>
              </NavLink>

              <NavLink to="/source-of-truth/facts" className={navItemClass}>
                <Database className="w-4 h-4" />
                <span>Approved Facts Vault</span>
              </NavLink>

              <NavLink to="/source-of-truth/terms" className={navItemClass}>
                <CaseSensitive className="w-4 h-4" />
                <span>Terminology Guide</span>
              </NavLink>

              <NavLink to="/source-of-truth/assets" className={navItemClass}>
                <Palette className="w-4 h-4" />
                <span>Brand Palette & Assets</span>
              </NavLink>
            </nav>
          </div>

          {/* Analytics & Governance Insights */}
          {canManageRules && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
                Insights & Quality
              </div>
              <nav className="space-y-1">
                <NavLink to="/insights/rule-health" className={navItemClass}>
                  <HeartPulse className="w-4 h-4" />
                  <span>Rule Health & Rewrites</span>
                </NavLink>

                <NavLink to="/insights/recurring" className={navItemClass}>
                  <TrendingDown className="w-4 h-4" />
                  <span>Recurring Mistakes</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Administration */}
          {(isAdmin || isManager) && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
                Administration
              </div>
              <nav className="space-y-1">
                <NavLink to="/settings/users" className={navItemClass}>
                  <Users className="w-4 h-4" />
                  <span>Team & Roles</span>
                </NavLink>

                <NavLink to="/settings/privacy" className={navItemClass}>
                  <Lock className="w-4 h-4" />
                  <span>AI Privacy & Security</span>
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/docs`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between text-[11px] text-slate-400 hover:text-indigo-400 transition"
        >
          <span>FastAPI Docs (Swagger)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};
