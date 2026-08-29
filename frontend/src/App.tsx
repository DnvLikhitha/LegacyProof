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
  RotateCcw,
  FileCode2,
  Cpu,
  Layers,
  Terminal,
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
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);

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

  const handleSelectSample = (index: number) => {
    setActiveSampleIndex(index);
    setLegacyCode(SAMPLE_SNIPPETS[index].code);
  };

  const handleResetEditor = () => {
    setLegacyCode('');
    setModernizedCode('');
    setTestResults([]);
    setError(null);
    setWarnings([]);
  };

  const lineCount = (code: string) => (code ? code.split('\n').length : 0);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Professional Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  LegacyProof
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/60">
                  Equivalence Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Modernize legacy JS to TypeScript with client-side behavioral proof
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            {/* Backend status badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Backend:</span>
              <span className="flex items-center gap-1.5 font-semibold">
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
                  <span className="text-rose-400">Offline</span>
                ) : (
                  <span className="text-amber-400">Checking...</span>
                )}
              </span>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleModernizeAndVerify}
              disabled={isLoading || isTestRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isTestRunning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Modernize & Prove</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Core Capabilities Subtitle Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Dual Web Workers <span className="text-slate-500 font-normal">• Parallel execution</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Deep Equality <span className="text-slate-500 font-normal">• Exact match engine</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>AST Modernization <span className="text-slate-500 font-normal">• Clean TypeScript</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Client Sandbox <span className="text-slate-500 font-normal">• 100% Isolated</span></span>
          </div>
        </div>

        {/* Sample Presets Bar */}
        <div className="pro-card p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Try Legacy Presets:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_SNIPPETS.map((sample, idx) => {
              const isActive = activeSampleIndex === idx && legacyCode === sample.code;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  {sample.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-4 flex items-start gap-3 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <strong className="font-semibold text-rose-300">Modernization Error:</strong>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Code Editors Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legacy JS Input Panel */}
          <div className="flex flex-col rounded-xl pro-card overflow-hidden shadow-lg">
            {/* Editor Header */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Legacy Code (Input)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  JS / ES5 / jQuery
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{lineCount(legacyCode)} lines</span>
                {legacyCode && (
                  <button
                    onClick={handleResetEditor}
                    className="p-1 hover:text-rose-400 transition rounded"
                    title="Clear editor"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Monaco Container */}
            <div className="h-[380px] bg-slate-950">
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
                  fontFamily: 'Fira Code, Consolas, Monaco, monospace',
                }}
              />
            </div>
          </div>

          {/* Modernized TS Output Panel */}
          <div className="flex flex-col rounded-xl pro-card overflow-hidden shadow-lg">
            {/* Editor Header */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Modernized Code (Output)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  TypeScript
                </span>
              </div>

              <div className="flex items-center gap-2">
                {modernizedCode && (
                  <>
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {lineCount(modernizedCode)} lines
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition active:scale-95"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Monaco Container & Loading Overlay */}
            <div className="h-[380px] bg-slate-950 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 text-slate-300 p-6 text-center">
                  <Sparkles className="w-7 h-7 text-blue-400 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Generating Modernized TypeScript & Behavior Tests
                    </p>
                    <p className="text-xs text-slate-400">
                      Running client-side equivalence analysis...
                    </p>
                  </div>
                  <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-blue-500 animate-shimmer" />
                  </div>
                </div>
              )}

              <Editor
                height="100%"
                defaultLanguage="typescript"
                theme="vs-dark"
                value={
                  modernizedCode ||
                  '// Modernized TypeScript code will appear here automatically.\n// Click "Modernize & Prove" to run the pipeline.'
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                  fontFamily: 'Fira Code, Consolas, Monaco, monospace',
                }}
              />
            </div>
          </div>
        </div>

        {/* Migration Warnings Banner */}
        {warnings.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 text-amber-200 space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Migration Warnings
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-200/80">
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
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500 space-y-1">
        <div>
          <strong className="text-slate-400">LegacyProof</strong> • AI Modernization & Behavioral Equivalence Sandbox
        </div>
        <div className="text-[11px] text-slate-600">
          Client-Side Web Workers Engine • 100% Isolated Sandbox
        </div>
      </footer>
    </div>
  );
};

export default App;
