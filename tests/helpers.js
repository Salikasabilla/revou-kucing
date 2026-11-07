/**
 * helpers.js
 *
 * Re-exports the pure, side-effect-free logic functions from app.js so that
 * test files can import them without loading the full browser-dependent module.
 *
 * app.js is intentionally NOT an ES module (it has no import/export statements)
 * because it is designed to run directly in a browser via a <script> tag.
 * These helpers mirror the implementations exactly so that property-based and
 * unit tests exercise the real logic.
 *
 * If the implementation in app.js changes, update the corresponding function
 * here to stay in sync.
 */

// ---------------------------------------------------------------------------
// ClockDisplay helpers
// ---------------------------------------------------------------------------

/** Indonesian day names, indexed by Date.getDay() (0 = Sunday) */
export const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Indonesian month names, indexed by Date.getMonth() (0 = January) */
export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Format a Date as an Indonesian-locale date string.
 * Example: "Senin, 14 Juli 2025"
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const day   = DAYS_ID[date.getDay()];
  const d     = date.getDate();
  const month = MONTHS_ID[date.getMonth()];
  const year  = date.getFullYear();
  return `${day}, ${d} ${month} ${year}`;
}

/**
 * Format a Date as a zero-padded HH:MM:SS string.
 * Example: "09:05:03"
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// GreetingDisplay helpers
// ---------------------------------------------------------------------------

/**
 * Map a local hour (0–23) to the appropriate Indonesian greeting.
 *
 *  05–11 → "Selamat Pagi"
 *  12–14 → "Selamat Siang"
 *  15–17 → "Selamat Sore"
 *  18–23 and 00–04 → "Selamat Malam"
 *
 * @param {number} hour  Integer 0–23
 * @returns {string}
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour <= 11)  return 'Selamat Pagi';
  if (hour >= 12 && hour <= 14) return 'Selamat Siang';
  if (hour >= 15 && hour <= 17) return 'Selamat Sore';
  return 'Selamat Malam'; // 18–23 and 00–04
}

// ---------------------------------------------------------------------------
// TaskList helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a task text string for duplicate comparison:
 * trim, collapse internal whitespace to a single space, then lowercase.
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
  return (text || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Check whether a normalized text already exists in a task array.
 * Optionally excludes a specific task ID from the comparison
 * (used during edits so a task can be saved with its own unchanged text).
 *
 * @param {Array<{id: string, text: string}>} tasks
 * @param {string} normalizedText
 * @param {string} [excludeId]
 * @returns {boolean}
 */
export function isDuplicate(tasks, normalizedText, excludeId) {
  return tasks.some(
    (task) =>
      task.id !== excludeId &&
      normalize(task.text) === normalizedText,
  );
}

// ---------------------------------------------------------------------------
// PomodoroTimer helpers
// ---------------------------------------------------------------------------

/**
 * Convert a total number of seconds into a zero-padded "MM:SS" string.
 * @param {number} seconds  Non-negative integer
 * @returns {string}  e.g. "25:00", "09:05"
 */
export function pomodoroFormatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(m)}:${pad(r)}`;
}

// ---------------------------------------------------------------------------
// QuickLinkManager helpers
// ---------------------------------------------------------------------------

/**
 * Prepend "https://" to a URL that doesn't already start with
 * "http://" or "https://".
 * @param {string} url
 * @returns {string}
 */
export function normalizeUrl(url) {
  const s = (url || '').trim();
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  return 'https://' + s;
}
