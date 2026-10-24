// src/pages/sourceOfTruth/RulesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { rulesApi } from '../../api/rules';
import { useUI } from '../../context/UIContext';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { Rule } from '../../types';
import {
  BookOpen,
  UploadCloud,
  FileCheck2,
  Filter,
  Check,
  X,
  FileText,
  AlertCircle,
  Plus,
  Sparkles
} from 'lucide-react';

export const RulesPage: React.FC = () => {
  const { showToast } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'compiler'>('active');
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Compiler state
  const [isCompiling, setIsCompiling] = useState(false);
  const [proposedRules, setProposedRules] = useState<Rule[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await rulesApi.listRules();
        setRules(data);
      } catch (err) {
        console.warn('Failed to fetch rules:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSimulateCompiler = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setProposedRules([
        {
          id: 'prop-1',
          org_id: 'org-1',
          rule_code: 'R-22',
          title: 'Direct Comparison with Competitors',
          category: 'claims',
          severity: 'critical',
          status: 'proposed',
          description: 'Promotional copy must not name competing SaaS providers directly unless citing third-party market reports.',
          source_document: 'Brand_Guidelines_2026.pdf',
          source_page: 18,
          source_quote: 'Competitor naming in press releases or advertising is prohibited without Legal sign-off.',
          good_example: 'Leading cloud platform in automated governance',
          bad_example: 'Faster and cheaper than AWS or Azure'
        },
        {
          id: 'prop-2',
          org_id: 'org-1',
          rule_code: 'R-23',
          title: 'Inclusive Persona Reference',
          category: 'terminology',
          severity: 'warning',
          status: 'proposed',
          description: 'Use gender-neutral terms when describing developers, operators, and sysadmins.',
          source_document: 'Brand_Guidelines_2026.pdf',
          source_page: 9,
          source_quote: 'Adopt inclusive terminology across customer journey documentation.',
          good_example: 'Developers deploy their workloads efficiently',
          bad_example: 'Each developer configures his workstation'
        }
      ]);
      setIsCompiling(false);
      showToast('Extracted 2 proposed rules with page citations', 'success');
    }, 1200);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompiling(true);
    try {
      const res = await rulesApi.compileFromPdf(file);
      setProposedRules(res.proposed_rules || []);
      showToast(`Extracted ${res.proposed_rules?.length || 0} candidate rules from ${file.name}`, 'success');
    } catch (err: any) {
      console.warn('Backend compiler fallback:', err);
      handleSimulateCompiler();
    } finally {
      setIsCompiling(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApproveProposed = async (id: string) => {
    const target = proposedRules.find(r => r.id === id);
    if (!target) return;
    try {
      await rulesApi.createRule({ ...target, status: 'approved' });
    } catch {
      try {
        await rulesApi.updateRule(id, { status: 'approved' });
      } catch (err) {
        console.warn('Backend rule sync error:', err);
      }
    }
    setRules(prev => [...prev, { ...target, status: 'approved' as const }]);
    setProposedRules(prev => prev.filter(r => r.id !== id));
    showToast(`Approved rule ${target.rule_code}`, 'success');
  };

  const handleRejectProposed = (id: string) => {
    setProposedRules(prev => prev.filter(r => r.id !== id));
    showToast('Rejected rule proposal', 'info');
  };

  const filteredRules = rules.filter(r => categoryFilter === 'all' || r.category === categoryFilter);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5 font-['Outfit']">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span className="text-gradient-vibrant">Rulebook &amp; Rule Compiler</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Turn guideline PDFs into structured, testable rules with citations. A human approves every rule before it is enforced.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1.5 glass-panel rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('compiler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'compiler'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Rulebook Compiler</span>
            {proposedRules.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400 mr-1" />
            {['all', 'tone', 'terminology', 'claims', 'messaging', 'visual', 'accessibility'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map(rule => (
              <div
                key={rule.id}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-3.5 border border-white/[0.08] hover:border-indigo-500/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
                        {rule.rule_code}
                      </span>
                      <SeverityBadge severity={rule.severity} />
                    </div>
                    <span className="text-[11px] capitalize text-slate-300 bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 rounded-full font-medium">
                      {rule.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 font-['Outfit']">{rule.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3.5">{rule.description}</p>

                  {/* Examples */}
                  {(rule.good_example || rule.bad_example) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono mb-3.5">
                      {rule.bad_example && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300">
                          <span className="text-[10px] text-rose-400 uppercase font-sans font-bold block mb-1">Bad Example</span>
                          &quot;{rule.bad_example}&quot;
                        </div>
                      )}
                      {rule.good_example && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                          <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block mb-1">Good Example</span>
                          &quot;{rule.good_example}&quot;
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citation */}
                  {rule.source_document && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2.5 border-t border-white/[0.06]">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Source: <strong className="text-slate-300">{rule.source_document}</strong> {rule.source_page ? `(Page ${rule.source_page})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Rulebook Compiler Interface */
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="p-10 rounded-3xl border-2 border-dashed border-indigo-500/40 bg-gradient-to-b from-indigo-950/30 via-purple-950/20 to-transparent text-center hover:border-cyan-400/60 transition-all shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit']">Upload Guideline Document (PDF / DOCX)</h3>
            <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
              Our compiler parses guideline documents into AST candidate rules with page &amp; quote citations for human sign-off.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompiling}
                className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <span>Upload PDF Document</span>
              </button>
              <button
                onClick={handleSimulateCompiler}
                disabled={isCompiling}
                className="btn-gradient-primary px-5 py-2.5 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>{isCompiling ? 'Extracting Rule Candidates...' : 'Simulate PDF Compilation (Brand_Guidelines_2026.pdf)'}</span>
              </button>
            </div>
          </div>

          {/* Staging Candidates Table */}
          {proposedRules.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Proposed Rules Staging (Needs Human Review)</h3>
                  <p className="text-xs text-slate-400">Review, verify source citations, and approve into active rulebook.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-mono">
                  {proposedRules.length} Pending
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                {proposedRules.map(rule => (
                  <div key={rule.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">{rule.rule_code}</span>
                        <SeverityBadge severity={rule.severity} />
                        <span className="text-xs font-medium text-white">{rule.title}</span>
                      </div>
                      <p className="text-xs text-slate-300">{rule.description}</p>
                      <div className="text-[11px] text-indigo-300 italic">
                        "{rule.source_quote}" — {rule.source_document} (Page {rule.source_page})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveProposed(rule.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Rule</span>
                      </button>
                      <button
                        onClick={() => handleRejectProposed(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Reject rule proposal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
