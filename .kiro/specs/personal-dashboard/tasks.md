# Implementation Plan: Personal Dashboard

## Overview

Implement a vanilla HTML/CSS/JS personal dashboard as static files with no build step. Four widgets (Greeting, Focus Timer, To-Do, Quick Links) are wired together in a single `js/app.js` file. Pure logic functions are extracted so they can be tested in Node via Vitest and fast-check.

## Tasks

- [x] 1. Scaffold static file structure and HTML skeleton
  - Create `index.html` with semantic markup: four widget sections (`#greeting`, `#timer`, `#todo`, `#links`)
  - Create `css/style.css` with base reset, typography (min 14px body), and widget card styles
  - Create `js/app.js` with a `DOMContentLoaded` listener and four empty widget stubs
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Implement GreetingWidget
  - [x] 2.1 Extract and implement pure functions: `getGreeting(h)`, `formatTime(date)`, `formatDate(date)`
    - `getGreeting` maps hour 0–23 to one of the four greeting strings
    - `formatTime` returns `HH:MM` zero-padded string
    - `formatDate` returns full weekday, month name, numeric day, and four-digit year
    - Export functions for Node-testable import
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 2.2 Implement `GreetingWidget.init()` and `render()`
    - `init()` calls `render()` then starts a 60-second `setInterval`
    - `render()` writes to `#greeting-time`, `#greeting-date`, `#greeting-message`
    - _Requirements: 1.1, 1.2_
  - [x] 2.3 Write property tests for greeting pure functions (Properties 1–3)
    - **Property 1: getGreeting covers all hours** — Validates: Requirements 1.3, 1.4, 1.5, 1.6
    - **Property 2: formatTime produces HH:MM** — Validates: Requirements 1.1
    - **Property 3: formatDate contains required components** — Validates: Requirements 1.2
    - Place in `tests/greeting.test.js`, minimum 100 runs each

- [x] 3. Implement FocusTimerWidget
  - [x] 3.1 Extract and implement pure functions: `formatTimer(seconds)`, and a state-machine object `createTimerState()`
    - `formatTimer` returns `MM:SS` zero-padded string for any integer in [0, 1500]
    - `createTimerState()` returns `{ remaining, running }` with `start()`, `stop()`, `reset()`, `tick()` methods that operate on plain state (no DOM, no intervals)
    - Export both for Node-testable import
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 3.2 Implement `FocusTimerWidget.init()`, `start()`, `stop()`, `reset()`, `tick()`, `render()`
    - `init()` binds Start/Stop/Reset buttons to widget methods
    - `start()` guards against double-start (Requirement 2.7)
    - `tick()` calls `render()` and stops at 0, showing `#timer-complete` indicator (Requirement 2.6)
    - `render()` updates `#timer-display`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 3.3 Write property tests for timer pure functions (Properties 4–8)
    - **Property 4: tick decrements remaining by 1** — Validates: Requirements 2.2
    - **Property 5: formatTimer produces MM:SS** — Validates: Requirements 2.3
    - **Property 6: stop retains remaining** — Validates: Requirements 2.4
    - **Property 7: reset restores to 1500** — Validates: Requirements 2.5
    - **Property 8: start is idempotent** — Validates: Requirements 2.7
    - Place in `tests/timer.test.js`, minimum 100 runs each
  - [x] 3.4 Write unit tests for timer edge cases
    - Test countdown reaching exactly 00:00 and auto-stopping (Requirement 2.6)
    - _Requirements: 2.6_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement TodoWidget
  - [x] 5.1 Extract and implement pure functions: `validateTask(label)`, `createTask(label)`, and array mutators `addTask`, `editTask`, `toggleTask`, `deleteTask`
    - All mutators take a task array and return a new array (no side effects)
    - `validateTask` returns an error string or `null`
    - `createTask` produces `{ id, label, done: false }`
    - Export all for Node-testable import
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 5.2 Implement `TodoWidget.init()`, `load()`, `persist()`, and `render()`
    - `load()` reads `"dashboard_todos"` from `localStorage` with try/catch; falls back to `[]` on error or missing key
    - `persist()` writes current array to `"dashboard_todos"` with try/catch
    - `render()` rebuilds `#todo-list` DOM; shows inline validation message on error
    - `init()` loads, renders, and binds the add-form submit handler
    - _Requirements: 3.6, 3.7, 3.8_
  - [x] 5.3 Write property tests for todo pure functions (Properties 9–14)
    - **Property 9: addTask grows list by 1** — Validates: Requirements 3.1
    - **Property 10: whitespace/empty labels rejected** — Validates: Requirements 3.2
    - **Property 11: editTask updates label only** — Validates: Requirements 3.3
    - **Property 12: toggleTask is its own inverse** — Validates: Requirements 3.4
    - **Property 13: deleteTask removes the task** — Validates: Requirements 3.5
    - **Property 14: todo persistence round-trip** — Validates: Requirements 3.6, 3.7, 3.8
    - Place in `tests/todo.test.js`, minimum 100 runs each
  - [x] 5.4 Write unit tests for todo edge cases
    - Test `load()` with `localStorage` unavailable (graceful degradation)
    - Test `load()` with corrupt JSON in storage (falls back to `[]`)
    - Test `init()` with no stored data renders empty list without errors (Requirement 3.8)
    - _Requirements: 3.7, 3.8_

