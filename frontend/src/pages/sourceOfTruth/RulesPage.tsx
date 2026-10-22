// src/pages/sourceOfTruth/RulesPage.tsx
import React, { useState, useEffect } from 'react';
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

  const handleApproveProposed = (id: string) => {
    const target = proposedRules.find(r => r.id === id);
    if (!target) return;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Rulebook & Rule Compiler</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Turn guideline PDFs into structured, testable rules with citations. A human approves every rule before it is enforced.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'active' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('compiler')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === 'compiler' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rulebook Compiler</span>
            {proposedRules.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
            {['all', 'tone', 'terminology', 'claims', 'messaging', 'visual', 'accessibility'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/80">
                        {rule.rule_code}
                      </span>
                      <SeverityBadge severity={rule.severity} />
                    </div>
                    <span className="text-[11px] capitalize text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {rule.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1">{rule.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{rule.description}</p>

                  {/* Examples */}
                  {(rule.good_example || rule.bad_example) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono mb-3">
                      {rule.bad_example && (
                        <div className="p-2 rounded bg-rose-950/20 border border-rose-900/30 text-rose-300">
                          <span className="text-[10px] text-rose-500 uppercase font-sans font-bold block mb-0.5">Bad Example</span>
                          "{rule.bad_example}"
                        </div>
                      )}
                      {rule.good_example && (
                        <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/30 text-emerald-300">
                          <span className="text-[10px] text-emerald-500 uppercase font-sans font-bold block mb-0.5">Good Example</span>
                          "{rule.good_example}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citation */}
                  {rule.source_document && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-800">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Source: {rule.source_document} {rule.source_page ? `(Page ${rule.source_page})` : ''}</span>
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
          <div className="p-8 rounded-2xl border-2 border-dashed border-indigo-900/60 bg-slate-900/60 text-center hover:border-indigo-600/80 transition">
            <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">Upload Guideline Document (PDF / DOCX)</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Our parser analyzes brand guidelines, maps them to page citations, and drafts actionable test rules for human sign-off.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleSimulateCompiler}
                disabled={isCompiling}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
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
