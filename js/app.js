/* =========================================================
   Todo Life Dashboard — app.js
   Single-file module pattern (no bundler required)
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   LocalStorage key constants
   --------------------------------------------------------- */
const TLD_TASKS_KEY       = "tld_tasks";
const TLD_LINKS_KEY       = "tld_links";
const TLD_CUSTOM_NAME_KEY = "tld_custom_name";
const TLD_THEME_KEY       = "tld_theme";

/* =========================================================
   StorageManager
   Wraps all localStorage access with availability detection.
   ========================================================= */
const StorageManager = {
  /** @type {boolean} Set to false if localStorage is unavailable */
  available: true,

  /**
   * Detect localStorage availability.
   * Performs a test write/read/delete; if that throws, marks the manager
   * as unavailable and displays a Bahasa Indonesia warning banner.
   */
  init() {
    const TEST_KEY = "__tld_storage_test__";
    try {
      localStorage.setItem(TEST_KEY, "1");
      const val = localStorage.getItem(TEST_KEY);
      localStorage.removeItem(TEST_KEY);
      // If the round-trip didn't work, treat as unavailable
      if (val !== "1") {
        throw new Error("Storage read-back mismatch");
      }
      StorageManager.available = true;
    } catch (_err) {
      StorageManager.available = false;
      StorageManager._showWarningBanner();
    }
  },

  /**
   * Serialize `value` to JSON and write it to localStorage under `key`.
   * No-op when storage is unavailable.
   * @param {string} key
   * @param {*} value
   */
  save(key, value) {
    if (!StorageManager.available) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      // Quota exceeded or other write error — treat silently
    }
  },

  /**
   * Read and JSON-parse the value stored under `key`.
   * Returns `null` if the key is absent, storage is unavailable,
   * or any error occurs during parsing.
   * @param {string} key
   * @returns {*|null}
   */
  load(key) {
    if (!StorageManager.available) return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  },

  /**
   * Remove the item stored under `key` from localStorage.
   * No-op when storage is unavailable.
   * @param {string} key
   */
  remove(key) {
    if (!StorageManager.available) return;
    try {
      localStorage.removeItem(key);
    } catch (_err) {
      // Silent failure
    }
  },

  /**
   * Render a non-blocking warning banner in Bahasa Indonesia when
   * localStorage is unavailable.
   * @private
   */
  _showWarningBanner() {
    const banner = document.getElementById("storage-warning");
    if (banner) {
      banner.hidden = false;
    }
  },
};

/* =========================================================
   ThemeManager
   Manages light/dark theme via data-theme on <html>.
   ========================================================= */
const ThemeManager = {
  /** @type {"light"|"dark"} */
  currentTheme: "light",

  /**
   * Load the stored theme preference, fall back to OS preference,
   * then apply it before the first paint.
   */
  init() {
    const stored = StorageManager.load(TLD_THEME_KEY);
    const theme  = (stored === "light" || stored === "dark")
      ? stored
      : ThemeManager.getOSPreference();
    ThemeManager.apply(theme);
  },

  /**
   * Set `data-theme` on `<html>`, update the toggle-button icon,
   * and record the active theme.
   * @param {"light"|"dark"} theme
   */
  apply(theme) {
    ThemeManager.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    const icon = document.getElementById("theme-icon");
    if (icon) {
      // 🌙 shown when light (click to go dark), ☀️ shown when dark (click to go light)
      icon.textContent = theme === "light" ? "🌙" : "☀️";
    }
  },

  /**
   * Flip the current theme between light and dark, persist the choice,
   * and re-apply it.
   */
  toggle() {
    const next = ThemeManager.currentTheme === "light" ? "dark" : "light";
    ThemeManager.apply(next);
    StorageManager.save(TLD_THEME_KEY, next);
  },

  /**
   * Return `"dark"` if the OS/browser prefers dark mode, otherwise `"light"`.
   * @returns {"light"|"dark"}
   */
  getOSPreference() {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (_err) {
      return "light";
    }
  },
};

