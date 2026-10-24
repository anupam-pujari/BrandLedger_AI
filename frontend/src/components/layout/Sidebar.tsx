// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
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
  Zap,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useUI();

  const isReviewer = role === 'reviewer';
  const isManager = role === 'brand_manager';
  const isAdmin = role === 'admin';

  const canApproveOrReview = isReviewer || isManager || isAdmin;
  const canManageRules = isManager || isAdmin;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-3.5 gap-3'} py-2.5 rounded-xl text-xs transition-all duration-200 group relative ${
      isActive
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-l-2 border-sky-600 dark:border-sky-400 shadow-sm'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
    }`;

  return (
    <aside
      className={`${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } bg-white/95 dark:bg-[#0E1320] border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-2xl z-20 transition-all duration-300 shadow-sm dark:shadow-none`}
    >
      <div>
        {/* Brand Logo & Header with Single Collapse Button */}
        <div className={`h-16 border-b border-slate-200/80 dark:border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 ring-1 ring-white/20 shrink-0">
                  <Shield className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-extrabold tracking-tight flex items-center gap-1.5 font-['Outfit']">
                    <span className="text-slate-900 dark:text-white">BrandProof</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30 font-semibold">
                      AI
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Proof-First Engine</div>
                </div>
              </div>

              {/* Single collapse button */}
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 ring-1 ring-white/20 group relative transition-transform hover:scale-105"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Shield className="w-5 h-5 text-white drop-shadow-sm group-hover:hidden" />
              <PanelLeftOpen className="w-5 h-5 text-white hidden group-hover:block" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className={`p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)] ${isSidebarCollapsed ? 'px-2' : ''}`}>
          {/* Main workspace section */}
          <div>
            {!isSidebarCollapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Workspace</span>
              </div>
            )}
            <nav className="space-y-1">
              <NavLink to="/dashboard" className={navItemClass} title="Dashboard">
                <LayoutDashboard className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
              </NavLink>

              <NavLink to="/content/new" className={navItemClass} title="Pre-Check Studio">
                <FilePlus2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Pre-Check Studio</span>}
              </NavLink>

              <NavLink to="/content/mine" className={navItemClass} title="My Drafts & Submissions">
                <FolderKanban className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">My Drafts</span>}
              </NavLink>

              {canApproveOrReview && (
                <NavLink to="/review/queue" className={navItemClass} title="Review Queue">
                  <ClipboardCheck className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">Review Queue</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-mono border border-amber-300 dark:border-amber-800">
                        Active
                      </span>
                    </>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Source of truth repository */}
          <div>
            {!isSidebarCollapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Source of Truth</span>
              </div>
            )}
            <nav className="space-y-1">
              <NavLink to="/source-of-truth/rules" className={navItemClass} title="Rulebook Compiler">
                <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Rulebook Compiler</span>}
              </NavLink>

              <NavLink to="/source-of-truth/facts" className={navItemClass} title="Claim Passport Vault">
                <Database className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Claim Passport Vault</span>}
              </NavLink>

              <NavLink to="/source-of-truth/terms" className={navItemClass} title="Banned Terminology">
                <CaseSensitive className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Banned Terms</span>}
              </NavLink>

              <NavLink to="/source-of-truth/assets" className={navItemClass} title="Digital Asset Library">
                <Palette className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Digital Assets</span>}
              </NavLink>
            </nav>
          </div>

          {/* Governance & Continuous Learning */}
          {canManageRules && (
            <div>
              {!isSidebarCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Governance</span>
                </div>
              )}
              <nav className="space-y-1">
                <NavLink to="/insights/rule-health" className={navItemClass} title="Rule Health & Overrides">
                  <HeartPulse className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Rule Health</span>}
                </NavLink>

                <NavLink to="/insights/recurring" className={navItemClass} title="Recurring Mistakes">
                  <TrendingDown className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Recurring Mistakes</span>}
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pro Badge / Engine Indicator */}
      <div className={`p-3 border-t border-slate-200/80 dark:border-slate-800 ${isSidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
        {isSidebarCollapsed ? (
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400" title="Hybrid Governance Engine v2 active">
            <Zap className="w-4 h-4" />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">Hybrid Engine v2</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Deterministic checks in &lt;15ms with verified proof citations.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
