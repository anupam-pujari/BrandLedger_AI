// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { UserRole } from '../../types';
import {
  Bell,
  Sliders,
  ChevronDown,
  Sparkles,
  Activity,
  ShieldCheck,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, switchRole, org } = useAuth();
  const { rulesOnlyMode, toggleRulesOnlyMode, theme, toggleTheme, isSidebarCollapsed, toggleSidebar } = useUI();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${apiUrl}/health`)
      .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
      .catch(() => setBackendOnline(false));
    
    const interval = setInterval(() => {
      fetch(`${apiUrl}/health`)
        .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
        .catch(() => setBackendOnline(false));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'brand_manager':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
            Brand Manager
          </span>
        );
      case 'reviewer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
            Reviewer
          </span>
        );
      case 'creator':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
            Creator
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40">
            Admin
          </span>
        );
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white/80 dark:bg-[#080c20]/80 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between sticky top-0 z-30 backdrop-blur-2xl transition-colors duration-200">
      {/* Left section: Sidebar toggle & Workspace Tag */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
            {org?.name || 'ApexCloud Technologies'}
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 rounded-full font-semibold">
            {org?.slug || 'apexcloud'}
          </span>
        </div>

        {/* Backend health status badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
            backendOnline === true
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 shadow-sm'
              : backendOnline === false
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
          }`}
          title={backendOnline ? 'FastAPI Backend Online (port 8080)' : 'Backend offline (run uvicorn app.main:app)'}
        >
          <Activity className={`w-3 h-3 ${backendOnline ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{backendOnline ? 'Engine Connected' : backendOnline === false ? 'Offline' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Right control cluster */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-cyan-600" />
          )}
        </button>

        {/* Rules-Only Mode Switcher */}
        <button
          onClick={toggleRulesOnlyMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            rulesOnlyMode
              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-500/50 shadow-sm'
              : 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-500/30 hover:border-cyan-400 shadow-sm'
          }`}
          title="Toggle Rules-Only Mode: bypass external LLMs and evaluate purely with local deterministic rules"
        >
          {rulesOnlyMode ? <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
          <span className="hidden sm:inline">{rulesOnlyMode ? 'Rules-Only: ON' : 'AI Review: Active'}</span>
        </button>

        {/* Notifications trigger */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-all"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
        </button>

        {/* Quick Demo Persona / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.10] transition-all shadow-sm"
            aria-expanded={showRoleDropdown}
          >
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=128'}
                alt={user?.fullName || 'User Avatar'}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-cyan-500/40"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-black" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight font-['Outfit']">{user?.fullName}</div>
              <div className="text-[10px] text-cyan-600 dark:text-cyan-300/80 leading-tight capitalize font-medium">{user?.role.replace('_', ' ')}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-0.5" />
          </button>

          {/* Role selector dropdown */}
          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-80 glass-dropdown rounded-2xl p-2.5 z-50 animate-scale-up border border-slate-200 dark:border-white/[0.12] shadow-2xl">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.08] mb-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-['Outfit']">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Switch Role (Interactive Demo)</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Test governance rules from any perspective</div>
              </div>

              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      switchRole(acc.role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      role === acc.role 
                        ? 'bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-300 dark:border-cyan-500/40 text-cyan-900 dark:text-white font-medium shadow-sm' 
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/20" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white font-['Outfit']">{acc.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{acc.title}</div>
                      </div>
                    </div>
                    {getRoleBadge(acc.role)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