/* =========================================================
   ClockDisplay
   Renders real-time clock and date in Indonesian locale.
   Updates every 1 second via setInterval.
   ========================================================= */

/** Indonesian day names, indexed by Date.getDay() (0 = Sunday) */
const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Indonesian month names, indexed by Date.getMonth() (0 = January) */
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const ClockDisplay = {
  /** @type {number|null} setInterval handle */
  intervalId: null,

  /**
   * Render the clock immediately, then start a 1-second interval
   * so the display stays current.
   */
  init() {
    ClockDisplay.render();
    ClockDisplay.intervalId = setInterval(ClockDisplay.render, 1000);
  },

  /**
   * Build date and time strings from the current moment and write
   * them into #clock-date and #clock-time.
   */
  render() {
    const now = new Date();
    const dateEl = document.getElementById("clock-date");
    const timeEl = document.getElementById("clock-time");
    if (dateEl) dateEl.textContent = ClockDisplay.formatDate(now);
    if (timeEl) timeEl.textContent = ClockDisplay.formatTime(now);
  },

  /**
   * Format a Date as an Indonesian-locale date string.
   * Example: "Senin, 14 Juli 2025"
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    const day   = DAYS_ID[date.getDay()];
    const d     = date.getDate();
    const month = MONTHS_ID[date.getMonth()];
    const year  = date.getFullYear();
    return `${day}, ${d} ${month} ${year}`;
  },

  /**
   * Format a Date as a zero-padded HH:MM:SS string.
   * Example: "09:05:03"
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },
};

/* =========================================================
   GreetingDisplay
   Shows a time-based Indonesian greeting with an optional
   personalized name loaded from LocalStorage.
   ========================================================= */
const GreetingDisplay = {
  /**
   * Load the stored custom name (if any) and render the greeting.
   */
  init() {
    GreetingDisplay.render();
  },

  /**
   * Build the greeting string from the current hour and the stored
   * custom name, then write it into #greeting-text.
   *
   * Format when name is stored : "Selamat Pagi, Budi!"
   * Format when no name stored  : "Selamat Pagi"
   */
  render() {
    const hour    = new Date().getHours();
    const base    = GreetingDisplay.getGreeting(hour);
    const name    = StorageManager.load(TLD_CUSTOM_NAME_KEY);
    const text    = (name && name.trim().length > 0)
      ? `${base}, ${name.trim()}!`
      : base;

    const el = document.getElementById("greeting-text");
    if (el) el.textContent = text;
  },

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
  getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return "Selamat Pagi";
    if (hour >= 12 && hour <= 14) return "Selamat Siang";
    if (hour >= 15 && hour <= 17) return "Selamat Sore";
    return "Selamat Malam"; // 18–23 and 00–04
  },

  /**
   * Persist the user's chosen display name and refresh the greeting.
   * Passing an empty/whitespace-only string removes the stored name.
   *
   * @param {string} name  Raw value from the name input field
   */
  updateName(name) {
    const trimmed = (name || "").trim();
    if (trimmed.length > 0) {
      StorageManager.save(TLD_CUSTOM_NAME_KEY, trimmed);
    } else {
      StorageManager.remove(TLD_CUSTOM_NAME_KEY);
    }
    GreetingDisplay.render();
  },
};

/* =========================================================
   TaskList
   Manages the to-do list with full CRUD, duplicate detection,
   and LocalStorage persistence.
   ========================================================= */
