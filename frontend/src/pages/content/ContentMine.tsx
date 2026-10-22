// src/pages/content/ContentMine.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contentApi } from '../../api/content';
import { ContentItem } from '../../types';
import {
  FileText,
  FilePlus,
  GitCompare,
  Download,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';

export const ContentMine: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const list = await contentApi.listContent(statusFilter === 'all' ? undefined : statusFilter, user?.id);
        setItems(list);
      } catch (err) {
        console.warn('Failed to load user content:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">Approved</span>;
      case 'in_review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">In Review</span>;
      case 'changes_requested':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800">Changes Requested</span>;
      case 'checked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">Checked</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">Draft</span>;
    }
  };

  const handleDownloadPdf = async (id: string, title: string) => {
    try {
      const blob = await contentApi.exportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandproof-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDF export failed or content is not yet approved.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">My Drafts & Submissions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your content drafts, inspect version diffs, and track review status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/content/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Draft</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
        {['all', 'draft', 'checked', 'in_review', 'changes_requested', 'approved'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading submissions...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No submissions found in this filter category.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {items.map(item => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="capitalize">{item.content_type} format</span>
                    <span>·</span>
                    <span>v{item.current_version?.version_number || 1}</span>
                    <span>·</span>
                    <span>{item.intent_purpose || 'General Draft'}</span>
                    {item.updated_at && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Link
                    to={`/content/${item.id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                  >
                    Open Workspace
                  </Link>

                  <Link
                    to={`/content/${item.id}/diff`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                    title="View text diff across versions"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Diff</span>
                  </Link>

                  {item.status === 'approved' && (
                    <button
                      onClick={() => handleDownloadPdf(item.id, item.title)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-800 transition"
                      title="Download Certified Compliance Record"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Record</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
