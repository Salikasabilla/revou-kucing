# Design Document

## Overview

Todo Life Dashboard is a single-page web application (SPA) built exclusively with HTML5, CSS3, and Vanilla JavaScript. It combines personal productivity features — a real-time personalized greeting, a to-do list with full CRUD, a 25-minute Pomodoro timer, and a quick-links manager — into one cohesive dashboard interface. All user-visible text is in Bahasa Indonesia; all source code, variable names, function names, and comments are written in English.

The application runs entirely in the browser with no server, no build step, and no external dependencies. All state is persisted via the Browser LocalStorage API. The project is structured to be deployable on GitHub Pages as a static site using only relative asset paths.

### Design Goals

- **Zero dependencies**: No JavaScript frameworks (no React, Vue, etc.), no CSS frameworks (no Bootstrap, Tailwind, etc.), no npm or bundler.
- **Single-file modules**: One `index.html`, one `css/style.css`, one `js/app.js`.
- **Offline-first**: Fully functional without an internet connection after initial page load.
- **Accessible and responsive**: Works on viewports from 320px (mobile) to 1440px+ (desktop), with WCAG AA contrast ratios and keyboard-navigable controls.
- **Maintainable**: Clear module separation achieved through JavaScript objects/namespaces inside the single `app.js` file.

---

## Architecture

The application follows a **module pattern** implemented inside a single `js/app.js` file. Each feature is encapsulated in its own JavaScript object (namespace), keeping concerns separated without requiring ES modules or a bundler.

```
index.html
  └── css/style.css          (all styling, CSS custom properties for themes)
  └── js/app.js
        ├── StorageManager   (LocalStorage read/write with error handling)
        ├── ThemeManager     (light/dark toggle, OS preference, persistence)
        ├── ClockDisplay     (real-time clock and date rendering)
        ├── GreetingDisplay  (time-based greeting + custom name)
        ├── TaskList         (to-do CRUD, duplicate prevention, persistence)
        ├── PomodoroTimer    (countdown timer, state machine, notifications)
        ├── QuickLinkManager (add/open/delete links, validation, persistence)
        └── App              (orchestrator: init order, wires modules together)
```

### Initialization Order

The `App.init()` function, called on `DOMContentLoaded`, initializes modules in the following order to guarantee correct state before any rendering occurs:

1. `StorageManager.init()` — detect LocalStorage availability
2. `ThemeManager.init()` — apply stored or OS-preferred theme (before paint)
3. `ClockDisplay.init()` — start 1-second interval
4. `GreetingDisplay.init()` — render greeting from stored name + current hour
5. `TaskList.init()` — load tasks from LocalStorage, render list
6. `PomodoroTimer.init()` — render initial 25:00 state
7. `QuickLinkManager.init()` — load links from LocalStorage, render grid

### Data Flow

```
User Interaction
      │
      ▼
DOM Event Handler (in each module)
      │
      ├── Validate input
      ├── Update in-memory state
      ├── StorageManager.save(key, data)
      └── Re-render DOM fragment
```

All state mutations go through the module's own methods; no module directly touches another module's internal state.

---

## Components and Interfaces

### StorageManager

Wraps all LocalStorage access. Detects availability once at init and sets a flag. All other modules call `StorageManager` instead of `localStorage` directly.

```javascript
StorageManager = {
  available: Boolean,
  init(),              // test localStorage availability; show warning if unavailable
  save(key, value),    // JSON.stringify + setItem; noop if unavailable
  load(key),           // getItem + JSON.parse; returns null on error or unavailable
  remove(key),         // removeItem; noop if unavailable
}
```

**LocalStorage Keys:**

| Key | Value Type | Description |
|---|---|---|
| `tld_tasks` | `Task[]` | Array of task objects |
| `tld_links` | `QuickLink[]` | Array of quick link objects |
| `tld_custom_name` | `string` | User's custom display name |
| `tld_theme` | `"light" \| "dark"` | Active theme preference |

---

### ThemeManager

Manages the light/dark theme. Applies the theme by toggling a `data-theme` attribute on `<html>`. CSS custom properties defined under `[data-theme="light"]` and `[data-theme="dark"]` selectors handle all color changes.

