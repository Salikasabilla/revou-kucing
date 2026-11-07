/**
 * smoke.test.js
 *
 * Verifies that the Vitest + jsdom + fast-check setup is working correctly
 * before any feature tests are written.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  formatDate,
  formatTime,
  getGreeting,
  normalize,
  isDuplicate,
  pomodoroFormatTime,
  normalizeUrl,
  DAYS_ID,
  MONTHS_ID,
} from './helpers.js';

describe('Test framework smoke tests', () => {
  it('jsdom provides a working document object', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    expect(div.textContent).toBe('hello');
  });

  it('localStorage stub is available and functional', () => {
    localStorage.setItem('smoke', 'ok');
    expect(localStorage.getItem('smoke')).toBe('ok');
    localStorage.removeItem('smoke');
    expect(localStorage.getItem('smoke')).toBeNull();
  });

  it('localStorage is cleared between tests (previous test removed its key)', () => {
    // The beforeEach in setup.js calls localStorageStub.clear()
    expect(localStorage.getItem('smoke')).toBeNull();
  });

  it('window.matchMedia stub returns matches: false', () => {
    const result = window.matchMedia('(prefers-color-scheme: dark)');
    expect(result.matches).toBe(false);
  });

  it('crypto.randomUUID stub returns a deterministic string', () => {
    const id = crypto.randomUUID();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('fast-check is importable and runs a trivial property', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        return typeof getGreeting(hour) === 'string';
      }),
    );
  });
});

describe('helpers.js — quick sanity checks', () => {
  it('DAYS_ID has 7 entries', () => {
    expect(DAYS_ID).toHaveLength(7);
  });

  it('MONTHS_ID has 12 entries', () => {
    expect(MONTHS_ID).toHaveLength(12);
  });

  it('formatDate returns expected shape', () => {
    // 2025-07-14 is a Monday (day index 1 = "Senin"), month index 6 = "Juli"
    const d = new Date(2025, 6, 14); // month is 0-indexed
    expect(formatDate(d)).toBe('Senin, 14 Juli 2025');
  });

  it('formatTime zero-pads all components', () => {
    // Construct a date at 09:05:03 in local time
    const d = new Date(2025, 0, 1, 9, 5, 3);
    expect(formatTime(d)).toBe('09:05:03');
  });

  it('getGreeting returns Selamat Pagi for hour 8', () => {
    expect(getGreeting(8)).toBe('Selamat Pagi');
  });

  it('normalize lowercases and collapses whitespace', () => {
    expect(normalize('  Hello   World  ')).toBe('hello world');
  });

  it('isDuplicate detects matching normalized texts', () => {
    const tasks = [{ id: '1', text: 'Buy milk' }];
    expect(isDuplicate(tasks, normalize('buy milk'))).toBe(true);
  });

  it('isDuplicate excludes the task being edited', () => {
    const tasks = [{ id: '1', text: 'Buy milk' }];
    expect(isDuplicate(tasks, normalize('buy milk'), '1')).toBe(false);
  });

  it('pomodoroFormatTime formats 1500 as "25:00"', () => {
    expect(pomodoroFormatTime(1500)).toBe('25:00');
  });

  it('pomodoroFormatTime zero-pads minutes and seconds', () => {
    expect(pomodoroFormatTime(65)).toBe('01:05');
  });

  it('normalizeUrl prepends https:// when no scheme present', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com');
  });

  it('normalizeUrl leaves http:// URLs unchanged', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('normalizeUrl leaves https:// URLs unchanged', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });
});
