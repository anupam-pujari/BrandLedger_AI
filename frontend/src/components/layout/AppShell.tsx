// src/components/layout/AppShell.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUI } from '../../context/UIContext';

export const AppShell: React.FC = () => {
  const { isSidebarCollapsed, theme } = useUI();

  return (
    <div className="flex h-screen overflow-hidden font-sans relative transition-colors duration-300 bg-slate-50 dark:bg-[#060814] text-slate-800 dark:text-slate-100">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="fixed -top-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-transparent dark:from-cyan-500/20 dark:via-blue-600/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -left-32 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-500/12 via-teal-500/10 to-transparent dark:from-emerald-500/15 dark:via-cyan-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed -bottom-32 right-10 w-[550px] h-[550px] bg-gradient-to-tl from-amber-500/10 via-orange-500/10 to-transparent dark:from-amber-500/12 dark:via-rose-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main App Layout */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300">
          <Header />
          <main className="flex-1 overflow-y-auto p-5 md:p-8 relative">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
