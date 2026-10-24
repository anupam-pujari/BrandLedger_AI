// src/components/common/OriginBadge.tsx
import React from 'react';
import { Code2, Sparkles } from 'lucide-react';

interface OriginBadgeProps {
  checkType: 'rule' | 'ai' | 'rule_check' | 'ai_assisted' | string;
  className?: string;
}

export const OriginBadge: React.FC<OriginBadgeProps> = ({ checkType, className = '' }) => {
  if (checkType === 'rule' || checkType === 'rule_check') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-['Outfit'] ${className}`}
        title="Deterministic exact match from regex or rulebook code (<15ms)"
      >
        <Code2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
        <span>Rule check</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)] font-['Outfit'] ${className}`}
      title="Evaluated via verified LLM judgement call (tone or claim analysis)"
    >
      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
      <span>AI-assisted</span>
    </span>
  );
};
