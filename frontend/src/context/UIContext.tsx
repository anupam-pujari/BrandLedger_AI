// src/context/UIContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ThemeMode = 'light' | 'dark';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  rulesOnlyMode: boolean;
  toggleRulesOnlyMode: () => void;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  toasts: Toast[];
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('brandproof_theme') as ThemeMode;
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('brandproof_sidebar_collapsed') === 'true';
  });

  const [rulesOnlyMode, setRulesOnlyMode] = useState<boolean>(() => {
    return localStorage.getItem('brandproof_rules_only') === 'true';
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('brandproof_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('brandproof_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleRulesOnlyMode = () => {
    setRulesOnlyMode(prev => {
      const next = !prev;
      localStorage.setItem('brandproof_rules_only', String(next));
      return next;
    });
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <UIContext.Provider
      value={{
        theme,
        toggleTheme,
        isSidebarCollapsed,
        toggleSidebar,
        rulesOnlyMode,
        toggleRulesOnlyMode,
        showToast,
        dismissToast,
        toasts,
      }}
    >
      {children}
      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-xl shadow-2xl border text-sm animate-fade-in backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 dark:bg-emerald-950/90 bg-emerald-50 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-950/90 dark:bg-rose-950/90 bg-rose-50 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 dark:bg-amber-950/90 bg-amber-50 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-800'
                : 'bg-slate-900/90 dark:bg-slate-900/90 bg-white text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            <span className="font-medium text-xs">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-3 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
