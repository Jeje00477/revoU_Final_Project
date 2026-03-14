# Design Document: Dashboard Enhancements

## Overview

This document describes the technical design for five additive enhancements to the existing Personal Dashboard (`index.html`, `css/style.css`, `js/app.js`).

**Core constraint**: All new code is additive only. No existing functions, DOM elements, event listeners, or CSS rules may be modified or removed. New behaviour is layered on top via new functions, new DOM elements injected at runtime, and new CSS rules appended to a separate stylesheet.

The five enhancements are:

1. Light / Dark mode toggle (`ThemeToggle`)
2. Custom name in greeting (`NameStore` + `GreetingWidget` extension)
3. Configurable Pomodoro duration (`TimerConfig`)
4. Prevent duplicate tasks (`TodoWidget` extension)
5. Sort tasks (`SortControl`)

---

## Architecture

The existing app follows a simple widget-per-concern pattern: each widget is a plain object with `init()`, `render()`, and helper pure functions. All state is held in `localStorage` and in-memory arrays.

The enhancements follow the same pattern:

- **Pure functions** are added to `js/app.js` for all logic (validation, transformation, formatting). These are exported via the existing `_exports` shim so Vitest can import them without a DOM.
- **Widget extension objects** (`ThemeToggle`, `NameStore`, `TimerConfig`, `SortControl`) are added to `js/app.js` and initialised inside the existing `DOMContentLoaded` listener (new calls appended after the existing four).
- **New DOM elements** are injected by each extension's `init()` method into existing widget `<section>` elements, keeping `index.html` unchanged.
- **New CSS** is appended to a new file `css/enhancements.css`, linked from `index.html` via a new `<link>` tag added by `ThemeToggle.init()` at runtime (so `index.html` itself is not modified).

```
index.html  (unchanged)
css/
  style.css          (unchanged)
  enhancements.css   (NEW — dark-mode overrides + new UI styles)
js/
  app.js             (unchanged existing code + new code appended)
tests/
  enhancements.test.js  (NEW — property + unit tests)
```

### Data flow

```
localStorage
  dashboard_theme        ← ThemeToggle
  dashboard_user_name    ← NameStore / GreetingWidget extension
  dashboard_timer_duration ← TimerConfig
  dashboard_todo_sort    ← SortControl
  dashboard_todos        ← existing TodoWidget (unchanged key)
```

---

## Components and Interfaces

### ThemeToggle

Injected into the top of `<main class="dashboard">` as a floating toolbar.

```
ThemeToggle
  .init()          — injects button, reads localStorage, applies stored theme
  .toggle()        — flips dark-mode class on <body>, persists, updates label
  .applyTheme(isDark) — pure DOM side-effect: add/remove class, update label
```

**localStorage key**: `dashboard_theme` — values `"dark"` or `"light"`.

### GreetingWidget extension (NameStore)

Injected into `#greeting` section after the existing elements.

```
NameStore
  .save(name)      — validates, persists to localStorage, returns error|null
  .load()          — reads from localStorage, returns string|null
  .clear()         — removes key from localStorage

GreetingNameUI
  .init()          — injects input + Save button + error element into #greeting
  .applyName(name) — updates #greeting-message text to include name
```

**localStorage key**: `dashboard_user_name`.

Pure function added:

```js
validateName(name)  // returns error string | null
                    // rejects: empty, whitespace-only, length > 50
buildGreeting(greetingBase, name)  // returns "Good morning, Alex" or "Good morning"
```

### TimerConfig

Injected into `#timer` section after the existing controls.

```
TimerConfig
  .init()          — injects input + Set button + error element, reads DurationStore
  .setDuration(minutes) — validates, updates FocusTimerWidget state, persists
  .syncButtonState()    — disables/enables Set button based on timer running state
```

**localStorage key**: `dashboard_timer_duration` — integer string (minutes).

Pure functions added:

```js
validateDuration(value)   // returns error string | null
                          // accepts integers in [1, 120] only
parseDuration(value)      // returns integer | null
```

`TimerConfig` hooks into `FocusTimerWidget` by observing the existing `start`, `stop`, and `reset` methods via wrapper calls appended after `FocusTimerWidget.init()`.

### TodoWidget extension (duplicate prevention)

No new widget object — new pure functions replace the role of `addTask` and `editTask` at the call sites inside `TodoWidget`. Because we cannot modify `TodoWidget`, a new `TodoEnhancements` object wraps it:

