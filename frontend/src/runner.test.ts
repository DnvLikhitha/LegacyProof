import { describe, it, expect } from 'vitest';
import { cleanCodeForWorker, deepEqual } from './runner';

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

describe('deepEqual', () => {
  it('returns true for equal primitives (numbers, strings, booleans)', () => {
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual('hello', 'hello')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
  });

  it('returns false for primitives that are not equal', () => {
    expect(deepEqual(42, 43)).toBe(false);
    expect(deepEqual('foo', 'bar')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it('returns true for deeply equal nested objects', () => {
    const objA = { a: 1, b: { c: 'test', d: [1, 2, { e: true }] } };
    const objB = { a: 1, b: { c: 'test', d: [1, 2, { e: true }] } };
    expect(deepEqual(objA, objB)).toBe(true);
  });

  it('returns false for nested objects that differ on one nested key', () => {
    const objA = { a: 1, b: { c: 'test', d: 10 } };
    const objB = { a: 1, b: { c: 'test', d: 20 } };
    expect(deepEqual(objA, objB)).toBe(false);
  });

  it('returns false for arrays of different lengths', () => {
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
  });

  it('returns false for arrays with the same elements in a different order', () => {
    expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
  });

  it('returns false for null vs undefined', () => {
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(undefined, null)).toBe(false);
  });

  it('returns false when comparing an object to an array', () => {
    expect(deepEqual({ 0: 'a', length: 1 }, ['a'])).toBe(false);
    expect(deepEqual(['a'], { 0: 'a', length: 1 })).toBe(false);
  });
});
