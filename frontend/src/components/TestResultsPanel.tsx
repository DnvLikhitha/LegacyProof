import React from 'react';
import { CheckCircle2, XCircle, Clock, Play, Sparkles } from 'lucide-react';
import type { TestResult } from '../types';

interface TestResultsPanelProps {
  results: TestResult[];
  isRunning: boolean;
  functionName?: string;
  onReRun?: () => void;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({
  results,
  isRunning,
  functionName,
  onReRun,
}) => {
  if (results.length === 0 && !isRunning) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-70" />
        <h3 className="text-base font-semibold text-slate-200">Equivalence Proof Sandbox</h3>
        <p className="text-sm mt-1 max-w-md mx-auto text-slate-400">
          Click <span className="text-indigo-400 font-medium">Modernize & Prove</span> to generate behavior tests and run them live in dual Web Workers.
        </p>
      </div>
    );
  }

  const total = results.length;
  const originalPassedCount = results.filter((r) => r.originalPassed === true).length;
  const modernPassedCount = results.filter((r) => r.modernPassed === true).length;
  const allModernPassed = total > 0 && modernPassedCount === total;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isRunning
                    ? 'bg-indigo-500'
                    : allModernPassed
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">
              Live Equivalence Proof
              {functionName && (
                <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {functionName}()
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Original: <strong className="text-slate-100">{originalPassedCount}/{total}</strong>
            </span>
            <span
              className={`px-2 py-1 rounded border ${
                allModernPassed
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                  : 'bg-amber-950/50 text-amber-300 border-amber-800/60'
              }`}
            >
              Modernized: <strong>{modernPassedCount}/{total}</strong>
            </span>
          </div>
        </div>

        {onReRun && !isRunning && total > 0 && (
          <button
            onClick={onReRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400" /> Re-verify
          </button>
        )}
      </div>

      {/* Test cases list */}
      <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto">
        {results.map((test, index) => {
          return (
            <div
              key={test.id || index}
              className={`p-4 hover:bg-slate-800/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                test.modernPassed !== null
                  ? test.modernPassed
                    ? 'bg-emerald-950/10'
                    : 'bg-rose-950/10'
                  : test.originalPassed !== null
                  ? 'bg-indigo-950/10'
                  : ''
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    #{index + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-200">{test.description}</p>
                </div>
                <div className="font-mono text-xs text-slate-400 space-x-2">
                  <span>Args: <code className="text-indigo-300">{JSON.stringify(test.args)}</code></span>
                  <span>•</span>
                  <span>Expected: <code className="text-emerald-300">{JSON.stringify(test.expected)}</code></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Original Worker Status */}
                <div className="flex flex-col items-end min-w-[120px]">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Original JS
                  </span>
                  {test.originalPassed === null ? (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Pending
                    </span>
                  ) : test.originalPassed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium transition-all duration-300 animate-in fade-in slide-in-from-right-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({test.originalExecutionTimeMs}ms)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-medium transition-all duration-300 animate-in fade-in slide-in-from-right-1">
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                </div>

                <div className="text-slate-700 text-lg">→</div>

                {/* Modernized Worker Status */}
                <div className="flex flex-col items-end min-w-[130px]">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Modernized TS
                  </span>
                  {test.modernPassed === null ? (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Running...
                    </span>
                  ) : test.modernPassed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 transition-all duration-300 animate-in fade-in slide-in-from-right-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Passed ({test.modernExecutionTimeMs}ms)
                    </span>
                  ) : (
                    <div className="flex flex-col items-end transition-all duration-300 animate-in fade-in slide-in-from-right-1">
                      <span className="flex items-center gap-1 text-xs text-rose-400 font-medium bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Mismatch
                      </span>
                      {test.modernError ? (
                        <span className="text-[10px] text-rose-300 font-mono mt-0.5 max-w-[160px] truncate" title={test.modernError}>
                          Err: {test.modernError}
                        </span>
                      ) : test.modernActual !== undefined ? (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[160px] truncate" title={`Actual: ${JSON.stringify(test.modernActual)}`}>
                          Got: {JSON.stringify(test.modernActual)}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