const TaskList = {
  /** @type {Task[]} In-memory task array */
  tasks: [],

  /**
   * Load tasks from LocalStorage (falls back to empty array) and render.
   */
  init() {
    const stored = StorageManager.load(TLD_TASKS_KEY);
    TaskList.tasks = Array.isArray(stored) ? stored : [];
    TaskList.render();
  },

  /**
   * Rebuild the task list DOM from the in-memory tasks array.
   * Tasks are rendered in ascending insertedAt order (oldest first).
   */
  render() {
    const container = document.getElementById("task-list");
    if (!container) return;

    // Sort by insertedAt ascending (oldest first)
    const sorted = [...TaskList.tasks].sort((a, b) => a.insertedAt - b.insertedAt);

    if (sorted.length === 0) {
      container.innerHTML = '<li class="task-list__empty">Belum ada tugas. Tambahkan tugas baru di atas.</li>';
      return;
    }

    container.innerHTML = sorted.map((task) => {
      const completedClass = task.completed ? " task-item__text--completed" : "";
      const checkedAttr    = task.completed ? ' checked' : '';
      return `<li class="task-item" data-id="${task.id}">
  <input
    type="checkbox"
    class="task-item__checkbox"
    data-id="${task.id}"
    aria-label="Tandai selesai"
    ${checkedAttr}
  >
  <span class="task-item__text${completedClass}">${TaskList._escapeHtml(task.text)}</span>
  <div class="task-item__actions">
    <button
      class="task-item__btn task-item__btn--edit"
      data-action="edit"
      data-id="${task.id}"
      aria-label="Edit tugas"
    >Edit</button>
    <button
      class="task-item__btn task-item__btn--delete"
      data-action="delete"
      data-id="${task.id}"
      aria-label="Hapus tugas"
    >Hapus</button>
  </div>
</li>`;
    }).join("\n");
  },

  /**
   * Persist the current in-memory tasks array to LocalStorage.
   */
  persist() {
    StorageManager.save(TLD_TASKS_KEY, TaskList.tasks);
  },

  /**
   * Normalize a task text string for duplicate comparison:
   * trim leading/trailing whitespace, collapse internal whitespace
   * sequences to a single space, and convert to lowercase.
   * @param {string} text
   * @returns {string}
   */
  normalize(text) {
    return (text || "").trim().replace(/\s+/g, " ").toLowerCase();
  },

  /**
   * Check whether a normalized text already exists in the task list.
   * Optionally excludes a specific task ID from the comparison
   * (used during edits to allow saving the same text unchanged).
   * @param {string} normalizedText
   * @param {string} [excludeId]
   * @returns {boolean}
   */
  isDuplicate(normalizedText, excludeId) {
    return TaskList.tasks.some(
      (task) =>
        task.id !== excludeId &&
        TaskList.normalize(task.text) === normalizedText
    );
  },

  // ------------------------------------------------------------------
  // Stubs — implemented in later tasks
  // ------------------------------------------------------------------

  /**
   * Validate and add a new task to the list.
   * Shows inline Bahasa Indonesia error messages on failure.
   * On success creates a Task, persists, renders, and clears the input.
   * @param {string} text  Raw value from the task input field
   */
  addTask(text) {
    const errorEl = document.getElementById("task-error");

    /** @param {string} msg */
    function showError(msg) {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
      }
    }

    function clearError() {
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    }

    // 1. Enforce max-100-task limit
    if (TaskList.tasks.length >= 100) {
      showError("Maksimal 100 tugas telah tercapai.");
      return;
    }

    // 2. Reject empty / whitespace-only input
    const trimmed = (text || "").trim();
    if (trimmed.length === 0) {
      showError("Nama tugas tidak boleh kosong.");
      return;
    }

    // 3. Reject if non-whitespace character count exceeds 200
    const nonWsCount = trimmed.replace(/\s/g, "").length;
    if (nonWsCount > 200) {
      showError("Nama tugas maksimal 200 karakter.");
      return;
    }

    // 4. Reject duplicate (case- and whitespace-insensitive)
    const normalized = TaskList.normalize(text);
    if (TaskList.isDuplicate(normalized)) {
      showError("Tugas ini sudah ada dalam daftar.");
      return;
    }

    // 5. Create task and persist
    clearError();
    const id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();

    TaskList.tasks.push({
      id,
      text: trimmed,
      completed: false,
      insertedAt: Date.now(),
    });

    TaskList.persist();
    TaskList.render();

    // Clear the input field
    const inputEl = document.getElementById("task-input");
    if (inputEl) inputEl.value = "";
  },
  /**
   * Flip the `completed` flag on the task with the given id.
   * Persists and re-renders the list.
   * @param {string} id
   */
  toggleComplete(id) {
    const task = TaskList.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    TaskList.persist();
    TaskList.render();
  },
  /**
   * Switch a task item into edit mode.
   * Replaces the text <span> with a pre-filled <input> and swaps the
   * Edit button for Confirm + Cancel buttons.
   * @param {string} id
   */
  startEdit(id) {
    const task = TaskList.tasks.find((t) => t.id === id);
    if (!task) return;

    const li = document.querySelector(`.task-item[data-id="${id}"]`);
    if (!li) return;

    // Replace the text span with an edit input
    const textSpan = li.querySelector(".task-item__text");
    if (!textSpan) return;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "task-item__edit-input";
    input.dataset.id = id;
    input.value = task.text;
    input.setAttribute("aria-label", "Edit tugas");
    textSpan.replaceWith(input);
    input.focus();

    // Replace the Edit button with Confirm + Cancel buttons
    const actionsDiv = li.querySelector(".task-item__actions");
    if (actionsDiv) {
      const editBtn = actionsDiv.querySelector('[data-action="edit"]');
      if (editBtn) {
        const confirmBtn = document.createElement("button");
        confirmBtn.className = "task-item__btn task-item__btn--confirm";
        confirmBtn.dataset.action = "confirm";
        confirmBtn.dataset.id = id;
        confirmBtn.setAttribute("aria-label", "Konfirmasi edit");
        confirmBtn.textContent = "Simpan";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "task-item__btn task-item__btn--cancel";
        cancelBtn.dataset.action = "cancel";
        cancelBtn.dataset.id = id;
        cancelBtn.setAttribute("aria-label", "Batalkan edit");
        cancelBtn.textContent = "Batal";

        editBtn.replaceWith(confirmBtn, cancelBtn);
      }
    }
  },

  /**
   * Validate and commit the edited text for the task with the given id.
   * On success: updates task.text, persists, and re-renders.
   * On failure: shows an inline Bahasa Indonesia error and keeps edit mode open.
   * @param {string} id
   * @param {string} newText  Raw value from the edit input
   */
  confirmEdit(id, newText) {
    const task = TaskList.tasks.find((t) => t.id === id);
    if (!task) return;

    const li = document.querySelector(`.task-item[data-id="${id}"]`);

    /** @param {string} msg */
    function showEditError(msg) {
      if (!li) return;
      // Remove any existing error node first
      const existing = li.querySelector(".task-item__error");
      if (existing) existing.remove();

      const errDiv = document.createElement("div");
      errDiv.className = "task-item__error error-message";
      errDiv.textContent = msg;

      const input = li.querySelector(".task-item__edit-input");
      if (input) {
        input.insertAdjacentElement("afterend", errDiv);
      } else {
        li.appendChild(errDiv);
      }
    }

    function clearEditError() {
      if (!li) return;
      const existing = li.querySelector(".task-item__error");
      if (existing) existing.remove();
    }

    // 1. Reject empty / whitespace-only input
    const trimmed = (newText || "").trim();
    if (trimmed.length === 0) {
      showEditError("Nama tugas tidak boleh kosong.");
      return;
    }

    // 2. Reject if non-whitespace character count exceeds 200
    const nonWsCount = trimmed.replace(/\s/g, "").length;
    if (nonWsCount > 200) {
      showEditError("Nama tugas maksimal 200 karakter.");
      return;
    }

    // 3. Reject duplicate (exclude the task being edited from the check)
    const normalized = TaskList.normalize(newText);
    if (TaskList.isDuplicate(normalized, id)) {
      showEditError("Tugas ini sudah ada dalam daftar.");
      return;
    }

    // 4. Success — update, persist, re-render
    clearEditError();
    task.text = trimmed;
    TaskList.persist();
    TaskList.render();
  },

  /**
   * Abort an in-progress edit by calling render(), which restores the
   * original display state without touching the task data.
   * @param {string} id
   */
  cancelEdit(id) {   // eslint-disable-line no-unused-vars
    TaskList.render();
  },
  /**
   * Remove the task with the given id from the array.
   * Persists and re-renders the list.
   * @param {string} id
   */
  deleteTask(id) {
    TaskList.tasks = TaskList.tasks.filter((t) => t.id !== id);
    TaskList.persist();
    TaskList.render();
  },

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  /**
   * Escape HTML special characters to prevent XSS when inserting task
   * text directly into innerHTML.
   * @param {string} str
   * @returns {string}
   * @private
   */
  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },
};

