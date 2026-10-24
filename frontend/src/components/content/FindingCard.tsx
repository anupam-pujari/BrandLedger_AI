// src/components/content/FindingCard.tsx
import React, { useState } from 'react';
import { SeverityBadge } from '../common/SeverityBadge';
import { OriginBadge } from '../common/OriginBadge';
import { PassportPill } from '../common/PassportPill';
import { Modal } from '../common/Modal';
import { Finding } from '../../types';
import { FileText, Check, Edit3, X, AlertCircle } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  onAccept: (findingId: string, fixText: string) => void;
  onDismiss: (findingId: string, reason?: string) => void;
  onEdit: (findingId: string, customText: string) => void;
  isFocused?: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onAccept,
  onDismiss,
  onEdit,
  isFocused = false,
}) => {
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissError, setDismissError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(finding.suggested_fix || '');

  const isCriticalOrWarning = finding.severity === 'critical' || finding.severity === 'warning';
  const confidence = finding.confidence ?? 0.95;
  const needsHumanJudgement = confidence < 0.75;

  const handleDismissClick = () => {
    // FC1.2: Dismiss buttons for critical/warning findings must require a reason input
    if (isCriticalOrWarning) {
      setShowDismissModal(true);
    } else {
      onDismiss(finding.id);
    }
  };

  const handleConfirmDismiss = () => {
    if (isCriticalOrWarning && !dismissReason.trim()) {
      setDismissError('A justification is required to override critical or warning findings.');
      return;
    }
    onDismiss(finding.id, dismissReason.trim());
    setShowDismissModal(false);
  };

  const handleSaveEdit = () => {
    onEdit(finding.id, editedText);
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={`p-4 rounded-xl border transition-all ${
          isFocused
            ? 'bg-slate-900/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <OriginBadge checkType={finding.check_type} />
            {finding.proof?.claim_status && (
              <PassportPill
                status={finding.proof.claim_status}
                expiryDate={finding.proof.matched_fact_expiry}
              />
            )}
          </div>
          <span className="text-xs font-mono text-slate-400">
            {finding.proof?.rule_code || (finding as any).rule_code || finding.proof?.fact_code || (finding as any).fact_code || finding.category.toUpperCase()}
          </span>
        </div>

        {/* Title & issue */}
        <h4 className="text-sm font-semibold text-white mb-1">{finding.title}</h4>
        <p className="text-xs text-slate-300 mb-3">{finding.description}</p>

        {/* Flagged excerpt */}
        <div className="mb-3 p-2 rounded bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-rose-300">
          <span className="text-slate-500 select-none mr-2">Flagged:</span>
          "{finding.flagged_text}"
        </div>

        {/* Proof citation box (FC2.1) */}
        {(finding.proof?.source_document || finding.proof?.source_quote || (finding as any).evidence_quote) && (
          <div className="mb-3 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>
                PROOF: {finding.proof?.source_document || 'Brand Guidelines'}
                {finding.proof?.source_page ? ` (Page ${finding.proof.source_page})` : ''}
              </span>
            </div>
            {(finding.proof?.source_quote || (finding as any).evidence_quote) && (
              <p className="text-slate-300 italic">"{finding.proof?.source_quote || (finding as any).evidence_quote}"</p>
            )}
          </div>
        )}

        {/* Confidence indicator (FC2.3) */}
        {needsHumanJudgement && (
          <div className="mb-3 px-2 py-1 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Needs human judgement — confidence {Math.round(confidence * 100)}%</span>
          </div>
        )}

        {/* Suggested fix section */}
        {finding.suggested_fix && (
          <div className="mb-3 p-2.5 rounded-lg bg-slate-950 border border-emerald-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Suggested Fix
              </span>
            </div>
            {isEditing ? (
              <div className="mt-1">
                <textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500 font-medium"
                  >
                    Save Revision
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-emerald-200">"{finding.suggested_fix}"</p>
            )}
          </div>
        )}

        {/* Action Suite (FC1.1 - Explicit user action only) */}
        {finding.status === 'open' && !isEditing && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              {finding.suggested_fix && (
                <>
                  <button
                    onClick={() => onAccept(finding.id, finding.suggested_fix!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
                    title="Accept suggestion (replaces flagged text)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Fix</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
                    title="Edit suggestion before applying"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </>
              )}
            </div>

            <button
              onClick={handleDismissClick}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
              title="Dismiss this finding"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {/* Resolved status display */}
        {finding.status !== 'open' && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Status: <strong className="capitalize text-slate-200">{finding.status}</strong></span>
            {finding.dismiss_reason && (
              <span className="italic truncate max-w-[200px]" title={finding.dismiss_reason}>
                "{finding.dismiss_reason}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* FC1.2 Dismissal Justification Modal */}
      <Modal
        isOpen={showDismissModal}
        onClose={() => setShowDismissModal(false)}
        title={`Dismiss ${finding.severity.toUpperCase()} Finding`}
        description="To ensure brand compliance and auditability, please provide a justification for this override."
      >
        <div className="space-y-4">
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Flagged: "{finding.flagged_text}"
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Override Reason / Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={dismissReason}
              onChange={e => {
                setDismissReason(e.target.value);
                setDismissError('');
              }}
              placeholder="e.g. Approved temporary exception by VP Marketing; Legal addendum on file..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              rows={3}
            />
            {dismissError && <p className="text-xs text-rose-400 mt-1">{dismissError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDismissModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDismiss}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition"
            >
              Confirm Override & Dismiss
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
