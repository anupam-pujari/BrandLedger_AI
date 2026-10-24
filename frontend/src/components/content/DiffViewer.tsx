// src/components/content/DiffViewer.tsx
import React, { useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';

interface DiffViewerProps {
  originalText: string;
  modifiedText: string;
  v1Number?: number;
  v2Number?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalText,
  modifiedText,
  v1Number = 1,
  v2Number = 2,
}) => {
  const diffs = useMemo(() => {
    const dmp = new DiffMatchPatch();
    const diff = dmp.diff_main(originalText || '', modifiedText || '');
    dmp.diff_cleanupSemantic(diff);
    return diff;
  }, [originalText, modifiedText]);

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diffs.forEach(([operation, text]) => {
      if (operation === 1) additions += text.length;
      if (operation === -1) deletions += text.length;
    });
    return { additions, deletions };
  }, [diffs]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900 overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">Version Diff</span>
          <span className="text-slate-500 dark:text-slate-400">
            Comparing <strong>v{v1Number}</strong> → <strong>v{v2Number}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">+{stats.additions} chars</span>
          <span className="text-rose-600 dark:text-rose-400 font-mono font-semibold">-{stats.deletions} chars</span>
        </div>
      </div>

      <div className="p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-200 min-h-[160px]">
        {diffs.map(([operation, text], index) => {
          if (operation === 1) {
            // Addition
            return (
              <span
                key={index}
                className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-1 py-0.5 rounded font-semibold border-b-2 border-emerald-500"
              >
                {text}
              </span>
            );
          }
          if (operation === -1) {
            // Deletion
            return (
              <span
                key={index}
                className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 px-1 py-0.5 rounded line-through opacity-80"
              >
                {text}
              </span>
            );
          }
          return <span key={index}>{text}</span>;
        })}
      </div>
    </div>
  );
};