```javascript
ThemeManager = {
  currentTheme: String,   // "light" | "dark"
  init(),                 // load from storage → OS fallback → apply
  apply(theme),           // set data-theme on <html>, update toggle icon
  toggle(),               // flip between light and dark, persist
  getOSPreference(),      // returns "dark" if prefers-color-scheme: dark, else "light"
}
```

**CSS Custom Properties (defined at `:root` level per theme):**

```css
[data-theme="light"] {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-text-primary: #212529;
  --color-text-secondary: #6c757d;
  --color-accent: #4361ee;
  --color-accent-hover: #3451d1;
  --color-border: #dee2e6;
  --color-danger: #dc3545;
  --color-success: #198754;
}

[data-theme="dark"] {
  --color-bg: #121212;
  --color-surface: #1e1e1e;
  --color-text-primary: #e9ecef;
  --color-text-secondary: #adb5bd;
  --color-accent: #6d8dff;
  --color-accent-hover: #8ba4ff;
  --color-border: #2d2d2d;
  --color-danger: #f07070;
  --color-success: #4fc08d;
}
```

---

### ClockDisplay

Renders real-time clock and date using the browser's local timezone. Updates every 1 second via `setInterval`.

```javascript
ClockDisplay = {
  intervalId: Number,
  init(),    // render immediately; start 1-second interval
  render(),  // build date and time strings; update DOM elements
  formatDate(date),  // returns e.g. "Senin, 14 Juli 2025"
  formatTime(date),  // returns e.g. "09:05:32" (HH:MM:SS)
}
```

**Indonesian locale constants (embedded in source):**

```javascript
const DAYS_ID    = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const MONTHS_ID  = ["Januari","Februari","Maret","April","Mei","Juni",
                    "Juli","Agustus","September","Oktober","November","Desember"];
```

---

### GreetingDisplay

Determines the greeting string from the current local hour and appends the custom name if one is stored.

```javascript
GreetingDisplay = {
  init(),               // read name from StorageManager; render
  render(),             // build greeting string; update DOM
  getGreeting(hour),    // returns "Selamat Pagi" | "Selamat Siang" | etc.
  updateName(name),     // called by Dashboard when name changes
}
```

**Hour-to-greeting mapping:**

| Hour range | Greeting |
|---|---|
| 05:00 – 11:59 | Selamat Pagi |
| 12:00 – 14:59 | Selamat Siang |
| 15:00 – 17:59 | Selamat Sore |
| 18:00 – 23:59 and 00:00 – 04:59 | Selamat Malam |

---

### TaskList

Manages the to-do list with full CRUD, duplicate detection, and LocalStorage persistence.

```javascript
TaskList = {
  tasks: Task[],      // in-memory array
  init(),             // load from StorageManager; render
  render(),           // rebuild task list DOM from tasks array
  addTask(text),      // validate → dedup → push → save → render
  toggleComplete(id), // flip completed flag → save → render
  startEdit(id),      // replace text span with input field
  confirmEdit(id, newText),  // validate → dedup → update → save → render
  cancelEdit(id),     // restore original text display
  deleteTask(id),     // remove from array → save → render
  normalize(text),    // trim + collapse whitespace + lowercase
  isDuplicate(normalizedText, excludeId?),  // check against tasks array
  persist(),          // StorageManager.save(TLD_TASKS_KEY, tasks)
}
```

**Task state machine for edit mode:**

```
DISPLAY ──startEdit──► EDITING
EDITING ──confirmEdit──► DISPLAY  (if valid and no duplicate)
EDITING ──cancelEdit──►  DISPLAY
EDITING ──confirmEdit──► EDITING  (if invalid — show error, stay in edit)
```

---

### PomodoroTimer

Implements a countdown timer with a three-state machine: `idle`, `running`, `paused`.

