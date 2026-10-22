// src/context/UIContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIContextType {
  rulesOnlyMode: boolean;
  toggleRulesOnlyMode: () => void;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  toasts: Toast[];
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rulesOnlyMode, setRulesOnlyMode] = useState<boolean>(() => {
    return localStorage.getItem('brandproof_rules_only') === 'true';
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

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
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-lg shadow-elevated border text-sm animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-800'
                : 'bg-slate-900/90 text-slate-200 border-slate-700'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-3 text-slate-400 hover:text-white"
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
