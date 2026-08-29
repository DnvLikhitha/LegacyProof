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
      <div className="pro-card rounded-xl p-6 text-center text-slate-400">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-400 opacity-80" />
        <h3 className="text-base font-semibold text-slate-200">Equivalence Proof Sandbox</h3>
        <p className="text-sm mt-1 max-w-md mx-auto text-slate-400">
          Click <span className="text-blue-400 font-medium">Modernize & Prove</span> to generate behavior tests and run them live in dual Web Workers.
        </p>
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
    <div className="pro-card rounded-xl overflow-hidden shadow-xl">
      {/* Analytics 4-Card Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-800 bg-slate-950/60 border-b border-slate-800">
        {/* Behavioral Match */}
        <div className="p-4 flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              allModernPassed
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Behavioral Match
            </div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
              <span>{equivalenceScore}%</span>
              {allModernPassed && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Suite */}
        <div className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Total Test Suite
            </div>
            <div className="text-lg font-bold text-slate-100">
              {total} <span className="text-xs text-slate-500 font-normal">Cases</span>
            </div>
          </div>
        </div>

        {/* Original JS Worker */}
        <div className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-amber-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Original JS
            </div>
            <div className="text-lg font-bold text-slate-100">
              {originalPassedCount}/{total}{' '}
              <span className="text-xs text-emerald-400 font-normal">Passed</span>
            </div>
          </div>
        </div>

        {/* Modern TS Worker */}
        <div className="p-4 flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              allModernPassed
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                : 'bg-rose-950/60 border-rose-800/60 text-rose-400'
            }`}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Modernized TS
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

      {/* Header Bar & Filter Controls */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isRunning
                    ? 'bg-blue-500'
                    : allModernPassed
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </span>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base flex items-center gap-2">
              Live Equivalence Proof
              {functionName && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {functionName}()
                </span>
              )}
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs ml-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                filter === 'passed'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Passed ({modernPassedCount})
            </button>
            {mismatchCount > 0 && (
              <button
                onClick={() => setFilter('mismatch')}
                className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                  filter === 'mismatch'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-blue-400" /> Re-verify
          </button>
        )}
      </div>

      {/* Test Cases List */}
      <div className="divide-y divide-slate-800/60 max-h-[440px] overflow-y-auto">
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
                      : 'bg-rose-950/20 hover:bg-rose-950/30'
                    : test.originalPassed !== null
                    ? 'bg-indigo-950/10 hover:bg-slate-800/30'
                    : 'hover:bg-slate-800/20'
                }`}
              >
                {/* Main Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        #{index + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-200">{test.description}</p>
                    </div>

                    <div className="font-mono text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span>Args: <code className="text-indigo-300">{JSON.stringify(test.args)}</code></span>
                      <span className="text-slate-600">•</span>
                      <span>Expected: <code className="text-emerald-300">{JSON.stringify(test.expected)}</code></span>
                    </div>
                  </div>

                  {/* Worker Executions Comparison */}
                  <div className="flex items-center gap-3 self-end md:self-auto">
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
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({test.originalExecutionTimeMs}ms)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
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
                          <Clock className="w-3.5 h-3.5 animate-spin text-blue-400" /> Running...
                        </span>
                      ) : test.modernPassed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({test.modernExecutionTimeMs}ms)
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1 text-xs text-rose-400 font-medium bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60">
                            <XCircle className="w-3.5 h-3.5" /> Mismatch
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
                  <div className="px-4 pb-4 pt-1 bg-slate-950/60 border-t border-slate-800 space-y-2 text-xs font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                          <span>Arguments</span>
                          <button
                            onClick={() => copyText(JSON.stringify(test.args), `args-${testId}`)}
                            className="text-slate-400 hover:text-blue-400 flex items-center gap-1 text-[10px]"
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
                        <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                          <span>Expected Return Value</span>
                          <button
                            onClick={() => copyText(JSON.stringify(test.expected), `exp-${testId}`)}
                            className="text-slate-400 hover:text-blue-400 flex items-center gap-1 text-[10px]"
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
                      <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 space-y-1">
                        <div className="font-semibold text-rose-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> Return Value Mismatch
                        </div>
                        {test.modernError ? (
                          <div className="text-xs text-rose-300 font-mono">
                            Worker Error: <code className="text-rose-200">{test.modernError}</code>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase">Expected:</span>
                              <div className="text-emerald-300 font-mono bg-slate-900 p-1.5 rounded border border-slate-800">
                                {JSON.stringify(test.expected)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase">Actual Received:</span>
                              <div className="text-rose-300 font-mono bg-slate-900 p-1.5 rounded border border-slate-800">
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
