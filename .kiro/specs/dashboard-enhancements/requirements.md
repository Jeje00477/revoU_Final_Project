# Requirements Document

## Introduction

This document describes five enhancements to the existing Personal Dashboard web app
(`index.html`, `css/style.css`, `js/app.js`). All new code must be additive only —
no existing code may be modified or removed.

The enhancements are:
1. Light / Dark mode toggle
2. Custom name in greeting
3. Configurable Pomodoro (Focus Timer) duration
4. Prevent duplicate tasks in the To-Do list
5. Sort tasks in the To-Do list

## Glossary

- **Dashboard**: The existing single-page personal dashboard application.
- **ThemeToggle**: The new UI control and logic responsible for switching between light and dark colour schemes.
- **GreetingWidget**: The existing widget that displays a time-based greeting, clock, and date.
- **NameStore**: The localStorage key (`dashboard_user_name`) used to persist the user's custom name.
- **FocusTimerWidget**: The existing Pomodoro-style countdown timer widget.
- **TimerConfig**: The new UI control and logic that allows the user to set a custom Pomodoro duration.
- **DurationStore**: The localStorage key (`dashboard_timer_duration`) used to persist the custom duration.
- **TodoWidget**: The existing to-do list widget.
- **SortControl**: The new UI control that allows the user to choose a sort order for tasks.
- **dark-mode**: A CSS class applied to `<body>` that activates the dark colour scheme.

---

## Requirements

### Requirement 1: Light / Dark Mode Toggle

**User Story:** As a user, I want to toggle between light and dark mode, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE ThemeToggle SHALL render a toggle button in the Dashboard that is visible at all times.
2. WHEN the user activates the ThemeToggle, THE Dashboard SHALL apply the `dark-mode` class to the `<body>` element.
3. WHEN the user activates the ThemeToggle a second time, THE Dashboard SHALL remove the `dark-mode` class from the `<body>` element.
4. WHILE `dark-mode` is active, THE Dashboard SHALL display all widgets with a dark background colour and light foreground text that meets a minimum contrast ratio of 4.5:1.
5. WHEN the user activates the ThemeToggle, THE Dashboard SHALL persist the selected theme to `localStorage` under the key `dashboard_theme`.
6. WHEN the Dashboard loads, THE Dashboard SHALL read `dashboard_theme` from `localStorage` and apply the stored theme before the first paint.
7. IF `dashboard_theme` is absent from `localStorage`, THE Dashboard SHALL default to light mode.
8. WHEN the ThemeToggle is activated, THE ThemeToggle button label SHALL update to reflect the current mode (e.g. "Dark mode" when light is active, "Light mode" when dark is active).

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting message is personalised to me.

#### Acceptance Criteria

1. THE GreetingWidget SHALL render an input field and a "Save" button that allow the user to enter and save a custom name.
2. WHEN the user submits a non-empty name, THE GreetingWidget SHALL prepend the name to the greeting message (e.g. "Good morning, Alex").
3. WHEN the user submits a non-empty name, THE GreetingWidget SHALL persist the name to `localStorage` under the key `dashboard_user_name` (NameStore).
4. WHEN the Dashboard loads, THE GreetingWidget SHALL read the name from NameStore and display it in the greeting message if a name is stored.
5. IF the user submits an empty or whitespace-only name, THE GreetingWidget SHALL display an inline validation error and SHALL NOT update the stored name.
6. WHEN the user clears a previously saved name and submits, THE GreetingWidget SHALL remove the name from NameStore and revert the greeting to the time-based greeting without a name.
7. THE GreetingWidget SHALL accept names up to 50 characters in length.
8. IF the submitted name exceeds 50 characters, THE GreetingWidget SHALL display an inline validation error and SHALL NOT persist the name.

---

### Requirement 3: Configurable Pomodoro Duration

**User Story:** As a user, I want to set a custom Pomodoro duration, so that I can adapt the focus timer to my preferred work intervals.

#### Acceptance Criteria

1. THE TimerConfig SHALL render a numeric input field and a "Set" button inside the Focus Timer widget that allow the user to enter a duration in minutes.
2. WHEN the user submits a valid duration, THE FocusTimerWidget SHALL reset the timer to the new duration without starting it.
3. THE TimerConfig SHALL accept integer values between 1 and 120 (inclusive) as valid durations.
4. IF the user submits a value outside the range 1–120 or a non-integer value, THE TimerConfig SHALL display an inline validation error and SHALL NOT update the timer.
5. WHEN the user submits a valid duration, THE TimerConfig SHALL persist the value (in minutes) to `localStorage` under the key `dashboard_timer_duration` (DurationStore).
6. WHEN the Dashboard loads, THE FocusTimerWidget SHALL read the duration from DurationStore and initialise the timer to that duration if a value is stored.
7. IF DurationStore is absent, THE FocusTimerWidget SHALL initialise the timer to 25 minutes (1500 seconds), preserving the existing default behaviour.
8. WHILE the timer is running, THE TimerConfig SHALL disable the "Set" button to prevent mid-session changes.
9. WHEN the timer is stopped or reset, THE TimerConfig SHALL re-enable the "Set" button.

---

### Requirement 4: Prevent Duplicate Tasks

**User Story:** As a user, I want the to-do list to reject duplicate task labels, so that my task list stays clean and unambiguous.

#### Acceptance Criteria

1. WHEN the user submits a new task whose label (case-insensitive, trimmed) matches an existing task label, THE TodoWidget SHALL reject the submission.
2. WHEN a duplicate task is rejected, THE TodoWidget SHALL display an inline error message that identifies the submission as a duplicate.
3. WHEN a duplicate task is rejected, THE TodoWidget SHALL NOT add the task to the task list or to `localStorage`.
4. THE duplicate check SHALL be case-insensitive (e.g. "Buy milk" and "buy milk" are considered duplicates).
5. THE duplicate check SHALL ignore leading and trailing whitespace before comparison.
6. WHEN the user edits an existing task to a label that matches another existing task (case-insensitive, trimmed), THE TodoWidget SHALL reject the edit and display an inline error.
7. FOR ALL task lists, adding a task with a label that already exists SHALL leave the task count unchanged (idempotence of duplicate prevention).

---

### Requirement 5: Sort Tasks

**User Story:** As a user, I want to sort my to-do list, so that I can view tasks in a meaningful order.

#### Acceptance Criteria

1. THE SortControl SHALL render a sort selector (e.g. a `<select>` element) inside the To-Do widget with the following options: "Default" (insertion order), "A → Z" (alphabetical ascending), "Z → A" (alphabetical descending), "Incomplete first", "Complete first".
2. WHEN the user selects a sort option, THE TodoWidget SHALL re-render the task list in the chosen order without modifying the underlying task array or `localStorage` data.
3. THE SortControl SHALL persist the selected sort option to `localStorage` under the key `dashboard_todo_sort`.
4. WHEN the Dashboard loads, THE SortControl SHALL read the sort option from `localStorage` and apply it to the initial render.
5. IF `dashboard_todo_sort` is absent from `localStorage`, THE SortControl SHALL default to "Default" (insertion order).
6. WHEN a new task is added, THE TodoWidget SHALL re-render the list applying the currently active sort option.
7. FOR ALL sort options, the sort operation SHALL be stable — tasks with equal sort keys SHALL retain their relative insertion order.
8. FOR ALL task arrays, sorting then reversing the sort SHALL produce the same set of tasks (no tasks are lost or duplicated by sorting).
