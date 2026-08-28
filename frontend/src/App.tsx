import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code2,
  Sparkles,
  AlertTriangle,
  Server,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { ProcessResponse, TestResult } from './types';
import { processLegacyCode, checkBackendHealth } from './api';
import { executeEquivalenceTests } from './runner';
import { TestResultsPanel } from './components/TestResultsPanel';
import { SAMPLE_SNIPPETS } from './samples';

export const App: React.FC = () => {
  const [legacyCode, setLegacyCode] = useState<string>(SAMPLE_SNIPPETS[0].code);
  const [modernizedCode, setModernizedCode] = useState<string>('');
  const [functionName, setFunctionName] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((isOnline) => {
      if (mounted) {
        setBackendStatus(isOnline ? 'online' : 'offline');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleModernizeAndVerify = async () => {
    if (!legacyCode.trim()) {
      setError('Please enter or paste legacy JavaScript code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setModernizedCode('');
    setTestResults([]);
    setWarnings([]);

    try {
      // 1. Send request to backend
      const response: ProcessResponse = await processLegacyCode({
        legacy_code: legacyCode,
      });

      setModernizedCode(response.modernized_code);
      setFunctionName(response.function_name);
      setWarnings(response.warnings || []);
      setIsLoading(false);

      // 2. Run Equivalence Tests in client-side Web Workers
      if (response.tests && response.tests.length > 0) {
        setIsTestRunning(true);
        const initialResults: TestResult[] = response.tests.map((t) => ({
          id: t.id,
          description: t.description,
          args: t.args,
          expected: t.expected,
          originalPassed: null,
          modernPassed: null,
        }));
        setTestResults(initialResults);

        await executeEquivalenceTests(
          response.function_name,
          legacyCode,
          response.modernized_code,
          response.tests,
          (updated) => {
            setTestResults((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          }
        );
        setIsTestRunning(false);
      }
    } catch (err) {
      setIsLoading(false);
      setIsTestRunning(false);
      setError(err instanceof Error ? err.message : 'Failed to process legacy code.');
    }
  };

  const handleReRunTests = async () => {
    if (!modernizedCode || !functionName || testResults.length === 0) return;
    setIsTestRunning(true);
    await executeEquivalenceTests(
      functionName,
      legacyCode,
      modernizedCode,
      testResults,
      (updated) => {
        setTestResults((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      }
    );
    setIsTestRunning(false);
  };

  const handleCopyCode = () => {
    if (!modernizedCode) return;
    navigator.clipboard.writeText(modernizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  LegacyProof
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                  AI + Equivalence Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modernize legacy JavaScript to TypeScript with live behavioral proof
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend health status badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Backend:</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online'
                      ? 'bg-emerald-400 animate-pulse'
                      : backendStatus === 'offline'
                      ? 'bg-rose-400'
                      : 'bg-amber-400'
                  }`}
                />
                {backendStatus === 'online' ? (
                  <span className="text-emerald-400">Online</span>
                ) : backendStatus === 'offline' ? (
                  <span className="text-rose-400">Offline (Check localhost:8000)</span>
                ) : (
                  <span className="text-amber-400">Checking...</span>
                )}
              </span>
            </div>

            <button
              onClick={handleModernizeAndVerify}
              disabled={isLoading || isTestRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isTestRunning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Modernize & Prove</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sample presets bar */}
        <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-indigo-400" /> Try Legacy Samples:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SNIPPETS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setLegacyCode(sample.code)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-4 flex items-start gap-3 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="font-semibold text-rose-300">Modernization Error: </strong>
              {error}
            </div>
          </div>
        )}

        {/* Code Editors Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legacy JS Input */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-sm font-semibold text-slate-200">Legacy Code (JS / ES5 / jQuery)</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Input</span>
            </div>
            <div className="h-[360px]">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={legacyCode}
                onChange={(val) => setLegacyCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                }}
              />
            </div>
          </div>

          {/* Modernized TS Output */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-semibold text-slate-200">Modernized Code (TypeScript)</h2>
              </div>
              {modernizedCode && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <div className="h-[360px] relative">
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 text-slate-300">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm font-medium">Generating Modernized TypeScript & Tests...</p>
                </div>
              )}
              <Editor
                height="100%"
                defaultLanguage="typescript"
                theme="vs-dark"
                value={modernizedCode || '// Modernized code will appear here after clicking "Modernize & Prove"'}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                }}
              />
            </div>
          </div>
        </div>

        {/* Warnings Banner */}
        {warnings.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 text-amber-200 space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" /> Migration Warnings
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-300/80">
              {warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Live Equivalence Proof Panel */}
        <TestResultsPanel
          results={testResults}
          isRunning={isTestRunning}
          functionName={functionName}
          onReRun={handleReRunTests}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        LegacyProof • Built for BuildSprint by LatentForce.ai • 100% Client-Side Equivalence Sandbox
      </footer>
    </div>
  );
};

export default App;