/* =========================================================
   PomodoroTimer
   25-minute countdown timer with idle / running / paused states.
   Uses an absolute end-timestamp to avoid setInterval drift.
   ========================================================= */
const PomodoroTimer = {
  /** Total session length in seconds (25 × 60) */
  TOTAL_SECONDS: 1500,

  /** @type {number} Remaining seconds in the current countdown */
  remaining: 1500,

  /** @type {"idle"|"running"|"paused"} Current timer state */
  state: "idle",

  /** @type {number|null} setInterval handle */
  intervalId: null,

  /**
   * Absolute epoch (ms) at which the countdown reaches zero.
   * Computed on start() / resume so tick() can derive remaining without drift.
   * @type {number|null}
   */
  endTimestamp: null,

  /**
   * Set remaining = 1500, state = "idle", then render the initial display.
   */
  init() {
    PomodoroTimer.remaining = PomodoroTimer.TOTAL_SECONDS;
    PomodoroTimer.state     = "idle";
    PomodoroTimer.intervalId    = null;
    PomodoroTimer.endTimestamp  = null;
    PomodoroTimer.render();
  },

  /**
   * Begin or resume the countdown.
   * Silently ignored when already running (Requirement 4.10).
   */
  start() {
    if (PomodoroTimer.state === "running") return;

    // Record the absolute finish time from the current remaining seconds
    PomodoroTimer.endTimestamp = Date.now() + PomodoroTimer.remaining * 1000;
    PomodoroTimer.intervalId   = setInterval(PomodoroTimer.tick, 1000);
    PomodoroTimer.state        = "running";
    PomodoroTimer.render();
  },

  /**
   * Stop the countdown and retain the current remaining time.
   */
  pause() {
    clearInterval(PomodoroTimer.intervalId);
    PomodoroTimer.intervalId = null;
    PomodoroTimer.state      = "paused";
    PomodoroTimer.render();
  },

  /**
   * Stop any active countdown and reset to 25:00 / idle.
   */
  reset() {
    clearInterval(PomodoroTimer.intervalId);
    PomodoroTimer.intervalId   = null;
    PomodoroTimer.endTimestamp = null;
    PomodoroTimer.remaining    = PomodoroTimer.TOTAL_SECONDS;
    PomodoroTimer.state        = "idle";
    PomodoroTimer.render();
  },

  /**
   * Called every second while running.
   * Derives remaining from the absolute end-timestamp to avoid cumulative drift.
   */
  tick() {
    const remaining = Math.ceil((PomodoroTimer.endTimestamp - Date.now()) / 1000);
    if (remaining <= 0) {
      PomodoroTimer.remaining = 0;
      PomodoroTimer.complete();
    } else {
      PomodoroTimer.remaining = remaining;
      PomodoroTimer.render();
    }
  },

  /**
   * Fired when the countdown hits zero.
   * Stops the interval, resets to idle, shows a Bahasa Indonesia completion
   * notification for at least 5 seconds, then hides it.
   */
  complete() {
    clearInterval(PomodoroTimer.intervalId);
    PomodoroTimer.intervalId   = null;
    PomodoroTimer.endTimestamp = null;
    PomodoroTimer.state        = "idle";

    // Show completion notification
    const notifEl = document.getElementById("pomodoro-notification");
    if (notifEl) {
      notifEl.textContent = "Sesi Pomodoro selesai!";
      notifEl.hidden = false;
      // Hide after 5 seconds minimum
      setTimeout(() => {
        notifEl.hidden = true;
      }, 5000);
    }

    PomodoroTimer.render();
  },

  /**
   * Update the MM:SS display and toggle Start / Pause button visibility.
   *
   * Running  → show #pomodoro-pause, hide #pomodoro-start
   * Otherwise → show #pomodoro-start, hide #pomodoro-pause
   */
  render() {
    const displayEl = document.getElementById("pomodoro-display");
    if (displayEl) {
      displayEl.textContent = PomodoroTimer.formatTime(PomodoroTimer.remaining);
    }

    const startBtn  = document.getElementById("pomodoro-start");
    const pauseBtn  = document.getElementById("pomodoro-pause");

    if (PomodoroTimer.state === "running") {
      if (startBtn) startBtn.hidden = true;
      if (pauseBtn) pauseBtn.hidden = false;
    } else {
      if (startBtn) startBtn.hidden = false;
      if (pauseBtn) pauseBtn.hidden = true;
    }
  },

  /**
   * Convert a total number of seconds into a zero-padded "MM:SS" string.
   * @param {number} seconds  Non-negative integer
   * @returns {string}  e.g. "25:00", "09:05"
   */
  formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(m)}:${pad(r)}`;
  },
};

/* =========================================================
   QuickLinkManager
   Manages the collection of quick-access bookmarks with
   validation, URL normalization, and LocalStorage persistence.
   ========================================================= */
const QuickLinkManager = {
  /** @type {QuickLink[]} In-memory links array */
  links: [],

  /** @type {number} Maximum number of quick links allowed */
  MAX_LINKS: 20,

  /**
   * Load links from LocalStorage (falls back to empty array) and render.
   */
  init() {
    const stored = StorageManager.load(TLD_LINKS_KEY);
    QuickLinkManager.links = Array.isArray(stored) ? stored : [];
    QuickLinkManager.render();
  },

  /**
   * Rebuild the links grid DOM from the in-memory links array.
   * Renders each link as a card with label, open button, and delete button.
   */
  render() {
    const container = document.getElementById("links-grid");
    if (!container) return;

    if (QuickLinkManager.links.length === 0) {
      container.innerHTML = '<p class="links-grid__empty">Belum ada tautan cepat. Tambahkan tautan baru di atas.</p>';
      return;
    }

    container.innerHTML = QuickLinkManager.links.map((link) => {
      return `<div class="link-card" data-id="${link.id}">
  <span class="link-card__label">${QuickLinkManager._escapeHtml(link.label)}</span>
  <div class="link-card__actions">
    <button
      class="link-card__btn link-card__btn--open"
      data-action="open"
      data-id="${link.id}"
      aria-label="Buka tautan ${QuickLinkManager._escapeHtml(link.label)}"
    >Buka</button>
    <button
      class="link-card__btn link-card__btn--delete"
      data-action="delete"
      data-id="${link.id}"
      aria-label="Hapus tautan ${QuickLinkManager._escapeHtml(link.label)}"
    >Hapus</button>
  </div>