```javascript
PomodoroTimer = {
  TOTAL_SECONDS: 1500,   // 25 * 60
  remaining: Number,     // current countdown value in seconds
  state: String,         // "idle" | "running" | "paused"
  intervalId: Number,
  init(),     // set remaining = 1500; state = "idle"; render
  start(),    // if state !== "running": start interval; state = "running"
  pause(),    // clearInterval; state = "paused"; render
  reset(),    // clearInterval; remaining = 1500; state = "idle"; render
  tick(),     // decrement remaining; if 0 → complete()
  complete(), // clearInterval; state = "idle"; show completion notification
  render(),   // update MM:SS display; toggle Start/Pause button visibility
  formatTime(seconds),  // returns "MM:SS" string
}
```

**State machine diagram:**

```
        start()           pause()
idle ──────────► running ──────────► paused
 ▲                  │                  │
 │   reset()        │ tick()→0         │ start()
 │◄─────────────────┘                  │
 │◄────────────────────────────────────┘
 │   reset()
```

---

### QuickLinkManager

Manages the collection of quick-access bookmarks.

```javascript
QuickLinkManager = {
  links: QuickLink[],
  MAX_LINKS: 20,
  init(),                // load from StorageManager; render
  render(),              // rebuild links grid DOM
  addLink(label, url),   // validate → prepend https if needed → push → save → render
  openLink(id),          // window.open(url, "_blank", "noopener,noreferrer")
  deleteLink(id),        // remove from array → save → render
  normalizeUrl(url),     // prepend "https://" if not http:// or https://
  persist(),             // StorageManager.save(TLD_LINKS_KEY, links)
}
```

---

### App (Orchestrator)

```javascript
App = {
  init(),  // called on DOMContentLoaded; initializes all modules in order
}

document.addEventListener("DOMContentLoaded", App.init);
```

---

## Data Models

### Task

```javascript
/**
 * @typedef {Object} Task
 * @property {string}  id          - Unique identifier (crypto.randomUUID() or Date.now().toString())
 * @property {string}  text        - Task description (1–200 non-whitespace chars)
 * @property {boolean} completed   - Completion status
 * @property {number}  insertedAt  - Unix timestamp (ms) for stable insertion-order sort
 */
```

**Constraints:**
- Maximum 100 tasks stored (Requirement 8.1)
- `text` stored as-is (display value); normalization only used for dedup comparisons
- Tasks rendered in ascending `insertedAt` order (oldest first)

---

### QuickLink

```javascript
/**
 * @typedef {Object} QuickLink
 * @property {string} id     - Unique identifier
 * @property {string} label  - Display label (1–50 characters)
 * @property {string} url    - Full URL including scheme (max 2048 chars)
 */
```

**Constraints:**
- Maximum 20 links (Requirement 5.8)
- URL always stored with a valid scheme (`http://` or `https://`)

---

### LocalStorage Schema

