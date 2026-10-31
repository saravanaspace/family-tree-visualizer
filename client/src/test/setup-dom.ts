// Browser-only setup; a no-op in node-environment suites (add `// @vitest-environment jsdom` to opt in).
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as jestDom from '@testing-library/jest-dom/matchers';
import * as axeMatchers from 'vitest-axe/matchers';

if (typeof window !== 'undefined') {
  expect.extend(jestDom as never);
  expect.extend(axeMatchers as never);
  // Newer Node ships a half-working global localStorage that shadows jsdom's, so install a plain in-memory one.
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => store.get(k) ?? null,
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => { store.delete(k); },
    setItem: (k, v) => { store.set(k, String(v)); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(globalThis, { ResizeObserver: ResizeObserverStub });

  class DOMMatrixReadOnlyStub {
    m22: number;
    constructor(transform?: string) {
      const scale = /scale\(([\d.]+)\)/.exec(transform ?? '');
      this.m22 = scale ? Number(scale[1]) : 1;
    }
  }
  Object.assign(globalThis, { DOMMatrixReadOnly: DOMMatrixReadOnlyStub });

  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
}
