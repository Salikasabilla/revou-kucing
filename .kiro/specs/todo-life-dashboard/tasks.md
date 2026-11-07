# Implementation Plan: Todo Life Dashboard

## Overview

Build a single-page dashboard using HTML5, CSS3, and Vanilla JavaScript following the module pattern defined in the design. Implementation proceeds in dependency order: project scaffold → core utilities (StorageManager, ThemeManager) → display modules (ClockDisplay, GreetingDisplay) → feature modules (TaskList, PomodoroTimer, QuickLinkManager) → App orchestrator → CSS responsive layout → property-based and unit tests.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the project root with semantic HTML5 sections for: header (clock, greeting, theme toggle, name input), task list panel, Pomodoro timer panel, and quick links panel
  - Add `<link rel="stylesheet" href="css/style.css">` and `<script src="js/app.js" defer></script>` using relative paths
  - Create `css/style.css` with the CSS custom-property skeleton (`:root`, `[data-theme="light"]`, `[data-theme="dark"]` blocks) and reset styles; populate all `--color-*` variables from the design
  - Create `js/app.js` with empty object stubs for `StorageManager`, `ThemeManager`, `ClockDisplay`, `GreetingDisplay`, `TaskList`, `PomodoroTimer`, `QuickLinkManager`, and `App`
  - Add all DOM element IDs and class names required by every module so later tasks can reference them
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

- [x] 2. Implement StorageManager
  - [x] 2.1 Implement `StorageManager` with `init()`, `save(key, value)`, `load(key)`, and `remove(key)` methods
    - `init()` wraps a test write/read/delete in `try/catch`; sets `StorageManager.available = false` and renders a Bahasa Indonesia warning banner if it fails
    - `save()` calls `JSON.stringify` then `setItem`; is a no-op when `available === false`
    - `load()` calls `getItem` then `JSON.parse`; returns `null` on any error or when unavailable
    - `remove()` calls `removeItem`; is a no-op when unavailable
    - Define the four `tld_*` key constants (`tld_tasks`, `tld_links`, `tld_custom_name`, `tld_theme`) as module-level constants
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ]* 2.2 Write unit tests for StorageManager
    - Test: returns `null` when key is absent
    - Test: saves and loads a complex object round-trip correctly
    - Test: sets `available = false` when `localStorage` is stubbed to throw
    - Test: `save()` and `load()` are no-ops when `available === false`
    - _Requirements: 8.6_

- [x] 3. Implement ThemeManager
  - [x] 3.1 Implement `ThemeManager` with `init()`, `apply(theme)`, `toggle()`, and `getOSPreference()` methods
    - `init()` reads stored theme from `StorageManager`; falls back to `getOSPreference()`; calls `apply()`
    - `apply(theme)` sets `data-theme` attribute on `<html>` and updates the toggle button icon
    - `toggle()` flips `currentTheme` between `"light"` and `"dark"`, calls `apply()`, and persists via `StorageManager.save()`
    - `getOSPreference()` returns `"dark"` if `window.matchMedia("(prefers-color-scheme: dark)").matches`, else `"light"`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 3.2 Write property test for ThemeManager toggle involution
    - **Property 12: Theme toggle is an involution**
    - **Validates: Requirements 7.2**
    - `// Feature: todo-life-dashboard, Property 12: Theme toggle is an involution`
    - Generate an arbitrary starting theme (`"light"` or `"dark"`); call `toggle()` twice; assert `data-theme` equals the original value
    - _Requirements: 7.2_

  - [ ]* 3.3 Write unit tests for ThemeManager
    - Test: applies `data-theme="dark"` when OS preference is dark and no stored preference exists
    - Test: toggle switches light → dark → light across two calls
    - Test: persists chosen theme to `StorageManager`
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 4. Implement ClockDisplay
  - [x] 4.1 Implement `ClockDisplay` with `init()`, `render()`, `formatDate(date)`, and `formatTime(date)` methods
    - Embed `DAYS_ID` and `MONTHS_ID` Indonesian locale constant arrays directly in source
    - `formatDate(date)` returns a string like `"Senin, 14 Juli 2025"` using the embedded arrays
    - `formatTime(date)` returns `"HH:MM:SS"` with zero-padding for all three components
    - `init()` calls `render()` immediately then starts a 1-second `setInterval`
    - _Requirements: 1.7, 1.8, 1.9_

  - [ ]* 4.2 Write unit tests for ClockDisplay
    - Test: `formatDate` returns correct Indonesian day and month names for two known timestamps covering different days/months
    - Test: `formatTime` zero-pads single-digit hours, minutes, and seconds (e.g., `09:05:03`)
    - _Requirements: 1.7, 1.8, 1.9_