```javascript
// tld_tasks — Array<Task>
[
  { "id": "...", "text": "Belajar CSS Grid", "completed": false, "insertedAt": 1720900000000 },
  { "id": "...", "text": "Review PR teman", "completed": true,  "insertedAt": 1720900060000 }
]

// tld_links — Array<QuickLink>
[
  { "id": "...", "label": "GitHub", "url": "https://github.com" }
]

// tld_custom_name — String
"Budi"

// tld_theme — String
"dark"
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting always matches current hour

*For any* hour value (0–23), `GreetingDisplay.getGreeting(hour)` SHALL return exactly one of "Selamat Pagi", "Selamat Siang", "Selamat Sore", or "Selamat Malam", and every integer hour maps to exactly one greeting with no gaps or overlaps in the four defined ranges.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

---

### Property 2: Greeting with name round-trip

*For any* valid CustomName (1–50 non-whitespace characters), saving it via `StorageManager` and then calling `GreetingDisplay.render()` SHALL produce a greeting string that ends with `", " + name + "!"`.

**Validates: Requirements 1.5, 6.2, 6.4**

---

### Property 3: Task addition grows the list

*For any* task list and any valid task text (1–200 non-whitespace characters) that does not duplicate an existing task, calling `TaskList.addTask(text)` SHALL increase `TaskList.tasks.length` by exactly 1, and the new task SHALL appear at the end of the list.

**Validates: Requirements 2.2, 2.11**

---

### Property 4: Whitespace and empty inputs are always rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `TaskList.addTask(text)` SHALL leave `TaskList.tasks` unchanged and SHALL not write to LocalStorage.

**Validates: Requirements 2.10**

---

### Property 5: Duplicate task prevention (normalization invariant)

*For any* two strings `a` and `b` such that `normalize(a) === normalize(b)`, if `a` is already in the task list, adding `b` SHALL be rejected — and the task list SHALL remain unchanged.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 6: Edit duplicate check excludes self

*For any* task `T` in the task list, calling `TaskList.confirmEdit(T.id, T.text)` (editing a task to its own current text) SHALL succeed and leave `T.text` unchanged, because the duplicate check excludes the task being edited.

**Validates: Requirements 3.4, 3.5**

---

### Property 7: Pomodoro timer tick monotonically decrements

*For any* initial `remaining` value `n > 0`, after `n` calls to `PomodoroTimer.tick()` the `remaining` value SHALL be 0, and `PomodoroTimer.state` SHALL have transitioned to `"idle"` with the completion notification shown.

**Validates: Requirements 4.3, 4.7**

---

### Property 8: Pomodoro reset invariant

*For any* timer state (idle, running, or paused) and any remaining time, calling `PomodoroTimer.reset()` SHALL set `remaining` to 1500 and `state` to `"idle"`.

**Validates: Requirements 4.6**

---

### Property 9: Task persistence round-trip

*For any* set of tasks, after calling `TaskList.persist()`, calling `StorageManager.load("tld_tasks")` SHALL return an array that is deep-equal to `TaskList.tasks`.

**Validates: Requirements 2.11, 8.1**

---

### Property 10: QuickLink URL normalization

*For any* URL string that does not begin with `"http://"` or `"https://"`, `QuickLinkManager.normalizeUrl(url)` SHALL return a string that begins with `"https://"` and is otherwise identical to the original input.

**Validates: Requirements 5.5**

---

### Property 11: QuickLink max-limit enforcement

*For any* QuickLinkManager state where `links.length === 20`, calling `addLink(label, url)` SHALL leave `links.length` equal to 20 and SHALL not write a new entry to LocalStorage.

**Validates: Requirements 5.8**

---

### Property 12: Theme toggle is an involution

*For any* active theme `T`, calling `ThemeManager.toggle()` twice SHALL result in the same theme `T` being active, and the `data-theme` attribute on `<html>` SHALL equal the original value.

**Validates: Requirements 7.2**

---

## Error Handling

### LocalStorage Unavailable

`StorageManager.init()` wraps a test write/read/delete in a `try/catch`. If it fails (e.g., storage quota exceeded, private browsing restrictions, or security policy), `StorageManager.available` is set to `false` and a non-blocking banner notification in Bahasa Indonesia is rendered:

> "Penyimpanan lokal tidak tersedia. Data tidak akan disimpan setelah halaman ditutup."

All `StorageManager.save()` and `StorageManager.load()` calls are no-ops when `available === false`. The application continues to function in session-only mode.

### Input Validation Errors

Each module displays inline validation messages in Bahasa Indonesia adjacent to the relevant input field. Messages are cleared when the user modifies the input.

| Scenario | Message |
|---|---|
| Empty task input | "Nama tugas tidak boleh kosong." |
| Task > 200 chars (non-whitespace) | "Nama tugas maksimal 200 karakter." |
| Duplicate task | "Tugas ini sudah ada dalam daftar." |
| Empty link label | "Label tautan tidak boleh kosong." |
| Link label > 50 chars | "Label tautan maksimal 50 karakter." |
| Empty link URL | "URL tautan tidak boleh kosong." |
| Max 20 links reached | "Maksimal 20 tautan cepat telah tercapai." |
| Empty edit text | "Nama tugas tidak boleh kosong." |
| Duplicate edit text | "Tugas ini sudah ada dalam daftar." |
| Empty custom name | removes name, reverts greeting (no error — this is valid intent) |

### Pomodoro Edge Cases

- If `start()` is called while `state === "running"`, the call is silently ignored (Requirement 4.10).
- `setInterval` drift is handled by computing the absolute end timestamp on `start()` and deriving `remaining` from `Date.now()` on each tick, avoiding cumulative drift over a 25-minute session.

---

## Testing Strategy

### Unit Tests (Example-Based)

Each module is tested with concrete examples covering the primary happy path, validation edge cases, and error conditions. Recommended framework: **Vitest** (or Jest) — both support browser-like environments via jsdom.

**StorageManager:**
- Returns `null` when key is not present
- Saves and loads a complex object correctly
- Sets `available = false` when localStorage is stubbed to throw

**ThemeManager:**
- Applies `data-theme="dark"` when OS preference is dark and no stored preference
- Toggle switches from light → dark → light

**ClockDisplay:**
- `formatDate` returns correct Indonesian day/month names for known timestamps
- `formatTime` zero-pads single-digit hours, minutes, and seconds

**GreetingDisplay:**
- Returns correct greeting for boundary hours (5, 12, 15, 18, 0, 4, 23)
- Appends name when stored, omits name when not stored

**TaskList:**
- Add valid task → length increases by 1
- Add empty string → rejected with message
- Add duplicate (case/whitespace variants) → rejected
- Toggle complete → `completed` flips
- Delete → task removed from array and storage
- Edit to duplicate of another task → rejected
- Edit to own text → accepted

**PomodoroTimer:**
- Initial state is 1500 / "idle"
- Start → state is "running"
- Pause → state is "paused", remaining preserved
- Reset from running → 1500 / "idle"
- Tick from 1 → reaches 0 → state "idle", notification shown

**QuickLinkManager:**
- URL without scheme gets `https://` prepended
- URL with `http://` is not modified
- 21st link rejected when 20 already stored