```
TodoEnhancements
  .init()          — patches TodoWidget's form submit and edit handlers
                     by adding a new submit listener that runs before persisting

isDuplicate(tasks, label, excludeId?)
  // returns true if any task (excluding excludeId) has the same
  // normalised label (trimmed, lowercased)

normaliseLabel(label)   // trim + lowercase
```

The existing `addTask` and `validateTask` functions are unchanged. The duplicate check is an additional validation layer applied in the new submit listener.

### SortControl

Injected into `#todo` section before `#todo-list`.

```
SortControl
  .init()          — injects <select>, reads localStorage, applies stored sort
  .sort(tasks, option) — returns a new sorted array (does not mutate input)
  .persist(option) — saves to localStorage
```

**localStorage key**: `dashboard_todo_sort` — one of `"default"`, `"az"`, `"za"`, `"incomplete-first"`, `"complete-first"`.

Pure function added:

```js
sortTasks(tasks, option)
  // returns a new array sorted by option
  // options: "default" | "az" | "za" | "incomplete-first" | "complete-first"
  // uses Array.prototype.sort with a stable comparator
  // never mutates the input array
```

`SortControl` hooks into `TodoWidget.render` by wrapping it: after the original render populates `#todo-list`, `SortControl` re-orders the rendered `<li>` elements in the DOM (or, preferably, intercepts the `_tasks` array before render). Because we cannot modify `TodoWidget.render`, `SortControl.init()` monkey-patches `TodoWidget.render` by saving the original and calling `sortTasks` on `TodoWidget._tasks` before delegating to the original render.

---

## Data Models

### Theme

```ts
type Theme = "light" | "dark";
// Stored in localStorage as the string "light" or "dark"
```

### UserName

```ts
type UserName = string;  // 1–50 characters, trimmed
// Stored in localStorage as the raw trimmed string
// Absent key = no custom name
```

### TimerDuration

```ts
type TimerDuration = number;  // integer in [1, 120], unit: minutes
// Stored in localStorage as a decimal integer string, e.g. "25"
// Absent key = use default 25 minutes
```

### SortOption

```ts
type SortOption = "default" | "az" | "za" | "incomplete-first" | "complete-first";
// Stored in localStorage as the string value
// Absent key = "default"
```

### Task (existing, unchanged)

