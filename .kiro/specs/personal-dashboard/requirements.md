# Requirements Document

## Introduction

A personal dashboard web app built with vanilla HTML, CSS, and JavaScript. It runs entirely in the browser with no backend, using Local Storage for persistence. The dashboard provides four core widgets: a greeting with current time and date, a focus timer, a to-do list, and a quick links panel. It is deployable to GitHub Pages and usable as a standalone web app or browser extension.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI component that counts down from 25 minutes and provides Start, Stop, and Reset controls.
- **Todo_List**: The UI component that manages a list of user tasks with add, edit, complete, and delete operations.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons that open URLs in the browser.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Task**: A single to-do item with a text label and a completion state.
- **Link**: A user-defined entry consisting of a label and a URL stored in Quick_Links.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I have an immediate sense of the time of day.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, July 14, 2025").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the message "Good morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the message "Good afternoon".
5. WHEN the local time is between 18:00 and 21:59, THE Greeting_Widget SHALL display the message "Good evening".
6. WHEN the local time is between 22:00 and 04:59, THE Greeting_Widget SHALL display the message "Good night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes (1500 seconds).
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down one second per second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second in MM:SS format.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual indicator that the session has ended.
7. IF the user activates the Start control while the Focus_Timer is already counting down, THEN THE Focus_Timer SHALL ignore the activation.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks in a to-do list that persists across sessions, so that I can track my work without losing data on page reload.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task label, THE Todo_List SHALL add a new Task with that label and an incomplete state.
2. IF the user submits an empty or whitespace-only task label, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
3. WHEN the user activates the edit control for a Task, THE Todo_List SHALL allow the user to modify the Task label and save the updated label on confirmation.
4. WHEN the user activates the complete control for a Task, THE Todo_List SHALL toggle the Task's completion state and apply a visual distinction to completed Tasks.
5. WHEN the user activates the delete control for a Task, THE Todo_List SHALL remove the Task from the list permanently.
6. WHEN any Task is added, edited, completed, or deleted, THE Todo_List SHALL persist the full task list to Local_Storage.
7. WHEN the Dashboard loads, THE Todo_List SHALL read the task list from Local_Storage and render all previously saved Tasks.
8. IF Local_Storage contains no task data, THEN THE Todo_List SHALL render an empty list with no errors.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and manage shortcut buttons for my favourite websites, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. WHEN the user submits a valid label and URL, THE Quick_Links SHALL add a new Link and display it as a clickable button.
2. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL reject the submission and display an inline validation message.
3. IF the user submits an empty label or empty URL, THEN THE Quick_Links SHALL reject the submission and display an inline validation message.
4. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
5. WHEN the user activates the delete control for a Link, THE Quick_Links SHALL remove the Link from the panel permanently.
6. WHEN any Link is added or deleted, THE Quick_Links SHALL persist the full link list to Local_Storage.
7. WHEN the Dashboard loads, THE Quick_Links SHALL read the link list from Local_Storage and render all previously saved Links.
8. IF Local_Storage contains no link data, THEN THE Quick_Links SHALL render an empty panel with no errors.

---

### Requirement 5: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organised dashboard, so that I can use it comfortably without distraction.

#### Acceptance Criteria

1. THE Dashboard SHALL arrange all four widgets in a single-page layout with clear visual separation between widgets.
2. THE Dashboard SHALL apply consistent typography with a readable font size of at least 14px for body text.
3. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all styling.
4. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all behaviour.
5. WHILE the viewport width is 768px or wider, THE Dashboard SHALL display widgets in a multi-column grid layout.
6. WHILE the viewport width is below 768px, THE Dashboard SHALL display widgets in a single-column stacked layout.

---

### Requirement 6: Browser Compatibility and Deployment

**User Story:** As a user, I want the dashboard to work reliably across modern browsers and be deployable to GitHub Pages, so that I can access it anywhere.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari without polyfills or transpilation.
2. THE Dashboard SHALL consist only of static files (HTML, CSS, JavaScript) with no server-side dependencies, making it deployable to GitHub Pages.
3. THE Dashboard SHALL load and render all widgets within 2 seconds on a standard broadband connection.
4. WHERE the Dashboard is installed as a browser extension, THE Dashboard SHALL operate using the same static files without modification.