- [x] 5. Implement GreetingDisplay
  - [x] 5.1 Implement `GreetingDisplay` with `init()`, `render()`, `getGreeting(hour)`, and `updateName(name)` methods
    - `getGreeting(hour)` maps: 5–11 → "Selamat Pagi", 12–14 → "Selamat Siang", 15–17 → "Selamat Sore", 18–23 and 0–4 → "Selamat Malam"
    - `render()` reads the current hour, calls `getGreeting()`, reads the stored name from `StorageManager`, and builds the final string (appends `", " + name + "!"` when a name exists)
    - `init()` calls `render()`
    - `updateName(name)` stores the (trimmed) name via `StorageManager.save()` then calls `render()`, removing the stored key when name is empty/whitespace-only
    - Wire the custom name input field's submit/change event to call `GreetingDisplay.updateName()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.2 Write property test for greeting hour coverage
    - **Property 1: Greeting always matches current hour**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - `// Feature: todo-life-dashboard, Property 1: Greeting always matches current hour`
    - Use `fc.integer({ min: 0, max: 23 })`; assert result is one of the four valid strings and that all 24 hours are covered with no gap
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 5.3 Write property test for greeting name round-trip
    - **Property 2: Greeting with name round-trip**
    - **Validates: Requirements 1.5, 6.2, 6.4**
    - `// Feature: todo-life-dashboard, Property 2: Greeting with name round-trip`
    - Use `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)`; after `updateName(name)`, assert the rendered greeting ends with `", " + name.trim() + "!"`
    - _Requirements: 1.5, 6.2, 6.4_

  - [ ]* 5.4 Write unit tests for GreetingDisplay
    - Test: correct greeting returned for boundary hours 5, 12, 15, 18, 0, 4, 23
    - Test: name appended when stored; omitted when not stored
    - Test: empty/whitespace name submission removes the greeting name
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.3_