</div>`;
    }).join("\n");
  },

  /**
   * Validate and add a new quick link.
   * Shows per-field Bahasa Indonesia error messages on failure.
   * On success creates a QuickLink, persists, renders, and clears inputs.
   * @param {string} label  Raw label value from the label input field
   * @param {string} url    Raw URL value from the URL input field
   */
  addLink(label, url) {
    const labelErrorEl = document.getElementById("link-label-error");
    const urlErrorEl   = document.getElementById("link-url-error");
    const limitErrorEl = document.getElementById("link-limit-error");

    // Helper functions for per-field error display
    function showLabelError(msg) {
      if (labelErrorEl) {
        labelErrorEl.textContent = msg;
        labelErrorEl.hidden = false;
      }
    }
    function clearLabelError() {
      if (labelErrorEl) {
        labelErrorEl.hidden = true;
        labelErrorEl.textContent = "";
      }
    }
    function showUrlError(msg) {
      if (urlErrorEl) {
        urlErrorEl.textContent = msg;
        urlErrorEl.hidden = false;
      }
    }
    function clearUrlError() {
      if (urlErrorEl) {
        urlErrorEl.hidden = true;
        urlErrorEl.textContent = "";
      }
    }
    function showLimitError(msg) {
      if (limitErrorEl) {
        limitErrorEl.textContent = msg;
        limitErrorEl.hidden = false;
      }
    }
    function clearLimitError() {
      if (limitErrorEl) {
        limitErrorEl.hidden = true;
        limitErrorEl.textContent = "";
      }
    }

    // Clear all errors before re-validation
    clearLabelError();
    clearUrlError();
    clearLimitError();

    const trimmedLabel = (label || "").trim();
    const trimmedUrl   = (url || "").trim();

    let hasError = false;

    // 1. Validate label — non-empty
    if (trimmedLabel.length === 0) {
      showLabelError("Label tautan tidak boleh kosong.");
      hasError = true;
    } else if (trimmedLabel.length > 50) {
      // 2. Validate label — max 50 characters
      showLabelError("Label tautan maksimal 50 karakter.");
      hasError = true;
    }

    // 3. Validate URL — non-empty
    if (trimmedUrl.length === 0) {
      showUrlError("URL tautan tidak boleh kosong.");
      hasError = true;
    }

    if (hasError) return;

    // 4. Enforce max-20-link limit
    if (QuickLinkManager.links.length >= QuickLinkManager.MAX_LINKS) {
      showLimitError("Maksimal 20 tautan cepat telah tercapai.");
      return;
    }

    // 5. Normalize URL and create the QuickLink object
    const normalizedUrl = QuickLinkManager.normalizeUrl(trimmedUrl);
    const id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();

    QuickLinkManager.links.push({
      id,
      label: trimmedLabel,
      url: normalizedUrl,
    });

    QuickLinkManager.persist();
    QuickLinkManager.render();

    // Clear the input fields
    const labelInputEl = document.getElementById("link-label-input");
    const urlInputEl   = document.getElementById("link-url-input");
    if (labelInputEl) labelInputEl.value = "";
    if (urlInputEl)   urlInputEl.value   = "";
  },

  /**
   * Open the link with the given id in a new tab.
   * @param {string} id
   */
  openLink(id) {
    const link = QuickLinkManager.links.find((l) => l.id === id);
    if (!link) return;
    window.open(link.url, "_blank", "noopener,noreferrer");
  },

  /**
   * Remove the link with the given id from the array.
   * Persists and re-renders the grid.
   * @param {string} id
   */
  deleteLink(id) {
    QuickLinkManager.links = QuickLinkManager.links.filter((l) => l.id !== id);
    QuickLinkManager.persist();
    QuickLinkManager.render();
  },

  /**
   * Prepend "https://" to a URL that doesn't already start with
   * "http://" or "https://".
   * @param {string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    const s = (url || "").trim();
    if (s.startsWith("http://") || s.startsWith("https://")) {
      return s;
    }
    return "https://" + s;
  },

  /**
   * Persist the current in-memory links array to LocalStorage.
   */
  persist() {
    StorageManager.save(TLD_LINKS_KEY, QuickLinkManager.links);
  },

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  /**
   * Escape HTML special characters to prevent XSS when inserting link
   * labels directly into innerHTML.
   * @param {string} str
   * @returns {string}
   * @private
   */
  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },
};

/* =========================================================
   App — Orchestrator stub (implemented in task 11.1)
   ========================================================= */
const App = {
  init() {
    StorageManager.init();
    ThemeManager.init();
    ClockDisplay.init();
    GreetingDisplay.init();
    TaskList.init();
    PomodoroTimer.init();
    QuickLinkManager.init();

    // Theme toggle button
    const themeToggleBtn = document.getElementById("theme-toggle");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => ThemeManager.toggle());
    }

    // Custom name form — submit updates the greeting
    const nameForm = document.getElementById("name-form");
    if (nameForm) {
      nameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("name-input");
        GreetingDisplay.updateName(input ? input.value : "");
      });
    }

    // ---------------------------------------------------------------
    // Task add form
    // ---------------------------------------------------------------
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
      taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("task-input");
        TaskList.addTask(input ? input.value : "");
      });
    }

    // ---------------------------------------------------------------
    // Task list — event delegation (edit / confirm / cancel / delete / toggle)
    // ---------------------------------------------------------------
    const taskListEl = document.getElementById("task-list");
    if (taskListEl) {
      taskListEl.addEventListener("click", (e) => {
        // Checkbox — toggle completion
        if (e.target.classList.contains("task-item__checkbox")) {
          const id = e.target.dataset.id;
          if (id) TaskList.toggleComplete(id);
          return;
        }

        // Action buttons
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const id     = btn.dataset.id;
        if (!id) return;

        if (action === "edit") {
          TaskList.startEdit(id);
        } else if (action === "confirm") {
          const li        = btn.closest(".task-item");
          const editInput = li ? li.querySelector(".task-item__edit-input") : null;
          TaskList.confirmEdit(id, editInput ? editInput.value : "");
        } else if (action === "cancel") {
          TaskList.cancelEdit(id);
        } else if (action === "delete") {
          TaskList.deleteTask(id);
        }
      });
    }

    // ---------------------------------------------------------------
    // Pomodoro controls
    // ---------------------------------------------------------------
    const pomodoroStartBtn = document.getElementById("pomodoro-start");
    if (pomodoroStartBtn) {
      pomodoroStartBtn.addEventListener("click", () => PomodoroTimer.start());
    }

    const pomodoroPauseBtn = document.getElementById("pomodoro-pause");
    if (pomodoroPauseBtn) {
      pomodoroPauseBtn.addEventListener("click", () => PomodoroTimer.pause());
    }

    const pomodoroResetBtn = document.getElementById("pomodoro-reset");
    if (pomodoroResetBtn) {
      pomodoroResetBtn.addEventListener("click", () => PomodoroTimer.reset());
    }

    // ---------------------------------------------------------------
    // Quick link add form
    // ---------------------------------------------------------------
    const linkForm = document.getElementById("link-form");
    if (linkForm) {
      linkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const labelInput = document.getElementById("link-label-input");
        const urlInput   = document.getElementById("link-url-input");
        QuickLinkManager.addLink(
          labelInput ? labelInput.value : "",
          urlInput   ? urlInput.value   : ""
        );
      });
    }

    // ---------------------------------------------------------------
    // Quick links grid — event delegation (open / delete)
    // ---------------------------------------------------------------
    const linksGrid = document.getElementById("links-grid");
    if (linksGrid) {
      linksGrid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const id     = btn.dataset.id;
        if (!id) return;

        if (action === "open") {
          QuickLinkManager.openLink(id);
        } else if (action === "delete") {
          QuickLinkManager.deleteLink(id);
        }
      });
    }
  },
};

document.addEventListener("DOMContentLoaded", App.init);
