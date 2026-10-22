// src/components/content/IntentLockPanel.tsx
import React, { useState } from 'react';
import { Lock, ChevronDown, ChevronUp, Target, Users, MessageSquare, ShieldCheck } from 'lucide-react';

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
    <div className="rounded-xl border border-indigo-900/50 bg-slate-900/70 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
              Intent Lock (Protected Semantic Scope)
            </h4>
            <p className="text-[11px] text-slate-400">
              Suggestions must preserve these core parameters without drift
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Active
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-1 border-t border-slate-800/60 text-xs">
          {isEditing ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={formState.audience}
                  onChange={e => setFormState({ ...formState, audience: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Core Purpose</label>
                <input
                  type="text"
                  value={formState.purpose}
                  onChange={e => setFormState({ ...formState, purpose: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Key Message (Immutable Goal)</label>
                <textarea
                  value={formState.keyMessage}
                  onChange={e => setFormState({ ...formState, keyMessage: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
                >
                  Save Intent Lock
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1 text-[11px]">
                  <Users className="w-3.5 h-3.5" />
                  <span>Target Audience</span>
                </div>
                <p className="text-slate-200">{audience || 'General Enterprise Audience'}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1 text-[11px]">
                  <Target className="w-3.5 h-3.5" />
                  <span>Core Purpose</span>
                </div>
                <p className="text-slate-200">{purpose || 'Product / Feature Communication'}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Key Message</span>
                </div>
                <p className="text-slate-200 line-clamp-2">{keyMessage || 'Core brand value proposition'}</p>
              </div>
            </div>
          )}

          {editable && !isEditing && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                Edit Intent Parameters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
