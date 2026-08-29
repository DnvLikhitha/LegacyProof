import { describe, it, expect } from 'vitest';
import { cleanCodeForWorker } from './runner';

describe('cleanCodeForWorker', () => {
  it('preserves plain JavaScript code intact when isTypeScript is false', () => {
    const legacyJs = `function formatPrice(amount, currency) {
      currency = currency || '$';
      var num = parseFloat(amount);
      if (isNaN(num)) return currency + '0.00';
      return currency + num.toFixed(2).replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, '$1,');
    }`;

    const cleaned = cleanCodeForWorker(legacyJs, false);
    expect(cleaned).toBe(legacyJs);
  });

  it('correctly strips TypeScript type annotations when isTypeScript is true', () => {
    const tsCode = `export function formatPrice(amount: unknown, currency?: string): string {
      const cur = currency || '$';
      const num = parseFloat(String(amount));
      if (isNaN(num)) return cur + '0.00';
      return cur + num.toFixed(2).replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, '$1,');
    }`;

    const cleaned = cleanCodeForWorker(tsCode, true);
    expect(cleaned).not.toContain(': string');
    expect(cleaned).not.toContain('export ');
    expect(cleaned).toContain('function formatPrice(amount, currency)');
  });
});
