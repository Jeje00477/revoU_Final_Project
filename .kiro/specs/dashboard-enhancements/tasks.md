# Implementation Plan: Dashboard Enhancements

## Overview

All new code is appended to `js/app.js` (additive only). New styles go in `css/enhancements.css`. New tests go in `tests/enhancements.test.js`. No existing files are modified.

## Tasks

- [x] 1. Create `css/enhancements.css` with dark-mode and new UI styles
  - Create the file with CSS custom properties for dark-mode colour overrides (background, foreground, widget surfaces)
  - Add styles for the ThemeToggle toolbar button, NameStore input/button/error, TimerConfig input/button/error, and SortControl select element
  - Ensure dark-mode contrast meets 4.5:1 minimum ratio
  - _Requirements: 1.1, 1.4_

- [x] 2. Implement ThemeToggle
  - [x] 2.1 Add `ThemeToggle` object and pure helpers to `js/app.js`
    - Append `applyTheme(isDark)`, `ThemeToggle.init()`, and `ThemeToggle.toggle()` to `js/app.js`
    - `init()` injects the `<link>` tag for `css/enhancements.css` and the toggle button into `<main class="dashboard">`, reads `dashboard_theme` from localStorage, and calls `applyTheme`
    - `toggle()` flips the `dark-mode` class on `<body>`, persists the new value, and updates the button label
    - Button label: `"Dark mode"` when light is active, `"Light mode"` when dark is active
    - Wrap localStorage calls in try/catch; fall back to `"light"` on error or unrecognised value
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8_

  - [x] 2.2 Write property test for ThemeToggle — Property 1: toggle round-trip
    - **Property 1: Theme toggle is a round-trip**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 2.3 Write property test for ThemeToggle — Property 2: persistence
    - **Property 2: Theme toggle persists to localStorage**
    - **Validates: Requirements 1.5**

  - [x] 2.4 Write property test for ThemeToggle — Property 3: button label
    - **Property 3: Theme toggle updates button label**
    - **Validates: Requirements 1.8**

- [x] 3. Implement GreetingWidget name extension (NameStore)
  - [x] 3.1 Add `validateName`, `buildGreeting`, `NameStore`, and `GreetingNameUI` to `js/app.js`
    - Append pure functions `validateName(name)` (rejects empty, whitespace-only, length > 50) and `buildGreeting(base, name)`
    - Append `NameStore` with `save(name)`, `load()`, and `clear()` backed by `dashboard_user_name`
    - Append `GreetingNameUI.init()` which injects an input, Save button, and `<p role="alert">` error element into `#greeting`
    - On save: validate → show error or call `NameStore.save` + `applyName`; on empty submit: call `NameStore.clear` + revert greeting
    - On load: read `NameStore.load()` and call `applyName` if a name exists
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 3.2 Write property test for NameStore — Property 4: validateName accepts/rejects
    - **Property 4: Name validation accepts valid names and rejects invalid ones**
    - **Validates: Requirements 2.2, 2.5, 2.7, 2.8**

  - [x] 3.3 Write property test for NameStore — Property 5: persistence round-trip
    - **Property 5: Name persistence round-trip**
    - **Validates: Requirements 2.3**

- [x] 4. Implement TimerConfig
  - [x] 4.1 Add `validateDuration`, `parseDuration`, and `TimerConfig` to `js/app.js`
    - Append pure functions `validateDuration(value)` (accepts integers in [1, 120] only) and `parseDuration(value)`
    - Append `TimerConfig` with `init()`, `setDuration(minutes)`, and `syncButtonState()`
    - `init()` injects a numeric input, Set button, and `<p role="alert">` error element into `#timer`; reads `dashboard_timer_duration` from localStorage and initialises the timer if valid
    - `setDuration` validates, sets `FocusTimerWidget._state.remaining = minutes * 60` and `_state.running = false`, persists to `dashboard_timer_duration`
    - `syncButtonState()` disables the Set button when `FocusTimerWidget._state.running` is true
    - Hook `syncButtonState` into the existing start/stop/reset calls by appending wrapper calls after `FocusTimerWidget.init()`
    - Wrap localStorage calls in try/catch; ignore invalid stored values and use 1500 s default
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 4.2 Write property test for TimerConfig — Property 6: validateDuration accepts/rejects
    - **Property 6: Duration validation accepts integers in [1, 120] and rejects others**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 4.3 Write property test for TimerConfig — Property 7: setDuration resets timer state
    - **Property 7: Setting a valid duration resets the timer correctly**
    - **Validates: Requirements 3.2**

  - [x] 4.4 Write property test for TimerConfig — Property 8: duration persistence round-trip
    - **Property 8: Duration persistence round-trip**
    - **Validates: Requirements 3.5**

  - [x] 4.5 Write property test for TimerConfig — Property 9: Set button disabled state
    - **Property 9: Set button disabled state mirrors timer running state**
    - **Validates: Requirements 3.8, 3.9**

