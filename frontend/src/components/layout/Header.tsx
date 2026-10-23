// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { UserRole } from '../../types';
import {
  Bell,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Activity,
  UserCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, switchRole, org } = useAuth();
  const { rulesOnlyMode, toggleRulesOnlyMode } = useUI();
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">Brand Manager</span>;
      case 'reviewer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">Reviewer</span>;
      case 'creator':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">Creator</span>;
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">Admin</span>;
    }
  };

  return (
    <header className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Workspace Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold text-white tracking-wide">
            {org?.name || 'ApexCloud Technologies'}
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
            Tenant: {org?.slug || 'apexcloud'}
          </span>
        </div>

        {/* Backend health status badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            backendOnline === true
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : backendOnline === false
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title={backendOnline ? 'FastAPI Backend Online (port 8000)' : 'Backend offline (run uvicorn app.main:app)'}
        >
          <Activity className="w-3 h-3" />
          <span>{backendOnline ? 'Backend Connected' : backendOnline === false ? 'Mock Engine Active' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Right control cluster */}
      <div className="flex items-center gap-4">
        {/* Rules-Only Mode Switcher (FC3.4) */}
        <button
          onClick={toggleRulesOnlyMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            rulesOnlyMode
              ? 'bg-purple-950/80 text-purple-200 border-purple-700 shadow-sm'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-600'
          }`}
          title="Toggle Rules-Only Mode: bypass external LLMs and evaluate purely with local deterministic rules"
        >
          {rulesOnlyMode ? <Sliders className="w-3.5 h-3.5 text-purple-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{rulesOnlyMode ? 'Rules-Only: ON' : 'AI Review: Active'}</span>
        </button>

        {/* Notifications trigger */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="View notifications"
          title="3 notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* Quick Demo Persona / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition"
            aria-expanded={showRoleDropdown}
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=128'}
              alt={user?.fullName || 'User Avatar'}
              className="w-7 h-7 rounded-full object-cover border border-slate-600"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 leading-tight capitalize">{user?.role.replace('_', ' ')}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Role selector dropdown */}
          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-scale-up">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-semibold text-slate-200">Switch Persona (Demo Mode)</div>
                <div className="text-[11px] text-slate-400">Experience BrandProof from any role</div>
              </div>

              <div className="space-y-1">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      switchRole(acc.role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                      role === acc.role ? 'bg-indigo-950/80 border border-indigo-800/80 text-white' : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-medium text-white">{acc.name}</div>
                        <div className="text-[10px] text-slate-400">{acc.title}</div>
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
