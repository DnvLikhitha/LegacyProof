import type { TestCase, TestResult } from './types';

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

export function cleanCodeForWorker(code: string, isTypeScript: boolean = false): string {
  let cleaned = code;

  // 1. Strip export keywords
  cleaned = cleaned.replace(/export\s+default\s+/g, '');
  cleaned = cleaned.replace(/export\s+/g, '');

  if (isTypeScript) {
    // 2. Strip parameter type annotations only for TypeScript code
    // e.g. (amount: unknown, currency?: string) -> (amount, currency)
    // or (amount: unknown, currency: string = '$') -> (amount, currency = '$')
    cleaned = cleaned.replace(/(\(\s*)([^)]*)(\s*\))/g, (_match, p1, params, p3) => {
      const strippedParams = params
        .split(',')
        .map((param: string) => {
          let p = param.trim();
          p = p.replace(/\s*\?:?\s*[\w<>[\]|\s&{}()]+(?=\s*=[^=]|$)/g, '');
          p = p.replace(/\s*:\s*[\w<>[\]|\s&{}()]+/g, '');
          return p;
        })
        .join(', ');
      return p1 + strippedParams + p3;
    });

    // 3. Strip function return type annotations
    cleaned = cleaned.replace(/(\)\s*):\s*[\w<>[\]|\s&{}()]+(?=\s*\{|\s*=>)/g, '$1');

    // 4. Strip 'as' type assertions
    cleaned = cleaned.replace(/\s+as\s+[\w<>[\]|\s&{}()]+/g, '');

    // 5. Clean up any accidental replacement space insertions e.g. '$1, ' -> '$1,'
    cleaned = cleaned.replace(/\$1,\s+/g, '$1,');
  }

  // 5. Convert arrow variable declarations back to standard function declarations if needed
  cleaned = cleaned.replace(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function\b|\([^)]*\)\s*=>)/g, 'function $1');

  return cleaned;
}

function runCodeInWorker(code: string, functionName: string, args: unknown[], isTypeScript: boolean = false): Promise<{ actual?: unknown; error?: string; executionTimeMs: number }> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const cleanedCode = cleanCodeForWorker(code, isTypeScript);

    const workerScript = `
      self.onmessage = function(e) {
        const { code, functionName, args } = e.data;
        try {
          // Provide mock jQuery or minimal DOM stubs if referenced
          const $ = function(selector) {
            return {
              val: function() { return ""; },
              text: function() { return ""; },
              html: function() { return ""; },
              attr: function() { return ""; },
              css: function() { return ""; },
              addClass: function() { return this; },
              removeClass: function() { return this; },
              on: function() { return this; },
              click: function() { return this; }
            };
          };
          $.ajax = function() { return Promise.resolve({}); };
          $.get = function() { return Promise.resolve({}); };
          $.post = function() { return Promise.resolve({}); };

          // Execute code in worker context
          const fn = new Function('$', \`
            "use strict";
            \${code}
            let fnRef = null;
            try {
              if (typeof \${functionName} === 'function') fnRef = \${functionName};
            } catch (e) {}
            if (!fnRef) {
              try {
                if (typeof self['\${functionName}'] === 'function') fnRef = self['\${functionName}'];
              } catch (e) {}
            }
            if (!fnRef) {
              throw new Error("Function '\${functionName}' was not found after executing code.");
            }
            return fnRef;
          \`)($);

          const result = fn.apply(null, args);
          self.postMessage({ success: true, result });
        } catch (err) {
          self.postMessage({ success: false, error: err instanceof Error ? err.message : String(err) });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const timeout = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      const endTime = performance.now();
      resolve({ error: 'Execution timed out (5000ms limit)', executionTimeMs: Math.round(endTime - startTime) });
    }, 5000);

    worker.onmessage = (event) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      const duration = Math.round(performance.now() - startTime);

      if (event.data.success) {
        resolve({ actual: event.data.result, executionTimeMs: duration });
      } else {
        resolve({ error: event.data.error, executionTimeMs: duration });
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({ error: err.message || 'Worker runtime error', executionTimeMs: Math.round(performance.now() - startTime) });
    };

    worker.postMessage({ code: cleanedCode, functionName, args });
  });
}

export async function executeEquivalenceTests(
  functionName: string,
  originalCode: string,
  modernizedCode: string,
  tests: TestCase[],
  onSingleResultUpdate?: (updatedResult: TestResult) => void
): Promise<TestResult[]> {
  const results: TestResult[] = tests.map((t) => ({
    id: t.id,
    description: t.description,
    args: t.args,
    expected: t.expected,
    originalPassed: null,
    modernPassed: null,
  }));

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    
    // 1. Run against Original Code (isTypeScript = false)
    const origRes = await runCodeInWorker(originalCode, functionName, t.args, false);
    const origPassed = origRes.error === undefined && deepEqual(origRes.actual, t.expected);

    results[i] = {
      ...results[i],
      originalPassed: origPassed,
      originalActual: origRes.actual,
      originalError: origRes.error,
      originalExecutionTimeMs: origRes.executionTimeMs,
    };
    if (onSingleResultUpdate) onSingleResultUpdate(results[i]);

    // Small delay for visual step animation effect in UI
    await new Promise((r) => setTimeout(r, 120));

    // 2. Run against Modernized Code (isTypeScript = true)
    const modernRes = await runCodeInWorker(modernizedCode, functionName, t.args, true);
    const modernPassed = modernRes.error === undefined && deepEqual(modernRes.actual, t.expected);

    results[i] = {
      ...results[i],
      modernPassed: modernPassed,
      modernActual: modernRes.actual,
      modernError: modernRes.error,
      modernExecutionTimeMs: modernRes.executionTimeMs,
    };
    if (onSingleResultUpdate) onSingleResultUpdate(results[i]);
  }

  return results;
}
