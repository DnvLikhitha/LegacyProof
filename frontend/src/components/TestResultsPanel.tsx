import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Copy,
  Check,
  Activity,
  Zap,
  Filter,
} from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'passed' | 'mismatch'>('all');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (results.length === 0 && !isRunning) {
    return (
      <div className="relative overflow-hidden rounded-2xl glass-panel p-8 text-center border border-slate-800/80 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md mx-auto space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Live Equivalence Sandbox
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Click <span className="text-indigo-300 font-semibold">Modernize & Prove</span> above to execute original legacy code alongside modernized TypeScript in isolated dual Web Workers.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <div className="font-semibold text-slate-200">Dual Worker</div>
              <div className="text-[10px] text-slate-500">Parallel execution</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              <div className="font-semibold text-slate-200">Deep Equality</div>
              <div className="text-[10px] text-slate-500">100% Exact match</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="font-semibold text-slate-200">Zero Leak</div>
              <div className="text-[10px] text-slate-500">Client-side sandbox</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const total = results.length;
  const originalPassedCount = results.filter((r) => r.originalPassed === true).length;
  const modernPassedCount = results.filter((r) => r.modernPassed === true).length;
  const mismatchCount = results.filter((r) => r.modernPassed === false).length;
  const allModernPassed = total > 0 && modernPassedCount === total;
  const equivalenceScore = total > 0 ? Math.round((modernPassedCount / total) * 100) : 0;

  // Filter test results based on active tab
  const filteredResults = results.filter((test) => {
    if (filter === 'passed') return test.modernPassed === true;
    if (filter === 'mismatch') return test.modernPassed === false;
    return true;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="rounded-2xl glass-panel border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-300 space-y-0">
      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-800/70 bg-slate-950/40 border-b border-slate-800/80">
        {/* Equivalence Score */}
        <div className="p-4 flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl border ${
              allModernPassed
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Behavioral Match
            </div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
              <span>{equivalenceScore}%</span>
              {allModernPassed && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-normal">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Suite */}
        <div className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Test Suite
            </div>
            <div className="text-lg font-bold text-slate-100">
              {total} <span className="text-xs text-slate-500 font-normal">Cases</span>
            </div>
          </div>
        </div>

        {/* Original JS Worker */}
        <div className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Original JS Worker
            </div>
            <div className="text-lg font-bold text-slate-100">
              {originalPassedCount}/{total}{' '}
              <span className="text-xs text-emerald-400 font-normal">Passed</span>
            </div>
          </div>
        </div>

        {/* Modernized TS Worker */}
        <div className="p-4 flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl border ${
              allModernPassed
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Modern TS Worker
            </div>
            <div className="text-lg font-bold text-slate-100">
              {modernPassedCount}/{total}{' '}
              <span
                className={`text-xs font-normal ${
                  allModernPassed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                Passed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Controls & Filter Bar */}
      <div className="bg-slate-900/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isRunning
                    ? 'bg-indigo-500'
                    : allModernPassed
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </span>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base flex items-center gap-2">
              Live Equivalence Proof
              {functionName && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800/90 text-indigo-300 border border-slate-700/80">
                  {functionName}()
                </span>
              )}
            </h3>
          </div>

          {/* Filter Tab Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs ml-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                filter === 'passed'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Passed ({modernPassedCount})
            </button>
            {mismatchCount > 0 && (
              <button
                onClick={() => setFilter('mismatch')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                  filter === 'mismatch'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Mismatches ({mismatchCount})
              </button>
            )}
          </div>
        </div>

        {onReRun && !isRunning && total > 0 && (
          <button
            onClick={onReRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-xs font-semibold text-slate-200 transition border border-slate-700/80 shadow-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
            <span>Re-verify Suite</span>
          </button>
        )}
      </div>

      {/* Test cases list */}
      <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
        {filteredResults.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500 opacity-60" />
            <span>No test cases match the selected filter.</span>
          </div>
        ) : (
          filteredResults.map((test, index) => {
            const testId = test.id || String(index);
            const isExpanded = !!expandedRows[testId];

            return (
              <div
                key={testId}
                className={`transition-all duration-300 flex flex-col ${
                  test.modernPassed !== null
                    ? test.modernPassed
                      ? 'bg-slate-900/40 hover:bg-slate-800/30'
                      : 'bg-rose-950/15 hover:bg-rose-950/25'
                    : test.originalPassed !== null
                    ? 'bg-indigo-950/10 hover:bg-slate-800/30'
                    : 'hover:bg-slate-800/20'
                }`}
              >
                {/* Main Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700/60">
                        #{index + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-100">{test.description}</p>
                    </div>

                    <div className="font-mono text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        <span className="text-slate-500">Args:</span>
                        <code className="text-indigo-300">{JSON.stringify(test.args)}</code>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="inline-flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        <span className="text-slate-500">Expected:</span>
                        <code className="text-emerald-300">{JSON.stringify(test.expected)}</code>
                      </span>
                    </div>
                  </div>

                  {/* Worker Executions Comparison */}
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* Original Worker Status */}
                    <div className="flex flex-col items-end min-w-[125px]">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Original JS
                      </span>
                      {test.originalPassed === null ? (
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 animate-spin text-slate-500" /> Pending
                        </span>
                      ) : test.originalPassed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium transition-all duration-300 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          <span className="text-[10px] text-slate-500">
                            ({test.originalExecutionTimeMs}ms)
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-400 font-medium transition-all duration-300 animate-in fade-in">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </div>

                    <div className="text-slate-700 font-semibold text-sm">→</div>

                    {/* Modernized Worker Status */}
                    <div className="flex flex-col items-end min-w-[135px]">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Modernized TS
                      </span>
                      {test.modernPassed === null ? (
                        <span className="flex items-center gap-1 text-xs text-indigo-300 font-medium">
                          <Clock className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Running...
                        </span>
                      ) : test.modernPassed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 shadow-sm transition-all duration-300 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Passed
                          <span className="text-[10px] text-emerald-300/70">
                            ({test.modernExecutionTimeMs}ms)
                          </span>
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1 text-xs text-rose-400 font-medium bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50 shadow-sm transition-all duration-300 animate-in fade-in">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Mismatch
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expand details toggle */}
                    <button
                      onClick={() => toggleRowExpand(testId)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition ml-1"
                      title="Toggle Details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-slate-950/50 border-t border-slate-800/60 space-y-2 text-xs font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                          <span>Arguments</span>
                          <button
                            onClick={() => copyText(JSON.stringify(test.args), `args-${testId}`)}
                            className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]"
                          >
                            {copiedKey === `args-${testId}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedKey === `args-${testId}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="text-slate-300 overflow-x-auto">
                          {JSON.stringify(test.args, null, 2)}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                          <span>Expected Return Value</span>
                          <button
                            onClick={() => copyText(JSON.stringify(test.expected), `exp-${testId}`)}
                            className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]"
                          >
                            {copiedKey === `exp-${testId}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedKey === `exp-${testId}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="text-emerald-300 overflow-x-auto">
                          {JSON.stringify(test.expected, null, 2)}
                        </div>
                      </div>
                    </div>

                    {/* Mismatch diff if applicable */}
                    {test.modernPassed === false && (
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-1">
                        <div className="font-bold text-rose-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> Modernized Return Discrepancy
                        </div>
                        {test.modernError ? (
                          <div className="text-xs text-rose-300 font-mono">
                            Worker Error: <code className="text-rose-200">{test.modernError}</code>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase">Expected:</span>
                              <div className="text-emerald-300 font-mono bg-slate-900/80 p-1.5 rounded border border-slate-800">
                                {JSON.stringify(test.expected)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase">Actual Received:</span>
                              <div className="text-rose-300 font-mono bg-slate-900/80 p-1.5 rounded border border-slate-800">
                                {JSON.stringify(test.modernActual)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