- [x] 6. Implement QuickLinksWidget
  - [x] 6.1 Extract and implement pure functions: `validateLink(label, url)`, `createLink(label, url)`, and array mutators `addLink`, `deleteLink`
    - `validateLink` rejects empty/whitespace label, empty/whitespace URL, or URL not starting with `http://` or `https://`
    - `createLink` produces `{ id, label, url }`
    - Export all for Node-testable import
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [x] 6.2 Implement `QuickLinksWidget.init()`, `load()`, `persist()`, and `render()`
    - `load()` reads `"dashboard_links"` from `localStorage` with try/catch; falls back to `[]`
    - `persist()` writes current array to `"dashboard_links"` with try/catch
    - `render()` rebuilds `#links-panel` DOM; link buttons open URL in new tab via `window.open` (Requirement 4.4); shows inline validation on error
    - `init()` loads, renders, and binds the add-form submit handler
    - _Requirements: 4.4, 4.6, 4.7, 4.8_
  - [x] 6.3 Write property tests for quick links pure functions (Properties 15–18)
    - **Property 15: addLink grows list by 1** — Validates: Requirements 4.1
    - **Property 16: validateLink rejects invalid input** — Validates: Requirements 4.2, 4.3
    - **Property 17: deleteLink removes the link** — Validates: Requirements 4.5
    - **Property 18: links persistence round-trip** — Validates: Requirements 4.6, 4.7, 4.8
    - Place in `tests/quicklinks.test.js`, minimum 100 runs each
  - [x] 6.4 Write unit tests for quick links edge cases
    - Test link button opens URL in new tab via mocked `window.open` (Requirement 4.4)
    - Test `load()` with `localStorage` unavailable (graceful degradation)
    - Test `load()` with corrupt JSON in storage (falls back to `[]`)
    - Test `init()` with no stored data renders empty panel without errors (Requirement 4.8)
    - _Requirements: 4.4, 4.7, 4.8_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement responsive layout and visual polish
  - Add CSS Grid layout in `css/style.css`: multi-column at `>=768px`, single-column below (Requirement 5.5, 5.6)
  - Add visual distinction for completed tasks (e.g., strikethrough + muted colour) (Requirement 3.4)
  - Add `#timer-complete` indicator style (Requirement 2.6)
  - Verify body font size is at least 14px and widget cards have clear visual separation (Requirement 5.1, 5.2)
  - _Requirements: 3.4, 2.6, 5.1, 5.2, 5.5, 5.6_

- [x] 9. Wire all widgets and add error handling
  - [x] 9.1 Wire `DOMContentLoaded` to call `init()` on all four widgets in order
    - `GreetingWidget.init()` → `FocusTimerWidget.init()` → `TodoWidget.init()` → `QuickLinksWidget.init()`
    - Each `init()` guards against missing DOM nodes with `console.error` and early return
    - _Requirements: 6.1, 6.2_
  - [x] 9.2 Verify `localStorage` error handling paths are wired in both `TodoWidget` and `QuickLinksWidget`
    - Confirm try/catch wraps all reads and writes
    - Confirm corrupt-data path logs `console.warn` and falls back to `[]`
    - _Requirements: 3.6, 3.7, 3.8, 4.6, 4.7, 4.8_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Pure logic functions must be exported/importable in Node without a DOM (required for Vitest + fast-check)
- Property tests use fast-check with a minimum of 100 runs; unit tests use Vitest
- Test files live in `tests/` alongside the source files
