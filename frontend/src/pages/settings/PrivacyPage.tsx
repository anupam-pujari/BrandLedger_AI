// src/pages/settings/PrivacyPage.tsx
import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { Lock, Shield, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const { rulesOnlyMode, toggleRulesOnlyMode, showToast } = useUI();
  const [provider, setProvider] = useState('gemini');
  const [maskEmails, setMaskEmails] = useState(true);
  const [maskPhones, setMaskPhones] = useState(true);
  const [maskConfidential, setMaskConfidential] = useState(true);

  const handleSave = () => {
    showToast('Privacy & AI settings saved successfully.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>AI Privacy, Data Isolation & Security Settings</span>
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Control model inference engines, configure automated PII sanitization gates, or activate zero-AI rules-only mode.
        </p>
      </div>

      <div className="space-y-5">
        {/* Rules-Only Mode Card */}
        <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/20 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Rules-Only Mode (Zero-AI Invocations)</h3>
                <p className="text-xs text-slate-600 dark:text-blue-300/80">
                  When enabled, all external LLM calls are disabled. The platform audits copy strictly with local deterministic rule regexes, terminology matching, and WCAG contrast math.
                </p>
              </div>
            </div>

            <button
              onClick={toggleRulesOnlyMode}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                rulesOnlyMode
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {rulesOnlyMode ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* AI Model Engine Configuration */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI Model Engine</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'gemini', name: 'Google Gemini 2.5 Flash', tag: 'Fastest & Structured' },
              { id: 'openai', name: 'OpenAI GPT-4o-mini', tag: 'High Precision' },
              { id: 'local', name: 'Local Ollama / CPU', tag: '100% Offline' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setProvider(m.id)}
                className={`p-3.5 rounded-xl border text-left transition ${
                  provider === m.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-950 dark:text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{m.name}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">{m.tag}</div>
              </button>
            ))}
          </div>
        </div>

        {/* PII Scrubbing Gates */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Client-Side PII & Data Scrubbing Pre-Gates</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Scrub Author & Customer Email Addresses</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Replaces emails with anonymous tokens (e.g. [EMAIL-MASKED-1]) before model dispatch</span>
              </div>
              <input
                type="checkbox"
                checked={maskEmails}
                onChange={e => setMaskEmails(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Scrub Phone Numbers & Contact Identifiers</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Sanitizes standard international and domestic numeric sequences</span>
              </div>
              <input
                type="checkbox"
                checked={maskPhones}
                onChange={e => setMaskPhones(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Scrub Confidential Internal Pricing & Architecture Tags</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Redacts internal codes marked as restricted by tenant policy</span>
              </div>
              <input
                type="checkbox"
                checked={maskConfidential}
                onChange={e => setMaskConfidential(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            Save Security & Privacy Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
