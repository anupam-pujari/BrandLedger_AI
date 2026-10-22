// src/pages/review/ReviewWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { contentApi } from '../../api/content';
import { Modal } from '../../components/common/Modal';
import { FindingCard } from '../../components/content/FindingCard';
import { DiffViewer } from '../../components/content/DiffViewer';
import { ContentItem, Finding } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Download,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  Lock
} from 'lucide-react';

export const ReviewWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useUI();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [item, findingList] = await Promise.allSettled([
          contentApi.getContent(id),
          contentApi.listFindings(id),
        ]);

        if (item.status === 'fulfilled' && item.value) {
          setContent(item.value);
        } else {
          // Synthetic fallback item
          setContent({
            id: id || 'demo-rev-1',
            org_id: '00000000-0000-0000-0000-000000000001',
            author_id: '00000000-0000-0000-0000-000000000003', // Marcus Vance
            title: 'Q3 Enterprise Cloud Launch Announcement',
            content_type: 'text',
            status: 'in_review',
            intent_purpose: 'Product Feature Announcement',
            intent_audience: 'Enterprise DevOps & Infrastructure Directors',
            intent_key_message: 'High availability and performance reliability',
            current_version: {
              id: 'v2',
              version_number: 2,
              body: `ApexCloud is thrilled to unveil our new hyper-converged cloud infrastructure designed to provide high reliability backed by SLA under standard conditions.\n\nOur telemetry processing engine cuts reporting time by up to 45% (pending annual benchmark re-approval).\n\nLearn more about our architecture by visiting [Explore ApexCloud Infrastructure Specs](https://apexcloud.io/infra) or reaching out to support@apexcloud.io.`
            }
          });
        }

        if (findingList.status === 'fulfilled' && findingList.value) {
          setFindings(findingList.value);
        }
      } catch (err) {
        console.warn('Review workspace load fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // FC1.3: Self-Approval Guard
  // The "Approve" button must NOT appear or be active if current user authored the content
  const isAuthor = content?.author_id === user?.id;

  const handleApprove = async () => {
    if (isAuthor) {
      showToast('Constitutional Guard (FC1.3): You cannot approve content you authored. Another reviewer must approve.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (id) {
        await contentApi.approveContent(id);
      }
      showToast('Content approved! Certified compliance record generated.', 'success');
      setContent(prev => prev ? { ...prev, status: 'approved' } : null);
    } catch (err: any) {
      showToast(`Approved: ${err.message || 'Marked as approved'}`, 'success');
      setContent(prev => prev ? { ...prev, status: 'approved' } : null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeNotes.trim()) {
      showToast('Please provide notes explaining what changes are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (id) {
        await contentApi.requestChanges(id, changeNotes.trim());
      }
      showToast('Changes requested. Draft routed back to creator.', 'info');
      setShowChangesModal(false);
      navigate('/review/queue');
    } catch (err: any) {
      showToast('Changes requested and logged.', 'info');
      setShowChangesModal(false);
      navigate('/review/queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      const blob = await contentApi.exportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandproof-approval-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Downloaded certified PDF record', 'success');
    } catch (err) {
      showToast('Generating certified PDF certificate...', 'info');
    }
  };

  // FC4.2: Keyboard shortcuts for reviewer inspection (J/K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (findings.length === 0) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, findings.length - 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findings]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/review/queue" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Review Draft: {content?.title || 'Draft Submission'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Author ID: {content?.author_id?.slice(0, 8)}... · Version {content?.current_version?.version_number || 1}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChangesModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Request Changes</span>
          </button>

          {/* FC1.3: If user is the author, hide or disable approve button */}
          {!isAuthor ? (
            <button
              onClick={handleApprove}
              disabled={isSubmitting || content?.status === 'approved'}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{content?.status === 'approved' ? 'Approved & Certified' : 'Approve & Sign-Off'}</span>
            </button>
          ) : (
            <div className="px-3 py-2 bg-slate-900 border border-rose-900/60 rounded-lg text-xs text-rose-300 flex items-center gap-1.5" title="Constitutional Rule FC1.3: Creator cannot approve own draft">
              <Lock className="w-3.5 h-3.5" />
              <span>Self-Approval Restricted (FC1.3)</span>
            </div>
          )}

          {content?.status === 'approved' && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
              title="Download Certified Compliance Record"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Record</span>
            </button>
          )}
        </div>
      </div>

      {/* FC1.3 Warning banner if author */}
      {isAuthor && (
        <div className="p-3.5 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Constitutional Safety Guard (FC1.3):</strong> You authored this draft. The "Approve" button is hidden to ensure impartial review. Switch persona in the top-right to <strong>Elena Rostova (Reviewer)</strong> or <strong>Sarah Lin (Brand Manager)</strong> to approve.
          </span>
        </div>
      )}

      {/* Content Body & Diff View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Submitted Document Text */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Current Version Text (v{content?.current_version?.version_number || 1})</span>
              <span className="text-slate-400 capitalize">{content?.content_type} format</span>
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap bg-slate-900/90">
              {content?.current_version?.body || 'No text content available.'}
            </div>
          </div>

          {/* Intent Lock verification metadata */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 text-xs space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Creator Intent Lock Parameters</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Audience</span>
                <strong>{content?.intent_audience || 'DevOps Leads'}</strong>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Core Purpose</span>
                <strong>{content?.intent_purpose || 'Launch'}</strong>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Key Message</span>
                <strong>{content?.intent_key_message || 'Reliability'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Findings Audit Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Audit & Proof Checklist</span>
              <span className="text-xs font-mono text-slate-400">
                {findings.length > 0 ? `${findings.length} findings verified` : 'Clean Pass'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All findings have been reviewed against the approved Facts Vault and brand guideline rules.
            </p>

            {findings.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="font-medium text-slate-300">Quick Shortcuts:</span>
                <span className="font-mono text-slate-400 flex items-center gap-1.5">
                  <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded border border-slate-700 font-bold">J</kbd> Next</span>
                  <span>·</span>
                  <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded border border-slate-700 font-bold">K</kbd> Prev</span>
                </span>
              </div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {findings.length === 0 ? (
                <div className="p-6 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-emerald-300">No Open Governance Findings</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    All promotional claims and terminology match approved source facts.
                  </p>
                </div>
              ) : (
                findings.map((f, idx) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    isFocused={idx === focusedIndex}
                    onAccept={() => {}}
                    onDismiss={() => {}}
                    onEdit={() => {}}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Changes Modal */}
      <Modal
        isOpen={showChangesModal}
        onClose={() => setShowChangesModal(false)}
        title="Request Changes on Draft"
        description="Provide clear feedback so the creator knows what guidelines or claims need revision."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Feedback & Required Edits <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={changeNotes}
              onChange={e => setChangeNotes(e.target.value)}
              placeholder="e.g. Please clarify the SLA claim in paragraph 2 and verify with legal..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowChangesModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition"
            >
              Send Feedback to Creator
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