- [x] 6. Implement TaskList
  - [x] 6.1 Implement `TaskList.init()`, `render()`, `persist()`, and `normalize(text)` / `isDuplicate(normalizedText, excludeId?)` helpers
    - `init()` loads tasks from `StorageManager.load("tld_tasks")`; falls back to `[]`; calls `render()`
    - `render()` rebuilds the task list DOM in ascending `insertedAt` order; each item renders text, a complete-toggle checkbox, an edit button, and a delete button
    - `normalize(text)` trims, collapses internal whitespace to single space, and lowercases
    - `isDuplicate(normalizedText, excludeId?)` scans `TaskList.tasks` and returns `true` when a match is found (skipping `excludeId`)
    - `persist()` calls `StorageManager.save("tld_tasks", tasks)`
    - _Requirements: 2.1, 2.11, 3.1_

  - [x] 6.2 Implement `TaskList.addTask(text)` with validation and duplicate prevention
    - Validate non-empty/non-whitespace (show inline Bahasa Indonesia error; return early)
    - Validate max 200 non-whitespace characters (show inline Bahasa Indonesia error; return early)
    - Check `isDuplicate(normalize(text))`; show inline Bahasa Indonesia error and return early if true
    - On success: create a `Task` object with `crypto.randomUUID()` (or `Date.now().toString()` fallback), `text`, `completed: false`, and `insertedAt: Date.now()`; push to `tasks`; call `persist()`; call `render()`; clear input field
    - Enforce the max-100-task limit from Requirement 8.1
    - _Requirements: 2.2, 2.10, 3.1, 3.2, 3.3, 8.1_

  - [ ]* 6.3 Write property test for task addition growing the list
    - **Property 3: Task addition grows the list**
    - **Validates: Requirements 2.2, 2.11**
    - `// Feature: todo-life-dashboard, Property 3: Task addition grows the list`
    - Generate a list of unique valid task texts; for each valid new text confirm `tasks.length` increases by exactly 1 and the new task is last
    - _Requirements: 2.2, 2.11_

  - [ ]* 6.4 Write property test for whitespace inputs rejection
    - **Property 4: Whitespace and empty inputs are always rejected**
    - **Validates: Requirements 2.10**
    - `// Feature: todo-life-dashboard, Property 4: Whitespace and empty inputs are always rejected`
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`; assert `addTask` leaves `tasks` unchanged and does not call `StorageManager.save`
    - _Requirements: 2.10_

  - [ ]* 6.5 Write property test for duplicate prevention normalization invariant
    - **Property 5: Duplicate task prevention (normalization invariant)**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - `// Feature: todo-life-dashboard, Property 5: Duplicate task prevention (normalization invariant)`
    - Construct pairs `(a, b)` where `normalize(a) === normalize(b)`; after adding `a`, assert adding `b` is rejected and `tasks` is unchanged
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.6 Implement `TaskList.toggleComplete(id)`, `deleteTask(id)`
    - `toggleComplete(id)` flips `task.completed` on the matching task, applies/removes strikethrough style, calls `persist()` and `render()`
    - `deleteTask(id)` removes the task from the array, calls `persist()` and `render()`
    - _Requirements: 2.3, 2.4, 2.9_

  - [x] 6.7 Implement `TaskList.startEdit(id)`, `confirmEdit(id, newText)`, `cancelEdit(id)`
    - `startEdit(id)` replaces the text `<span>` with an `<input>` pre-filled with the current text
    - `cancelEdit(id)` restores the original `<span>` display without modifying the task
    - `confirmEdit(id, newText)`: validate non-empty/non-whitespace; validate max 200 chars; check `isDuplicate(normalize(newText), id)` to exclude self; on success update `task.text`, call `persist()` and `render()`; on failure show inline Bahasa Indonesia error and keep the edit field open
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.4, 3.5_

  - [ ]* 6.8 Write property test for edit-self allowed (duplicate excludes self)
    - **Property 6: Edit duplicate check excludes self**
    - **Validates: Requirements 3.4, 3.5**
    - `// Feature: todo-life-dashboard, Property 6: Edit duplicate check excludes self`
    - For any task `T` in the list, assert `confirmEdit(T.id, T.text)` succeeds and leaves `T.text` unchanged
    - _Requirements: 3.4, 3.5_

  - [ ]* 6.9 Write property test for task persistence round-trip
    - **Property 9: Task persistence round-trip**
    - **Validates: Requirements 2.11, 8.1**
    - `// Feature: todo-life-dashboard, Property 9: Task persistence round-trip`
    - Use `fc.array(taskArb)`; after `persist()`, assert `StorageManager.load("tld_tasks")` deep-equals `TaskList.tasks`
    - _Requirements: 2.11, 8.1_

  - [ ]* 6.10 Write unit tests for TaskList
    - Test: add valid task → length increases by 1
    - Test: add empty string → rejected with Bahasa Indonesia message
    - Test: add duplicate (case/whitespace variants) → rejected
    - Test: toggle complete → `completed` flips, strikethrough applied/removed
    - Test: delete → task removed from array and `persist()` called
    - Test: edit to duplicate of another task → rejected, edit field preserved
    - Test: edit to own text → accepted
    - Test: cancel edit → original text restored
    - _Requirements: 2.1–2.11, 3.1–3.5_

