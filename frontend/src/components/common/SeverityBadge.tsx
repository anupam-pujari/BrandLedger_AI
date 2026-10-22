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
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80 ${className}`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>CRITICAL</span>
        </span>
      );
    case 'warning':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>WARNING</span>
        </span>
      );
    case 'info':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80 ${className}`}
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>INFO</span>
        </span>
      );
    case 'success':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>CLEAN</span>
        </span>
      );
    default:
      return null;
  }
};