```ts
interface Task {
  id: string;       // Date.now().toString()
  label: string;    // trimmed, non-empty
  done: boolean;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme toggle is a round-trip

*For any* body element state, toggling the theme twice (dark → light → dark or light → dark → light) SHALL return the `dark-mode` class presence to its original value.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Theme toggle persists to localStorage

*For any* toggle action, after calling `ThemeToggle.toggle()`, `localStorage.getItem("dashboard_theme")` SHALL equal `"dark"` if dark-mode is now active, or `"light"` if it is not.

**Validates: Requirements 1.5**

---

### Property 3: Theme toggle updates button label

*For any* toggle state, the ThemeToggle button label SHALL equal `"Light mode"` when dark-mode is active and `"Dark mode"` when dark-mode is inactive.

**Validates: Requirements 1.8**

---

### Property 4: Name validation accepts valid names and rejects invalid ones

*For any* string `s`, `validateName(s)` SHALL return `null` if and only if `s.trim().length` is in `[1, 50]`; it SHALL return a non-null error string for empty strings, whitespace-only strings, and strings whose trimmed length exceeds 50.

**Validates: Requirements 2.2, 2.5, 2.7, 2.8**

---

### Property 5: Name persistence round-trip

*For any* valid name string, saving it via `NameStore.save(name)` and then reading it back via `NameStore.load()` SHALL return the trimmed name.

**Validates: Requirements 2.3**

---

### Property 6: Duration validation accepts integers in [1, 120] and rejects others

*For any* value `v`, `validateDuration(v)` SHALL return `null` if and only if `v` is an integer in the closed interval `[1, 120]`; it SHALL return a non-null error string for values outside this range, non-integer numbers, and non-numeric strings.

**Validates: Requirements 3.3, 3.4**

---

### Property 7: Setting a valid duration resets the timer correctly

*For any* integer `minutes` in `[1, 120]`, after `TimerConfig.setDuration(minutes)`, `FocusTimerWidget._state.remaining` SHALL equal `minutes * 60` and `FocusTimerWidget._state.running` SHALL be `false`.

**Validates: Requirements 3.2**

---

### Property 8: Duration persistence round-trip

*For any* valid duration `minutes`, saving it via `TimerConfig.setDuration(minutes)` and then reading `localStorage.getItem("dashboard_timer_duration")` SHALL return the string representation of `minutes`.

**Validates: Requirements 3.5**

---

### Property 9: Set button disabled state mirrors timer running state

*For any* timer state (running or stopped), the TimerConfig "Set" button's `disabled` attribute SHALL be `true` when `FocusTimerWidget._state.running` is `true`, and `false` otherwise.

**Validates: Requirements 3.8, 3.9**

---

### Property 10: Duplicate task submission leaves the list unchanged

*For any* non-empty task array and any label whose normalised form (trimmed, lowercased) matches an existing task's normalised label, calling the enhanced add handler SHALL leave the task array length unchanged and SHALL not add the task to localStorage.

**Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.7**

---

### Property 11: Duplicate edit rejection

*For any* task array with at least two tasks, editing one task to a label whose normalised form matches another existing task's normalised label SHALL be rejected, leaving the task array unchanged.

**Validates: Requirements 4.6**

---

### Property 12: Sort does not mutate the original task array

*For any* task array and any sort option, `sortTasks(tasks, option)` SHALL return a new array and SHALL NOT modify the input array (reference equality of input elements preserved, input length unchanged).

**Validates: Requirements 5.2**

---

### Property 13: Sort preserves the complete task set

*For any* task array and any sort option, the set of task `id` values in `sortTasks(tasks, option)` SHALL equal the set of task `id` values in the original array (no tasks added or removed).

**Validates: Requirements 5.8**

---

### Property 14: Sort stability — equal-key tasks retain insertion order

*For any* task array where multiple tasks share the same sort key (e.g. same `done` value for completion-based sorts, or same label for alphabetical sorts), `sortTasks(tasks, option)` SHALL preserve their relative order from the input array.

**Validates: Requirements 5.7**

---

### Property 15: Sort option persistence round-trip

*For any* valid sort option string, persisting it via `SortControl.persist(option)` and then reading `localStorage.getItem("dashboard_todo_sort")` SHALL return the same option string.

**Validates: Requirements 5.3**

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `localStorage` unavailable (throws) | All `load()` / `persist()` calls are wrapped in try/catch; failures log a warning and fall back to defaults |
| `dashboard_theme` contains an unrecognised value | `ThemeToggle.init()` treats it as `"light"` (safe default) |
| `dashboard_timer_duration` contains a non-integer or out-of-range value | `TimerConfig` ignores it and uses 1500 s default |
| `dashboard_todo_sort` contains an unrecognised value | `SortControl` falls back to `"default"` |
| `validateName` / `validateDuration` return errors | Inline `<p role="alert">` elements display the message; no state is mutated |
| Duplicate task submission | Inline error shown; task not added; localStorage not updated |
| DOM elements missing at `init()` time | Each `init()` logs a `console.error` and returns early (matches existing pattern) |

---

## Testing Strategy

### Framework and libraries

- **Test runner**: Vitest (already in use)
- **Property-based testing**: `fast-check` (already in use — see `tests/todo.test.js`)
- All new tests go in `tests/enhancements.test.js`

### Dual testing approach

**Unit tests** cover:
- Specific examples (e.g. `validateName("Alice")` returns null)
- Edge cases (e.g. name of exactly 50 chars accepted, 51 chars rejected)
- DOM-dependent behaviour via `jsdom` (Vitest's default environment)
- `localStorage` fallback when the API throws

**Property-based tests** cover all 15 correctness properties above, each run with a minimum of 100 iterations (`{ numRuns: 100 }`).

### Property test tagging

Each property test is tagged with a comment in the format:

```
// Feature: dashboard-enhancements, Property N: <property text>
```

### Test file structure

```
tests/enhancements.test.js
  ├── ThemeToggle pure logic
  │     ├── [P1] toggle round-trip
  │     ├── [P2] persistence
  │     └── [P3] button label
  ├── Name validation
  │     ├── [P4] validateName accepts/rejects
  │     └── [P5] NameStore round-trip
  ├── Duration validation
  │     ├── [P6] validateDuration accepts/rejects
  │     ├── [P7] setDuration resets timer state
  │     ├── [P8] duration persistence round-trip
  │     └── [P9] Set button disabled state
  ├── Duplicate prevention
  │     ├── [P10] duplicate add rejected
  │     └── [P11] duplicate edit rejected
  └── Sort
        ├── [P12] no mutation
        ├── [P13] set preservation
        ├── [P14] stability
        └── [P15] sort option persistence
```

### Unit test balance

Property tests handle broad input coverage. Unit tests are kept minimal and focus on:
- The two boundary values for name length (50 and 51 characters)
- The boundary values for duration (0, 1, 120, 121)
- The `localStorage` absent-key defaults (theme, duration, sort)
- DOM injection smoke tests (elements exist after `init()`)
