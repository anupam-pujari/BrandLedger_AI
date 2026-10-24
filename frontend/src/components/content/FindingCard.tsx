// src/components/content/FindingCard.tsx
import React, { useState } from 'react';
import { SeverityBadge } from '../common/SeverityBadge';
import { OriginBadge } from '../common/OriginBadge';
import { PassportPill } from '../common/PassportPill';
import { Modal } from '../common/Modal';
import { Finding } from '../../types';
import { FileText, Check, Edit3, X, AlertCircle, ShieldAlert } from 'lucide-react';

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

  const getBorderAccent = () => {
    switch (finding.severity) {
      case 'critical':
        return 'border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-950/25 via-slate-900/60 to-slate-900/80';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/80';
      case 'info':
      default:
        return 'border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-slate-900/80';
    }
  };

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 ${getBorderAccent()} ${
          isFocused
            ? 'border-indigo-500/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50'
            : 'border-white/[0.08] hover:border-white/[0.16] shadow-lg'
        }`}
      >
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <OriginBadge checkType={finding.check_type} />
            {finding.proof?.claim_status && (
              <PassportPill
                status={finding.proof.claim_status}
                expiryDate={finding.proof.matched_fact_expiry}
              />
            )}
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300 font-semibold">
            {finding.proof?.rule_code || (finding as any).rule_code || finding.proof?.fact_code || (finding as any).fact_code || finding.category.toUpperCase()}
          </span>
        </div>

        {/* Title & issue */}
        <h4 className="text-sm font-bold text-white mb-1 font-['Outfit']">{finding.title}</h4>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">{finding.description}</p>

        {/* Flagged excerpt */}
        <div className="mb-3 p-2.5 rounded-xl bg-[#060814]/90 border border-rose-500/30 text-xs font-mono text-rose-300 shadow-inner">
          <span className="text-slate-500 select-none mr-2 font-sans font-semibold">Flagged:</span>
          &quot;{finding.flagged_text}&quot;
        </div>

        {/* Proof citation box */}
        {(finding.proof?.source_document || finding.proof?.source_quote || (finding as any).evidence_quote) && (
          <div className="mb-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1 font-['Outfit']">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                PROOF: {finding.proof?.source_document || 'Brand Guidelines'}
                {finding.proof?.source_page ? ` (Page ${finding.proof.source_page})` : ''}
              </span>
            </div>
            {(finding.proof?.source_quote || (finding as any).evidence_quote) && (
              <p className="text-slate-300 italic text-[11px] leading-relaxed">
                &quot;{finding.proof?.source_quote || (finding as any).evidence_quote}&quot;
              </p>
            )}
          </div>
        )}

        {/* Confidence indicator */}
        {needsHumanJudgement && (
          <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Needs human judgement — confidence {Math.round(confidence * 100)}%</span>
          </div>
        )}

        {/* Suggested fix section */}
        {finding.suggested_fix && (
          <div className="mb-3 p-3 rounded-xl bg-[#060814]/80 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-['Outfit'] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Suggested Fix
              </span>
            </div>
            {isEditing ? (
              <div className="mt-1">
                <textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-indigo-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md shadow-indigo-600/30"
                  >
                    Save Revision
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-emerald-300 font-medium">&quot;{finding.suggested_fix}&quot;</p>
            )}
          </div>
        )}

        {/* Action Suite */}
        {finding.status === 'open' && !isEditing && (
          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              {finding.suggested_fix && (
                <>
                  <button
                    onClick={() => onAccept(finding.id, finding.suggested_fix!)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5"
                    title="Accept suggestion (replaces flagged text)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Fix</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.10] text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-white/[0.10] transition-all"
                    title="Edit suggestion before applying"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>
                </>
              )}
            </div>

            <button
              onClick={handleDismissClick}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
              title="Dismiss this finding"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {/* Resolved status display */}
        {finding.status !== 'open' && (
          <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span>Status: <strong className="capitalize text-slate-200 font-semibold">{finding.status}</strong></span>
            {finding.dismiss_reason && (
              <span className="italic truncate max-w-[220px] text-slate-400" title={finding.dismiss_reason}>
                &quot;{finding.dismiss_reason}&quot;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dismissal Justification Modal */}
      <Modal
        isOpen={showDismissModal}
        onClose={() => setShowDismissModal(false)}
        title={`Dismiss ${finding.severity.toUpperCase()} Finding`}
        description="To ensure brand compliance and auditability, please provide a justification for this override."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[#060814] border border-white/[0.08] text-xs font-mono text-slate-300">
            Flagged: &quot;{finding.flagged_text}&quot;
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-['Outfit']">
              Override Reason / Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={dismissReason}
              onChange={e => {
                setDismissReason(e.target.value);
                setDismissError('');
              }}
              placeholder="e.g. Approved temporary exception by VP Marketing; Legal addendum on file..."
              className="w-full p-3 bg-[#060814] border border-white/[0.12] focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none"
              rows={3}
            />
            {dismissError && <p className="text-xs text-rose-400 mt-1">{dismissError}</p>}
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              onClick={() => setShowDismissModal(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDismiss}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
            >
              Confirm Override & Dismiss
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