- [x] 5. Checkpoint — ensure all tests pass so far
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement duplicate task prevention (TodoEnhancements)
  - [x] 6.1 Add `normaliseLabel`, `isDuplicate`, and `TodoEnhancements` to `js/app.js`
    - Append pure functions `normaliseLabel(label)` (trim + lowercase) and `isDuplicate(tasks, label, excludeId?)`
    - Append `TodoEnhancements.init()` which adds a new submit event listener on the todo form that runs the duplicate check before the existing handler persists the task
    - On duplicate: show an inline `<p role="alert">` error and call `event.stopImmediatePropagation()` to prevent the existing handler from adding the task
    - Also intercept edit submissions to apply the duplicate check with `excludeId` set to the task being edited
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 6.2 Write property test for TodoEnhancements — Property 10: duplicate add rejected
    - **Property 10: Duplicate task submission leaves the list unchanged**
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.7**

  - [x] 6.3 Write property test for TodoEnhancements — Property 11: duplicate edit rejected
    - **Property 11: Duplicate edit rejection**
    - **Validates: Requirements 4.6**

- [x] 7. Implement SortControl
  - [x] 7.1 Add `sortTasks` and `SortControl` to `js/app.js`
    - Append pure function `sortTasks(tasks, option)` returning a new sorted array without mutating input; options: `"default"`, `"az"`, `"za"`, `"incomplete-first"`, `"complete-first"`; use a stable comparator
    - Append `SortControl` with `init()`, `sort(tasks, option)`, and `persist(option)`
    - `init()` injects a `<select>` with the five options into `#todo` before `#todo-list`; reads `dashboard_todo_sort` from localStorage and applies it; falls back to `"default"` for absent or unrecognised values
    - Monkey-patch `TodoWidget.render` by saving the original and prepending a `sortTasks` call on `TodoWidget._tasks` before delegating to the original
    - On sort change: call `persist` and re-render the list
    - On new task added: re-render applying the active sort option
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 7.2 Write property test for SortControl — Property 12: no mutation
    - **Property 12: Sort does not mutate the original task array**
    - **Validates: Requirements 5.2**

  - [x] 7.3 Write property test for SortControl — Property 13: set preservation
    - **Property 13: Sort preserves the complete task set**
    - **Validates: Requirements 5.8**

  - [x] 7.4 Write property test for SortControl — Property 14: stability
    - **Property 14: Sort stability — equal-key tasks retain insertion order**
    - **Validates: Requirements 5.7**

  - [x] 7.5 Write property test for SortControl — Property 15: sort option persistence round-trip
    - **Property 15: Sort option persistence round-trip**
    - **Validates: Requirements 5.3**

- [x] 8. Wire all enhancements into the DOMContentLoaded listener
  - Append calls to `ThemeToggle.init()`, `GreetingNameUI.init()`, `TimerConfig.init()`, `TodoEnhancements.init()`, and `SortControl.init()` inside the existing `DOMContentLoaded` listener in `js/app.js`
  - Append the `_exports` shim entries for all new pure functions: `validateName`, `buildGreeting`, `validateDuration`, `parseDuration`, `normaliseLabel`, `isDuplicate`, `sortTasks`
  - _Requirements: 1.6, 2.4, 3.6, 5.4_

- [x] 9. Create `tests/enhancements.test.js` with unit tests
  - Write unit tests covering:
    - `validateName`: boundary values (50-char accepted, 51-char rejected, empty, whitespace-only)
    - `validateDuration`: boundary values (0, 1, 120, 121, non-integer, non-numeric)
    - localStorage absent-key defaults for theme (`"light"`), duration (1500 s), and sort (`"default"`)
    - DOM injection smoke tests: each `init()` call results in the expected elements existing in the document
  - _Requirements: 1.7, 2.5, 2.7, 2.8, 3.3, 3.4, 3.7_

- [x] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All code changes are append-only to `js/app.js`; no existing lines are touched
- Property tests use `fast-check` with `{ numRuns: 100 }` and are tagged with `// Feature: dashboard-enhancements, Property N: ...`
- Each property test task maps 1-to-1 to a correctness property in the design document
