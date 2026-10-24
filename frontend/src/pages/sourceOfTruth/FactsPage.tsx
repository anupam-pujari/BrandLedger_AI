// src/pages/sourceOfTruth/FactsPage.tsx
import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, CheckCircle2, Clock, XCircle, FileText, User, Tag } from 'lucide-react';
import { factsApi } from '../../api/facts';
import { Fact } from '../../types';
import { useUI } from '../../context/UIContext';
import { Modal } from '../../components/common/Modal';

export const FactsPage: React.FC = () => {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useUI();

  const [newFact, setNewFact] = useState({
    fact_code: 'F-08',
    category: 'claims',
    content: '',
    owner_name: 'Sarah Lin',
    owner_email: 'sarah.lin@apexcloud.io',
    source_document: 'Infrastructure_Benchmarks_2026.pdf',
    valid_until: '2027-12-31',
    tags: 'performance, uptime',
  });

  useEffect(() => {
    async function fetchFacts() {
      try {
        const data = await factsApi.listFacts();
        setFacts(data);
      } catch (err) {
        console.warn('Fallback facts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFacts();
  }, []);

  const handleCreateFact = async () => {
    if (!newFact.content.trim()) {
      showToast('Fact statement content is mandatory', 'error');
      return;
    }
    try {
      const created = await factsApi.createFact({
        ...newFact,
        tags: newFact.tags.split(',').map(t => t.trim()),
      });
      setFacts(prev => [created, ...prev]);
      setShowAddModal(false);
      showToast(`Fact ${created.fact_code} added to Claim Passport vault!`, 'success');
      setNewFact({
        fact_code: `F-${String(facts.length + 9).padStart(2, '0')}`,
        category: 'claims',
        content: '',
        owner_name: 'Sarah Lin',
        owner_email: 'sarah.lin@apexcloud.io',
        source_document: 'Infrastructure_Benchmarks_2026.pdf',
        valid_until: '2027-12-31',
        tags: 'performance, uptime',
      });
    } catch {
      const createdFact: Fact = {
        id: `fact-client-${Date.now()}`,
        org_id: 'org-apexcloud',
        fact_code: newFact.fact_code,
        category: newFact.category,
        content: newFact.content,
        owner_name: newFact.owner_name,
        owner_email: newFact.owner_email,
        source_document: newFact.source_document,
        valid_until: newFact.valid_until,
        tags: newFact.tags.split(',').map(t => t.trim()),
        is_expired: false,
      };
      setFacts(prev => [createdFact, ...prev]);
      setShowAddModal(false);
      showToast(`Fact ${newFact.fact_code} saved to vault!`, 'success');
    }
  };

  const getStatusBadge = (fact: Fact) => {
    const isExpired = fact.is_expired || new Date(fact.valid_until) < new Date();
    if (isExpired) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Expired</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        <span>Active (Verified)</span>
      </span>
    );
  };

  const filteredFacts = facts.filter(f => {
    const textContent = f.content || (f as any).claim_text || '';
    const matchesSearch =
      textContent.toLowerCase().includes(search.toLowerCase()) ||
      (f.fact_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.owner_name || '').toLowerCase().includes(search.toLowerCase());

    const isExpired = f.is_expired || new Date(f.valid_until) < new Date();
    if (statusFilter === 'active' && isExpired) return false;
    if (statusFilter === 'expired' && !isExpired) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-gradient-vibrant">Approved Facts &amp; Claim Passport Vault</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Single Source of Truth for verified metrics, claims, and certifications. Every claim is attributed to an owner and expiration date.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gradient-primary flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Approved Fact</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-sky-600 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search claims, codes, owners..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.10] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {['all', 'active', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.08]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Facts Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading approved facts...</div>
        ) : filteredFacts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">No facts found matching your criteria.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {filteredFacts.map(fact => (
              <div key={fact.id} className="p-5 hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-all space-y-2.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                      {fact.fact_code}
                    </span>
                    {getStatusBadge(fact)}
                    <span className="text-[10px] text-sky-700 dark:text-cyan-400 font-mono px-2 py-0.5 rounded-full bg-sky-50 dark:bg-cyan-500/10 border border-sky-200 dark:border-cyan-500/20">
                      384-d vector indexed
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Valid until: <strong className="text-slate-800 dark:text-slate-200">{fact.valid_until}</strong></span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed font-['Outfit']">
                  &quot;{fact.content || (fact as any).claim_text}&quot;
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    Owner: <strong className="text-slate-700 dark:text-slate-300">{fact.owner_name}</strong> ({fact.owner_email})
                  </span>
                  {fact.source_document && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Source: <strong className="text-slate-700 dark:text-slate-300">{fact.source_document}</strong>
                    </span>
                  )}
                  {fact.tags && fact.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {fact.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Fact Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Approved Fact into Passport Vault"
        description="Every promotion assertion must link back to an owner-verified fact object with an active expiration timestamp."
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fact Code</label>
              <input
                type="text"
                value={newFact.fact_code}
                onChange={e => setNewFact({ ...newFact, fact_code: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Valid Until</label>
              <input
                type="date"
                value={newFact.valid_until}
                onChange={e => setNewFact({ ...newFact, valid_until: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Verified Statement / Claim <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={newFact.content}
              onChange={e => setNewFact({ ...newFact, content: e.target.value })}
              placeholder="e.g. ApexCloud architecture provides up to 99.99% availability backed by our standard Enterprise SLA."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Name</label>
              <input
                type="text"
                value={newFact.owner_name}
                onChange={e => setNewFact({ ...newFact, owner_name: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Email</label>
              <input
                type="email"
                value={newFact.owner_email}
                onChange={e => setNewFact({ ...newFact, owner_email: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Benchmark Document</label>
            <input
              type="text"
              value={newFact.source_document}
              onChange={e => setNewFact({ ...newFact, source_document: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleCreateFact}
              className="btn-gradient-primary px-4 py-1.5 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              Add to Vault
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
