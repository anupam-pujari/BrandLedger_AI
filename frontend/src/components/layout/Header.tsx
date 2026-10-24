// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { apiClient, getApiBaseUrl } from '../../api/client';
import {
  Bell,
  Sliders,
  ChevronDown,
  Sparkles,
  Activity,
  ShieldCheck,
  Sun,
  Moon,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  ExternalLink,
  Link2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface GovernanceNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'warning' | 'info' | 'alert' | 'success';
  link?: string;
}

const INITIAL_NOTIFICATIONS: GovernanceNotification[] = [
  {
    id: 'n1',
    title: 'Claim Renewal Notice',
    description: 'Fact F-07 ("Zero packet loss guarantee") requires annual telemetry proof renewal.',
    time: '10m ago',
    read: false,
    type: 'warning',
    link: '/source-of-truth/facts',
  },
  {
    id: 'n2',
    title: 'Draft Awaiting Review',
    description: 'Marcus Vance submitted "Q3 Enterprise Cloud Launch" for formal proof audit.',
    time: '25m ago',
    read: false,
    type: 'info',
    link: '/review/queue',
  },
  {
    id: 'n3',
    title: 'Ambiguous Rule Proposal',
    description: 'Rule R-14 has a 56% creator dispute rate. Clarifying wording ready for approval.',
    time: '1h ago',
    read: false,
    type: 'alert',
    link: '/governance/rule-health',
  },
  {
    id: 'n4',
    title: 'AST Rule Compiled',
    description: 'Guideline rule R-58 (Approved Palette Compliance) verified against Brand Guidelines PDF.',
    time: '3h ago',
    read: true,
    type: 'success',
    link: '/source-of-truth/rules',
  },
];

export const Header: React.FC = () => {
  const { user, role, switchRole, org } = useAuth();
  const { rulesOnlyMode, toggleRulesOnlyMode, theme, toggleTheme, showToast } = useUI();
  const navigate = useNavigate();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<GovernanceNotification[]>(INITIAL_NOTIFICATIONS);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [isTestingUrl, setIsTestingUrl] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkBackendHealth = async (urlToCheck?: string) => {
    const target = (urlToCheck || getApiBaseUrl()).replace(/\/$/, '');
    try {
      const res = await fetch(`${target}/health`);
      if (res.ok) {
        setBackendOnline(true);
        return true;
      }
      setBackendOnline(false);
      return false;
    } catch {
      setBackendOnline(false);
      return false;
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(() => {
      checkBackendHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveApiUrl = async () => {
    setIsTestingUrl(true);
    const cleanUrl = apiUrlInput.trim().replace(/\/$/, '');
    const isOk = await checkBackendHealth(cleanUrl);
    setIsTestingUrl(false);
    if (isOk) {
      apiClient.setApiUrl(cleanUrl);
      showToast('Backend connected successfully!', 'success');
      setShowApiModal(false);
    } else {
      showToast('Could not reach /health at that URL. Check the URL and backend status.', 'error');
    }
  };

  const handleResetApiUrl = () => {
    apiClient.setApiUrl(null);
    const defaultUrl = getApiBaseUrl();
    setApiUrlInput(defaultUrl);
    checkBackendHealth(defaultUrl);
    showToast('Reset to default API URL', 'info');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('Notifications cleared', 'info');
  };

  const handleNotificationClick = (item: GovernanceNotification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.link) {
      navigate(item.link);
      setShowNotifications(false);
    }
  };

  const getNotificationIcon = (type: GovernanceNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'alert':
        return <Sparkles className="w-4 h-4 text-rose-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };

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
    <header className="h-16 px-4 md:px-6 bg-white/80 dark:bg-[#0E1320]/95 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 backdrop-blur-2xl transition-colors duration-200">
      {/* Left section: Workspace Tag */}
      <div className="flex items-center gap-3">
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
        <button
          type="button"
          onClick={() => {
            setApiUrlInput(getApiBaseUrl());
            setShowApiModal(true);
          }}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer hover:shadow-sm hover:scale-[1.02] ${
            backendOnline === true
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 shadow-sm'
              : backendOnline === false
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
          }`}
          title="Click to configure backend URL or test connection"
        >
          <Activity className={`w-3 h-3 ${backendOnline ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{backendOnline ? 'Engine Connected' : backendOnline === false ? 'Offline' : 'Connecting...'}</span>
        </button>
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

        {/* Interactive Notifications Trigger & Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleDropdown(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-all"
            aria-label="View notifications"
            title={unreadCount > 0 ? `${unreadCount} unread governance notifications` : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0E1320] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-3.5 z-50 animate-scale-up border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F172A] shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">Governance Alerts</span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                      All caught up
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification items list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto my-1 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 my-1 ${
                        !item.read
                          ? 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">{getNotificationIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate font-['Outfit']">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Proof Engine v2.4</span>
                <button
                  onClick={clearAllNotifications}
                  className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear list</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Demo Persona / Role Switcher */}
        <div className="relative" ref={roleDropdownRef}>
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowNotifications(false);
            }}
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
            <div className="absolute right-0 mt-2 w-80 rounded-2xl p-2.5 z-50 animate-scale-up border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F172A] shadow-2xl backdrop-blur-2xl">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-2">
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

      {/* Backend API Connection Modal */}
      <Modal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title="Backend API Connection"
        description="Connect your BrandProof frontend to your deployed FastAPI backend service."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.08]">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Connection Status:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              backendOnline
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
            }`}>
              {backendOnline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {backendOnline ? 'Online (Engine Connected)' : 'Offline (Unreachable)'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Backend Service URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={apiUrlInput}
                onChange={e => setApiUrlInput(e.target.value)}
                placeholder="https://brand-ledger-ai-hlsl.vercel.app"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Production backend defaults to <code className="text-sky-600 dark:text-cyan-400 font-mono">https://brand-ledger-ai-hlsl.vercel.app</code>. Local dev defaults to <code className="text-slate-700 dark:text-slate-300 font-mono">http://localhost:8080</code>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-cyan-950/30 border border-sky-200 dark:border-cyan-800/40 text-[11px] text-sky-800 dark:text-cyan-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Permanent Vercel Configuration:
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              To configure this permanently for everyone in production, add an Environment Variable named <strong className="font-mono text-slate-900 dark:text-white">VITE_API_URL</strong> in your Vercel Frontend project settings.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetApiUrl}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium underline"
            >
              Reset to Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTestingUrl}
                onClick={handleSaveApiUrl}
                className="btn-gradient-primary flex items-center gap-1.5 px-4 py-1.5 text-xs text-white font-bold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {isTestingUrl && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isTestingUrl ? 'Testing...' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </header>
  );
};

