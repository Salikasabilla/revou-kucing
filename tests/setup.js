/**
 * Global test setup for Todo Life Dashboard.
 *
 * Stubs browser APIs that are not available in jsdom or need
 * predictable behaviour during testing:
 *   - localStorage  (Map-based in-memory implementation)
 *   - window.matchMedia  (returns matches: false by default)
 *   - window.open        (vi.fn() spy)
 *   - crypto.randomUUID  (sequential UUID generator)
 */

import { vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// localStorage stub
// ---------------------------------------------------------------------------

/**
 * A simple Map-backed localStorage replacement that matches the Web Storage
 * interface: getItem, setItem, removeItem, clear, and the length property.
 */
class LocalStorageStub {
  constructor() {
    this._store = new Map();
  }

  get length() {
    return this._store.size;
  }

  key(index) {
    return [...this._store.keys()][index] ?? null;
  }

  getItem(key) {
    return this._store.has(key) ? this._store.get(key) : null;
  }

  setItem(key, value) {
    this._store.set(key, String(value));
  }

  removeItem(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }
}

// Install the stub on globalThis so both `localStorage` and
// `window.localStorage` references resolve to the same object.
const localStorageStub = new LocalStorageStub();
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageStub,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// window.matchMedia stub
// ---------------------------------------------------------------------------

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),   // deprecated but still called by some code
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ---------------------------------------------------------------------------
// window.open stub
// ---------------------------------------------------------------------------

Object.defineProperty(globalThis, 'open', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// ---------------------------------------------------------------------------
// crypto.randomUUID stub
// ---------------------------------------------------------------------------

let _uuidCounter = 0;

Object.defineProperty(globalThis, 'crypto', {
  writable: true,
  configurable: true,
  value: {
    randomUUID: vi.fn(() => {
      _uuidCounter += 1;
      return `00000000-0000-0000-0000-${String(_uuidCounter).padStart(12, '0')}`;
    }),
  },
});

// ---------------------------------------------------------------------------
// Reset stubs between tests so each test starts with a clean slate
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageStub.clear();
  _uuidCounter = 0;
  vi.clearAllMocks();
});

afterEach(() => {
  // Nothing additional needed — vi.clearAllMocks() in beforeEach covers it.
});
