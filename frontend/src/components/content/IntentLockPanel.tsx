// src/components/content/IntentLockPanel.tsx
import React, { useState } from 'react';
import { Lock, ChevronDown, ChevronUp, Target, Users, MessageSquare, ShieldCheck, Edit2, Check } from 'lucide-react';

interface IntentLockPanelProps {
  purpose?: string;
  audience?: string;
  keyMessage?: string;
  onUpdate?: (data: { purpose: string; audience: string; keyMessage: string }) => void;
  editable?: boolean;
}

export const IntentLockPanel: React.FC<IntentLockPanelProps> = ({
  purpose = 'Product Announcement',
  audience = 'Enterprise DevOps & Security Leads',
  keyMessage = 'Highlight high availability (99.99%) without unverified performance guarantees',
  onUpdate,
  editable = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({ purpose, audience, keyMessage });

  const handleSave = () => {
    onUpdate?.(formState);
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl border border-sky-300/80 dark:border-sky-500/30 bg-gradient-to-r from-sky-50/90 via-white to-sky-50/50 dark:from-sky-950/40 dark:via-slate-900/40 dark:to-slate-900/60 overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-sky-100/40 dark:hover:bg-white/[0.03] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-xs dark:shadow-[0_0_12px_rgba(14,165,233,0.3)]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider uppercase font-['Outfit'] flex items-center gap-2">
              <span>Intent Lock</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-mono font-semibold border border-sky-200 dark:border-transparent">
                Protected Semantic Scope
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Suggestions must preserve these core parameters without drift
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Active
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 pt-2 border-t border-slate-200 dark:border-white/[0.08] text-xs">
          {isEditing ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                  Campaign Purpose
                </label>
                <input
                  type="text"
                  value={formState.purpose}
                  onChange={e => setFormState({ ...formState, purpose: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-[#060814] border border-slate-300 dark:border-white/[0.12] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formState.audience}
                  onChange={e => setFormState({ ...formState, audience: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-[#060814] border border-slate-300 dark:border-white/[0.12] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                  Core Message &amp; Value Proposition
                </label>
                <input
                  type="text"
                  value={formState.keyMessage}
                  onChange={e => setFormState({ ...formState, keyMessage: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-[#060814] border border-slate-300 dark:border-white/[0.12] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Lock</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-colors shadow-2xs">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold mb-1 font-['Outfit']">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Purpose</span>
                </div>
                <div className="text-slate-900 dark:text-white font-medium">{purpose}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] hover:border-cyan-400 dark:hover:border-cyan-500/30 transition-colors shadow-2xs">
                <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-bold mb-1 font-['Outfit']">
                  <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Audience</span>
                </div>
                <div className="text-slate-900 dark:text-white font-medium">{audience}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-colors shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold mb-1 font-['Outfit']">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Key Message</span>
                </div>
                <div className="text-slate-900 dark:text-white font-medium truncate" title={keyMessage}>
                  {keyMessage}
                </div>
              </div>

              {editable && (
                <div className="md:col-span-3 flex justify-end pt-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors font-semibold px-2 py-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Parameters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