- [x] 7. Checkpoint — task module complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement PomodoroTimer
  - [x] 8.1 Implement `PomodoroTimer` with `init()`, `start()`, `pause()`, `reset()`, `tick()`, `complete()`, `render()`, and `formatTime(seconds)` methods
    - `init()` sets `remaining = 1500`, `state = "idle"`, calls `render()`
    - `start()` ignores call when `state === "running"` (Requirement 4.10); records absolute end timestamp as `Date.now() + remaining * 1000`; starts `setInterval` calling `tick()` every 1 second; sets `state = "running"`; calls `render()`
    - `tick()` derives `remaining` from `endTimestamp - Date.now()` (avoids drift); if `remaining <= 0` calls `complete()`; else calls `render()`
    - `pause()` calls `clearInterval`; sets `state = "paused"`; calls `render()`
    - `reset()` calls `clearInterval`; sets `remaining = 1500`, `state = "idle"`; calls `render()`
    - `complete()` calls `clearInterval`; sets `state = "idle"`; displays inline Bahasa Indonesia completion notification visible for at least 5 seconds; calls `render()`
    - `render()` updates MM:SS display; shows Pause button and hides Start when `state === "running"`; shows Start and hides Pause otherwise
    - `formatTime(seconds)` returns `"MM:SS"` with zero-padding
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 8.2 Write property test for Pomodoro tick monotonic decrement
    - **Property 7: Pomodoro timer tick monotonically decrements**
    - **Validates: Requirements 4.3, 4.7**
    - `// Feature: todo-life-dashboard, Property 7: Pomodoro timer tick monotonically decrements`
    - Use `fc.integer({ min: 1, max: 1500 })` as the starting `remaining`; simulate `n` tick calls; assert `remaining === 0` and `state === "idle"` after `n` calls
    - _Requirements: 4.3, 4.7_

  - [ ]* 8.3 Write property test for Pomodoro reset invariant
    - **Property 8: Pomodoro reset invariant**
    - **Validates: Requirements 4.6**
    - `// Feature: todo-life-dashboard, Property 8: Pomodoro reset invariant`
    - Generate arbitrary `(state, remaining)` combinations; call `reset()`; assert `remaining === 1500` and `state === "idle"`
    - _Requirements: 4.6_

  - [ ]* 8.4 Write unit tests for PomodoroTimer
    - Test: initial state is 1500 / `"idle"`
    - Test: `start()` sets `state` to `"running"`
    - Test: `pause()` sets `state` to `"paused"` and preserves `remaining`
    - Test: `reset()` from running state → 1500 / `"idle"`
    - Test: tick from `remaining = 1` calls `complete()` → `state === "idle"` and notification shown
    - Test: calling `start()` while already running is silently ignored
    - _Requirements: 4.1, 4.3, 4.4, 4.6, 4.7, 4.10_

- [x] 9. Implement QuickLinkManager
  - [x] 9.1 Implement `QuickLinkManager` with `init()`, `render()`, `addLink(label, url)`, `openLink(id)`, `deleteLink(id)`, `normalizeUrl(url)`, and `persist()` methods
    - `init()` loads links from `StorageManager.load("tld_links")`; falls back to `[]`; calls `render()`
    - `render()` rebuilds the quick-links grid; each item shows the label, an open button, and a delete button
    - `addLink(label, url)`: validate non-empty label (≤50 chars) and non-empty URL; show per-field Bahasa Indonesia error messages on failure; reject when `links.length >= 20`; call `normalizeUrl(url)`; create a `QuickLink` object with `crypto.randomUUID()`, trimmed label, and normalized URL; push to `links`; call `persist()`; call `render()`
    - `openLink(id)` calls `window.open(url, "_blank", "noopener,noreferrer")`
    - `deleteLink(id)` removes the link from the array; calls `persist()` and `render()`
    - `normalizeUrl(url)` prepends `"https://"` when the URL does not start with `"http://"` or `"https://"`
    - `persist()` calls `StorageManager.save("tld_links", links)`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 9.2 Write property test for URL normalization
    - **Property 10: QuickLink URL normalization**
    - **Validates: Requirements 5.5**
    - `// Feature: todo-life-dashboard, Property 10: QuickLink URL normalization`
    - Use `fc.string().filter(s => !s.startsWith("http://") && !s.startsWith("https://"))`; assert `normalizeUrl(url)` starts with `"https://"` and the remainder equals the original input
    - _Requirements: 5.5_

  - [ ]* 9.3 Write property test for QuickLink max-limit enforcement
    - **Property 11: QuickLink max-limit enforcement**
    - **Validates: Requirements 5.8**
    - `// Feature: todo-life-dashboard, Property 11: QuickLink max-limit enforcement`
    - Set `links` to exactly 20 entries; call `addLink` with valid arguments; assert `links.length` remains 20 and `StorageManager.save` is not called with a new entry
    - _Requirements: 5.8_

  - [ ]* 9.4 Write unit tests for QuickLinkManager
    - Test: URL without scheme gets `"https://"` prepended
    - Test: URL beginning with `"http://"` is stored unchanged
    - Test: 21st link is rejected when 20 are already stored
    - Test: empty label rejected with Bahasa Indonesia message
    - Test: label exceeding 50 characters rejected with Bahasa Indonesia message
    - Test: empty URL rejected with Bahasa Indonesia message
    - Test: `deleteLink` removes the entry and calls `persist()`
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8_

