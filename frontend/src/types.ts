export interface ProcessRequest {
  legacy_code: string;
}

export interface TestCase {
  id: string;
  description: string;
  args: unknown[];
  expected: unknown;
}

export interface ProcessResponse {
  function_name: string;
  modernized_code: string;
  tests: TestCase[];
  warnings: string[];
}

export interface ErrorResponse {
  error: string;
  detail: string;
}

export interface TestResult {
  id: string;
  description: string;
  args: unknown[];
  expected: unknown;
  originalPassed: boolean | null;
  originalActual?: unknown;
  originalError?: string;
  originalExecutionTimeMs?: number;
  modernPassed: boolean | null;
  modernActual?: unknown;
  modernError?: string;
  modernExecutionTimeMs?: number;
}
