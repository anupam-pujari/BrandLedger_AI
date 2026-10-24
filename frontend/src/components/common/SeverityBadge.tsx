// src/components/common/SeverityBadge.tsx
import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { FindingSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: FindingSeverity | 'success';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  switch (severity) {
    case 'critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)] tracking-wide font-['Outfit'] ${className}`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>CRITICAL</span>
        </span>
      );
    case 'warning':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] tracking-wide font-['Outfit'] ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>WARNING</span>
        </span>
      );
    case 'info':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] tracking-wide font-['Outfit'] ${className}`}
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>INFO</span>
        </span>
      );
    case 'success':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] tracking-wide font-['Outfit'] ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>CLEAN</span>
        </span>
      );
    default:
      return null;
  }
};
