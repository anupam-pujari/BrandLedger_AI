// src/components/common/PassportPill.tsx
import React from 'react';
import { CheckCircle2, Clock, AlertOctagon, HelpCircle } from 'lucide-react';
import { ClaimStatus } from '../../types';

interface PassportPillProps {
  status: ClaimStatus;
  className?: string;
  expiryDate?: string;
}

export const PassportPill: React.FC<PassportPillProps> = ({ status, className = '', expiryDate }) => {
  switch (status) {
    case 'supported':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-['Outfit'] ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Claim Verified</span>
        </span>
      );
    case 'outdated':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-['Outfit'] ${className}`}
          title={expiryDate ? `Expired on ${expiryDate}` : 'Source fact has expired'}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Fact Expired {expiryDate ? `(${expiryDate})` : ''}</span>
        </span>
      );
    case 'conflicting':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)] font-['Outfit'] ${className}`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>Fact Conflict</span>
        </span>
      );
    case 'unsupported':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-white/[0.12] shadow-[0_0_10px_rgba(0,0,0,0.3)] font-['Outfit'] ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Unverified Claim</span>
        </span>
      );
  }
};
