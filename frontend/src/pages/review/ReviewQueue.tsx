// src/pages/review/ReviewQueue.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contentApi } from '../../api/content';
import { ContentItem } from '../../types';
import {
  ClipboardCheck,
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  User,
  Filter
} from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await contentApi.listContent();
        // Filter drafts that are in review or ready for review
        const queue = list.filter(i => i.status === 'in_review' || i.status === 'checked');
        setItems(queue.length > 0 ? queue : list.slice(0, 4));
      } catch (err) {
        console.warn('Queue fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-400" />
            <span>Brand Review & Sign-Off Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review submitted drafts, verify claim passport citations, and authorize formal brand approval.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-3 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold">
            {items.length} Submissions Awaiting Decision
          </span>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading review queue...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No items pending review at this time.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {items.map(item => {
              const isSelfAuthored = item.author_id === user?.id;

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                        {item.status.replace('_', ' ')}
                      </span>
                      {isSelfAuthored && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                          Authored by You (Self-Approval Guard Active)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="capitalize">{item.content_type}</span>
                      <span>·</span>
                      <span>Version {item.current_version?.version_number || 1}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        Author ID: {item.author_id?.slice(0, 8)}...
                      </span>
                      {item.intent_purpose && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[240px]">Purpose: {item.intent_purpose}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      to={`/review/${item.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      <span>Review & Decide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
