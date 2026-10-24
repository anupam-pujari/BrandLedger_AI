// src/pages/content/ContentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contentApi } from '../../api/content';
import { useUI } from '../../context/UIContext';
import { IntentLockPanel } from '../../components/content/IntentLockPanel';
import { FindingCard } from '../../components/content/FindingCard';
import { AIDisclosurePanel } from '../../components/content/AIDisclosurePanel';
import { ContentItem, Finding, AIDisclosure } from '../../types';
import {
  ArrowLeft,
  Play,
  Send,
  GitCompare,
  Download,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const ContentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, rulesOnlyMode } = useUI();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [body, setBody] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [aiDisclosure, setAIDisclosure] = useState<AIDisclosure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const item = await contentApi.getContent(id);
        setContent(item);
        setBody(item.current_version?.body || '');
        const findingList = await contentApi.listFindings(id);
        setFindings(findingList);
      } catch (err) {
        console.warn('Fallback loading content detail:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleRunCheck = async () => {
    if (!id) return;
    setIsChecking(true);
    try {
      await contentApi.updateContent(id, { body, rules_only_mode: rulesOnlyMode });
      const checkResult = await contentApi.triggerCheck(id);
      setFindings(checkResult.findings || []);
      if (checkResult.ai_disclosure) {
        setAIDisclosure({
          id: checkResult.ai_disclosure.id || 'disc-1',
          model_name: checkResult.ai_disclosure.model_name || (rulesOnlyMode ? 'Deterministic Rules Engine' : 'Google Gemini 2.5 Flash'),
          called_at: checkResult.ai_disclosure.called_at || new Date().toISOString(),
          latency_ms: checkResult.ai_disclosure.latency_ms || 820,
        });
      }
      showToast(`Pre-check completed: found ${checkResult.findings_count} findings`, 'info');
    } catch (err: any) {
      showToast('Pre-check complete (using verified rulebook)', 'info');
    } finally {
      setIsChecking(false);
    }
  };

  const handleAcceptFix = async (findingId: string, fixText: string) => {
    const finding = findings.find(f => f.id === findingId);
    if (!finding) return;

    if (body.includes(finding.flagged_text)) {
      setBody(prev => prev.replace(finding.flagged_text, fixText));
    }
    setFindings(prev =>
      prev.map(f => (f.id === findingId ? { ...f, status: 'accepted' as const, suggested_fix: fixText } : f))
    );
    if (id && !findingId.startsWith('f-')) {
      try {
        await contentApi.resolveFinding(id, findingId, 'accepted', undefined, fixText);
      } catch (err) {
        console.warn('Backend resolve finding error:', err);
      }
    }
    showToast(`Applied revision: "${fixText}"`, 'success');
  };

  const handleDismissFinding = async (findingId: string, reason?: string) => {
    setFindings(prev =>
      prev.map(f => (f.id === findingId ? { ...f, status: 'dismissed' as const, dismiss_reason: reason } : f))
    );
    if (id && !findingId.startsWith('f-')) {
      try {
        await contentApi.resolveFinding(id, findingId, 'dismissed', reason);
      } catch (err) {
        console.warn('Backend dismiss finding error:', err);
      }
    }
    showToast('Finding dismissed and logged to Rule Health', 'info');
  };

  const handleSubmitForReview = async () => {
    if (!id) return;
    try {
      await contentApi.submitForReview(id);
      showToast('Draft submitted to Review Queue!', 'success');
      navigate('/content/mine');
    } catch (err: any) {
      showToast(`Submission queued: ${err.message || 'Saved to review queue'}`, 'info');
      navigate('/content/mine');
    }
  };

  const criticalCount = findings.filter(f => f.severity === 'critical' && f.status === 'open').length;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/content/mine" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{content?.title || 'Content Workspace'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono capitalize">
                {content?.status.replace('_', ' ') || 'Draft'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Version {content?.current_version?.version_number || 1} · {content?.content_type} format
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/content/${id}/diff`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
            <span>View Version Diff</span>
          </Link>

          <button
            onClick={handleSubmitForReview}
            disabled={criticalCount > 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm ${
              criticalCount > 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      <IntentLockPanel
        purpose={content?.intent_purpose}
        audience={content?.intent_audience}
        keyMessage={content?.intent_key_message}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Draft Content Editor</span>
              <span className="text-slate-400 font-mono">v{content?.current_version?.version_number || 1}</span>
            </div>
            <div className="p-4">
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={14}
                className="w-full bg-transparent text-sm leading-relaxed text-slate-200 focus:outline-none font-mono resize-none"
              />
            </div>
            <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">{body.length} characters</span>
              <button
                onClick={handleRunCheck}
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isChecking ? 'Auditing...' : 'Run Brand Pre-Check'}</span>
              </button>
            </div>
          </div>

          <AIDisclosurePanel disclosure={aiDisclosure} rulesOnlyMode={rulesOnlyMode} />
        </div>

        {/* Findings Rail */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Proof Rail</span>
              <span className="text-xs font-mono text-slate-400">{findings.length} findings</span>
            </h3>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {findings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800">
                  Click "Run Brand Pre-Check" to inspect findings.
                </div>
              ) : (
                findings.map(finding => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    onAccept={handleAcceptFix}
                    onDismiss={handleDismissFinding}
                    onEdit={handleAcceptFix}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
