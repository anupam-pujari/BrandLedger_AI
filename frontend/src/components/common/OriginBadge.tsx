// src/components/common/OriginBadge.tsx
import React from 'react';
import { Code2, Sparkles } from 'lucide-react';

interface OriginBadgeProps {
  checkType: 'rule' | 'ai';
  className?: string;
}

export const OriginBadge: React.FC<OriginBadgeProps> = ({ checkType, className = '' }) => {
  if (checkType === 'rule') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-950/70 text-purple-300 border border-purple-800/60 ${className}`}
        title="Deterministic exact match from regex or rulebook code"
      >
        <Code2 className="w-3.5 h-3.5 text-purple-400" />
        <span>Rule check</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 ${className}`}
      title="Evaluated via verified LLM judgement call (tone or claim analysis)"
    >
      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
      <span>AI-assisted</span>
    </span>
  );
};