### Property-Based Tests

A property-based testing library appropriate for Vanilla JS (e.g., **fast-check**) is used to verify the universally-quantified correctness properties defined above.

Each property test is configured to run a minimum of **100 iterations** with randomly generated inputs.

Each test is tagged with a comment in the following format:
`// Feature: todo-life-dashboard, Property N: <property_text>`

**Mapped property tests:**

| Property | Generator inputs | Assertion |
|---|---|---|
| P1: Greeting hour mapping | `fc.integer({ min: 0, max: 23 })` | result is one of four valid strings; all 24 hours covered with no gap |
| P2: Greeting name round-trip | `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)` | rendered greeting ends with `", " + name + "!"` |
| P3: Task addition grows list | `fc.array(uniqueTaskArb)` + valid new text | `tasks.length` increases by 1 |
| P4: Whitespace inputs rejected | `fc.stringOf(fc.constantFrom(' ','\t','\n'))` | `addTask` returns error; list unchanged |
| P5: Duplicate prevention | `fc.string()` with normalized collision constructed | second add rejected; list unchanged |
| P6: Edit self allowed | any task in list | `confirmEdit(id, task.text)` succeeds |
| P7: Timer tick decrement | `fc.integer({ min: 1, max: 1500 })` as start value | after n ticks, remaining === 0 and state === "idle" |
| P8: Reset invariant | any state + any remaining | after reset, remaining === 1500 and state === "idle" |
| P9: Task persistence round-trip | `fc.array(taskArb)` | `load("tld_tasks")` deep-equals in-memory `tasks` |
| P10: URL normalization | `fc.string().filter(s => !s.startsWith("http"))` | result starts with "https://" |
| P11: Max link limit | links already at 20 | `addLink` leaves length at 20 |
| P12: Theme toggle involution | either theme | toggle → toggle === original |

### Integration / Smoke Tests

The following are verified with 1–2 representative examples rather than property tests, as they involve DOM rendering and component interaction rather than pure logic:

- Page loads with all sections visible (smoke test)
- Theme toggle updates `data-theme` on `<html>` and persists to LocalStorage
- Adding a task and reloading the page shows the task (full round-trip via real LocalStorage)
- Pomodoro timer UI shows Pause button when running and Start button when paused/idle
- Quick link opens in a new tab when clicked
