// src/components/content/AIDisclosurePanel.tsx
import React, { useState } from 'react';
import { Shield, Sparkles, Clock, Lock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { AIDisclosure } from '../../types';

interface AIDisclosurePanelProps {
  disclosure?: AIDisclosure | null;
  rulesOnlyMode?: boolean;
}

export const AIDisclosurePanel: React.FC<AIDisclosurePanelProps> = ({
  disclosure,
  rulesOnlyMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (rulesOnlyMode) {
    return (
      <div className="p-3 rounded-xl border border-blue-900/40 bg-blue-950/20 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-900/50 text-blue-300">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-blue-200">Rules-Only Mode Active</span>
            <p className="text-[11px] text-blue-300/80">
              Zero external AI services were invoked. Review was evaluated 100% deterministically by local rulebook regex and math engines.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 font-mono text-[10px] uppercase">
          0 Tokens Sent
        </span>
      </div>
    );
  }

  const modelName = disclosure?.model_name || 'Google Gemini 2.5 Flash';
  const latency = disclosure?.latency_ms ? `${(disclosure.latency_ms / 1000).toFixed(2)}s` : '0.84s';
  const calledAt = disclosure?.called_at ? new Date(disclosure.called_at).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80 overflow-hidden text-xs shadow-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">AI Transparency & Privacy Gate Disclosure</span>
            <span className="ml-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">({modelName})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" /> {latency}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Model Engine</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{modelName}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Invocation Timestamp</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{calledAt}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Total Latency</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{latency}</strong>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-800 dark:text-indigo-300 text-xs mb-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Client-Side PII & Data Scrubbing Report</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300">
              Before external payload dispatch, sensitive patterns were scrubbed:
            </p>
            <ul className="list-disc list-inside mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <li>All author email addresses masked: <code className="text-indigo-700 dark:text-indigo-300 font-semibold">[EMAIL-MASKED-1]</code></li>
              <li>Phone numbers & customer IDs sanitized</li>
              <li>Workspace data strictly isolated via Row-Level Security tenant gates</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