- [x] 10. Checkpoint — feature modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement App orchestrator and wire all modules
  - [x] 11.1 Implement `App.init()` calling each module's `init()` in the correct order from the design
    - Order: `StorageManager.init()` → `ThemeManager.init()` → `ClockDisplay.init()` → `GreetingDisplay.init()` → `TaskList.init()` → `PomodoroTimer.init()` → `QuickLinkManager.init()`
    - Register `document.addEventListener("DOMContentLoaded", App.init)`
    - _Requirements: 7.3, 8.5_

  - [x] 11.2 Wire remaining cross-module interactions
    - Theme toggle button event → `ThemeManager.toggle()`
    - Name input submit event → `GreetingDisplay.updateName(value)`
    - Task add form submit → `TaskList.addTask(inputValue)`
    - Task item edit/confirm/cancel/delete/toggle events (use event delegation on the task list container)
    - Pomodoro start/pause/reset button events → `PomodoroTimer.start()` / `.pause()` / `.reset()`
    - Quick link add form submit → `QuickLinkManager.addLink(label, url)`
    - Quick link open/delete events (use event delegation on the links grid container)
    - _Requirements: 2.3, 2.4, 2.5, 2.8, 2.9, 4.3, 4.4, 4.6, 5.3, 5.4, 7.2_

- [x] 12. Implement CSS responsive layout and visual design
  - [x] 12.1 Build the complete CSS in `css/style.css`
    - Implement the `[data-theme="light"]` and `[data-theme="dark"]` custom-property blocks with the exact color values from the design
    - Add a CSS reset and base typography: body text ≥16px, H1 ≥24px, H2 ≥20px, H3 ≥16px with distinct style from body
    - Add smooth CSS transitions (150–400ms) for theme switching, task-completion strikethrough, and hover states on buttons, links, and list items
    - Ensure all normal text (< 18px / 14px bold) meets 4.5:1 contrast and large text meets 3:1 contrast in both themes
    - _Requirements: 9.2, 9.3, 9.4, 7.6_

  - [x] 12.2 Implement responsive layout breakpoints
    - Mobile (≥320px): single-column stacked layout, no horizontal scrolling
    - Tablet (≥768px): two-column grid for the main panels
    - Desktop (≥1024px): wider layout with optimized spacing
    - _Requirements: 9.1_

- [x] 13. Checkpoint — full application wired and styled
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Set up test framework and write integration/smoke tests
  - [x] 14.1 Set up Vitest (or Jest) with jsdom and fast-check
    - Create `package.json` with `vitest`, `jsdom`, and `fast-check` as dev dependencies
    - Configure test environment to `jsdom` in `vite.config.js` (or `jest.config.js`)
    - Create `tests/` directory and an initial `tests/setup.js` that stubs `localStorage` and `window.matchMedia`
    - _Requirements: 10.5_

  - [ ]* 14.2 Write smoke/integration tests
    - Test: page initializes with all sections visible (StorageManager, ThemeManager, ClockDisplay, GreetingDisplay, TaskList, PomodoroTimer, QuickLinkManager all rendered)
    - Test: theme toggle updates `data-theme` on `<html>` and persists to LocalStorage
    - Test: adding a task, calling `StorageManager.save`, and then reloading state shows the task (full persistence round-trip via real LocalStorage)
    - Test: Pomodoro UI shows Pause button when `state === "running"` and Start button when `state !== "running"`
    - _Requirements: 7.2, 8.5, 4.8, 4.9_

- [ ] 15. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 7, 10, 13, and 15 provide natural review points
- Property tests use **fast-check** and must run a minimum of 100 iterations each
- Each property test comment must follow the format: `// Feature: todo-life-dashboard, Property N: <description>`
- Unit tests use **Vitest** (preferred) or Jest with jsdom
- `crypto.randomUUID()` is available in all modern browsers; fall back to `Date.now().toString()` for environments that don't support it
- The application must work without a bundler — the test setup is the only place `package.json` / `node_modules` are introduced

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "2.2"] },
    { "id": 2, "tasks": ["4.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "4.2"] },
    { "id": 4, "tasks": ["6.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4", "6.5", "6.6"] },
    { "id": 7, "tasks": ["6.7", "8.1", "9.1"] },
    { "id": 8, "tasks": ["6.8", "6.9", "6.10", "8.2", "8.3", "8.4", "9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["11.1"] },
    { "id": 10, "tasks": ["11.2", "12.1"] },
    { "id": 11, "tasks": ["12.2", "14.1"] },
    { "id": 12, "tasks": ["14.2"] }
  ]
}
```
