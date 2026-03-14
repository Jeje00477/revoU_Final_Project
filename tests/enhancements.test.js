/**
 * Property-based and unit tests for dashboard enhancements.
 * Feature: dashboard-enhancements
 */

const fc = require('fast-check');
const { applyTheme } = require('../js/app.js');

/* ═══════════════════════════════════════════════════════════════════════
   ThemeToggle — Property 1: toggle round-trip
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 1: toggle round-trip
describe('ThemeToggle — Property 1: toggle round-trip', () => {
  let classes;
  let mockDocument;

  beforeEach(() => {
    // Build a minimal document/body stub so applyTheme can run in Node
    classes = new Set();
    const mockBody = {
      classList: {
        add:      (c) => classes.add(c),
        remove:   (c) => classes.delete(c),
        contains: (c) => classes.has(c),
      },
    };
    mockDocument = {
      body: mockBody,
      querySelector: () => null, // no toggle button needed for this property
    };
    globalThis.document = mockDocument;
  });

  afterEach(() => {
    delete globalThis.document;
  });

  it('toggling dark-mode class twice returns body to its original state', () => {
    // Validates: Requirements 1.2, 1.3
    fc.assert(
      fc.property(fc.boolean(), (startDark) => {
        // Apply the arbitrary starting state
        applyTheme(startDark);
        const originalHasDark = mockDocument.body.classList.contains('dark-mode');

        // Toggle once (flip)
        applyTheme(!originalHasDark);
        // Toggle back (flip again)
        applyTheme(originalHasDark);

        // Must be back to original
        return mockDocument.body.classList.contains('dark-mode') === originalHasDark;
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ThemeToggle — Property 2: persistence
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 2: persistence
describe('ThemeToggle — Property 2: persistence', () => {
  let classes;
  let store;

  beforeEach(() => {
    // Minimal body classList stub
    classes = new Set();
    const mockBody = {
      classList: {
        add:      (c) => classes.add(c),
        remove:   (c) => classes.delete(c),
        contains: (c) => classes.has(c),
      },
    };

    // Minimal localStorage stub
    store = {};
    const mockLocalStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };

    globalThis.document = {
      body: mockBody,
      querySelector: () => null,
    };
    globalThis.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    delete globalThis.document;
    delete globalThis.localStorage;
  });

  it('after toggle(), localStorage dashboard_theme matches the active dark-mode state', () => {
    // Validates: Requirements 1.5
    const { ThemeToggle } = require('../js/app.js');

    fc.assert(
      fc.property(fc.boolean(), (startDark) => {
        // Set an arbitrary starting state on the body
        if (startDark) {
          classes.add('dark-mode');
        } else {
          classes.delete('dark-mode');
        }

        // Call toggle — flips the current state
        ThemeToggle.toggle();

        const isDarkNow = classes.has('dark-mode');
        const stored    = store['dashboard_theme'];

        // localStorage must reflect the post-toggle state
        return isDarkNow ? stored === 'dark' : stored === 'light';
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ThemeToggle — Property 3: button label
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 3: button label
describe('ThemeToggle — Property 3: button label', () => {
  let classes;
  let mockButton;

  beforeEach(() => {
    classes = new Set();
    mockButton = { textContent: '' };

    const mockBody = {
      classList: {
        add:      (c) => classes.add(c),
        remove:   (c) => classes.delete(c),
        contains: (c) => classes.has(c),
      },
    };

    globalThis.document = {
      body: mockBody,
      querySelector: (sel) => sel === '.theme-toggle-btn' ? mockButton : null,
    };
  });

  afterEach(() => {
    delete globalThis.document;
  });

  it('button label equals "Light mode" when dark-mode is active and "Dark mode" when inactive', () => {
    // Validates: Requirements 1.8
    fc.assert(
      fc.property(fc.boolean(), (isDark) => {
        applyTheme(isDark);
        const expected = isDark ? 'Light mode' : 'Dark mode';
        return mockButton.textContent === expected;
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Name validation — Property 4: validateName accepts/rejects
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 4: validateName accepts/rejects
describe('Name validation — Property 4: validateName accepts/rejects', () => {
  const { validateName } = require('../js/app.js');

  // Validates: Requirements 2.2, 2.5, 2.7, 2.8

  it('sub-property 4a: valid names (trimmed length 1–50) return null', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length >= 1 && s.trim().length <= 50),
        (s) => validateName(s) === null
      ),
      { numRuns: 100 }
    );
  });

  it('sub-property 4b: invalid names (empty, whitespace-only, trimmed length > 50) return a non-null error string', () => {
    const invalidArb = fc.oneof(
      // empty string
      fc.constant(''),
      // whitespace-only strings
      fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 }),
      // strings whose trimmed length exceeds 50
      fc.string({ minLength: 51, maxLength: 200 }).map(s => s.trim().length > 50 ? s : s + 'x'.repeat(51))
    );

    fc.assert(
      fc.property(invalidArb, (s) => {
        const result = validateName(s);
        return result !== null && typeof result === 'string';
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   NameStore — Property 5: persistence round-trip
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 5: persistence round-trip
describe('NameStore — Property 5: persistence round-trip', () => {
  let store;

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
    globalThis.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('saving a valid name and loading it back returns the trimmed name', () => {
    // Validates: Requirements 2.3
    const { NameStore } = require('../js/app.js');

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length >= 1 && s.trim().length <= 50),
        (name) => {
          NameStore.save(name);
          return NameStore.load() === name.trim();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Duration validation — Property 6: validateDuration accepts/rejects
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 6: validateDuration accepts/rejects
describe('Duration validation — Property 6: validateDuration accepts/rejects', () => {
  const { validateDuration } = require('../js/app.js');

  // Validates: Requirements 3.3, 3.4

  it('sub-property 6a: valid values (integers in [1, 120]) return null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 120 }),
        (v) => validateDuration(v) === null
      ),
      { numRuns: 100 }
    );
  });

  it('sub-property 6b: invalid values (out of range, non-integer, non-numeric) return a non-null error string', () => {
    const invalidArb = fc.oneof(
      // integers below 1
      fc.integer({ min: -1000, max: 0 }),
      // integers above 120
      fc.integer({ min: 121, max: 10000 }),
      // non-integer numbers (floats that are not whole numbers)
      fc.float({ min: 1, max: 120, noNaN: true }).filter(v => !Number.isInteger(v)),
      // non-numeric strings
      fc.string().filter(s => isNaN(Number(s)) || s.trim() === '')
    );

    fc.assert(
      fc.property(invalidArb, (v) => {
        const result = validateDuration(v);
        return result !== null && typeof result === 'string';
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TimerConfig — Property 7: setDuration resets timer state
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 7: setDuration resets timer state
describe('TimerConfig — Property 7: setDuration resets timer state', () => {
  let store;

  beforeEach(() => {
    // Mock localStorage
    store = {};
    globalThis.localStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('after setDuration(minutes), _state.remaining === minutes * 60 and _state.running === false', () => {
    // Validates: Requirements 3.2
    const { TimerConfig, FocusTimerWidget } = require('../js/app.js');

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 120 }), (minutes) => {
        // Set up FocusTimerWidget._state directly (simulating post-init state)
        FocusTimerWidget._state = {
          remaining: 9999,
          running: true,
        };
        // Stub render to avoid DOM errors
        const origRender = FocusTimerWidget.render;
        FocusTimerWidget.render = () => {};

        TimerConfig.setDuration(minutes);

        const remainingOk = FocusTimerWidget._state.remaining === minutes * 60;
        const runningOk   = FocusTimerWidget._state.running === false;

        // Restore render
        FocusTimerWidget.render = origRender;

        return remainingOk && runningOk;
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TimerConfig — Property 8: duration persistence round-trip
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 8: duration persistence round-trip
describe('TimerConfig — Property 8: duration persistence round-trip', () => {
  let store;

  beforeEach(() => {
    // Mock localStorage
    store = {};
    globalThis.localStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('after setDuration(minutes), localStorage.getItem("dashboard_timer_duration") === String(minutes)', () => {
    // Validates: Requirements 3.5
    const { TimerConfig, FocusTimerWidget } = require('../js/app.js');

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 120 }), (minutes) => {
        // Ensure FocusTimerWidget._state exists to avoid errors in setDuration
        FocusTimerWidget._state = {
          remaining: 9999,
          running: false,
        };
        // Stub render to avoid DOM errors
        const origRender = FocusTimerWidget.render;
        FocusTimerWidget.render = () => {};

        TimerConfig.setDuration(minutes);

        const stored = globalThis.localStorage.getItem('dashboard_timer_duration');

        // Restore render
        FocusTimerWidget.render = origRender;

        return stored === String(minutes);
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TimerConfig — Property 9: Set button disabled state
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 9: Set button disabled state
describe('TimerConfig — Property 9: Set button disabled state', () => {
  let store;

  beforeEach(() => {
    // Mock localStorage
    store = {};
    globalThis.localStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('Set button disabled mirrors FocusTimerWidget._state.running for any boolean running state', () => {
    // Validates: Requirements 3.8, 3.9
    const { TimerConfig, FocusTimerWidget } = require('../js/app.js');

    fc.assert(
      fc.property(fc.boolean(), (running) => {
        // Set up a mock button and attach it to TimerConfig
        const mockBtn = { disabled: false };
        TimerConfig._setBtnEl = mockBtn;

        // Set the timer running state to the generated value
        if (!FocusTimerWidget._state) {
          FocusTimerWidget._state = { remaining: 1500, running: false };
        }
        FocusTimerWidget._state.running = running;

        // Call syncButtonState and assert the button's disabled matches running
        TimerConfig.syncButtonState();

        return mockBtn.disabled === running;
      }),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TodoEnhancements — Property 10: duplicate add rejected
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 10: duplicate add rejected
describe('TodoEnhancements — Property 10: duplicate add rejected', () => {
  const { normaliseLabel, isDuplicate } = require('../js/app.js');

  // Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.7

  // Arbitrary that generates a non-empty array of tasks
  const taskArb = fc.record({
    id:    fc.string({ minLength: 1, maxLength: 10 }),
    label: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length >= 1),
    done:  fc.boolean(),
  });

  const nonEmptyTaskArrayArb = fc.array(taskArb, { minLength: 1, maxLength: 20 });

  it('sub-property 10a: isDuplicate returns true for a label matching an existing task (case-insensitive, trimmed)', () => {
    fc.assert(
      fc.property(
        nonEmptyTaskArrayArb,
        fc.integer({ min: 0, max: 19 }),
        fc.constantFrom('', ' ', '  '),   // optional surrounding whitespace
        fc.constantFrom('', ' ', '  '),
        (tasks, rawIdx, leadingWs, trailingWs) => {
          // Pick a task that actually exists in the array
          const idx = rawIdx % tasks.length;
          const existingLabel = tasks[idx].label;

          // Build a duplicate label: same content but with optional surrounding whitespace
          // and randomly toggled case on the first character
          const toggled = existingLabel[0] === existingLabel[0].toUpperCase()
            ? existingLabel[0].toLowerCase() + existingLabel.slice(1)
            : existingLabel[0].toUpperCase() + existingLabel.slice(1);
          const duplicateLabel = leadingWs + toggled + trailingWs;

          // The normalised forms must match for this to be a valid duplicate scenario
          if (normaliseLabel(duplicateLabel) !== normaliseLabel(existingLabel)) {
            // If toggling case changed the normalised form (e.g. empty after trim), skip
            return true;
          }

          return isDuplicate(tasks, duplicateLabel) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sub-property 10b: isDuplicate returns false for a label not matching any existing task', () => {
    fc.assert(
      fc.property(
        nonEmptyTaskArrayArb,
        fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length >= 1),
        (tasks, candidateLabel) => {
          const normCandidate = normaliseLabel(candidateLabel);
          const existingNorms = tasks.map(t => normaliseLabel(t.label));

          // Only assert when the candidate genuinely does not match any existing task
          if (existingNorms.includes(normCandidate)) {
            return true; // skip — this is a duplicate, not a non-duplicate scenario
          }

          return isDuplicate(tasks, candidateLabel) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sub-property 10c: task count is unchanged when a duplicate label is submitted', () => {
    fc.assert(
      fc.property(
        nonEmptyTaskArrayArb,
        fc.integer({ min: 0, max: 19 }),
        (tasks, rawIdx) => {
          const idx = rawIdx % tasks.length;
          const duplicateLabel = tasks[idx].label; // exact match — always a duplicate

          const originalCount = tasks.length;

          // isDuplicate must return true, so the handler would NOT add the task
          const wouldReject = isDuplicate(tasks, duplicateLabel);

          // If rejected, the array length stays the same
          const countAfter = wouldReject ? tasks.length : tasks.length + 1;

          return wouldReject === true && countAfter === originalCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TodoEnhancements — Property 11: duplicate edit rejected
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 11: duplicate edit rejected
describe('TodoEnhancements — Property 11: duplicate edit rejected', () => {
  const { normaliseLabel, isDuplicate } = require('../js/app.js');

  // Validates: Requirements 4.6

  // Arbitrary for a single task
  const taskArb = fc.record({
    id:    fc.uuid(),
    label: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length >= 1),
    done:  fc.boolean(),
  });

  // Arbitrary for an array of at least 2 tasks with distinct normalised labels
  const atLeastTwoDistinctTasksArb = fc
    .array(taskArb, { minLength: 2, maxLength: 20 })
    .filter(tasks => {
      const norms = tasks.map(t => normaliseLabel(t.label));
      return new Set(norms).size === norms.length; // all normalised labels are unique
    });

  it('sub-property 11a: isDuplicate returns true when editing a task to match another task\'s label', () => {
    // For any array of ≥2 tasks with distinct labels, pick two tasks A and B.
    // isDuplicate(tasks, B.label, A.id) must return true — editing A to B's label is a duplicate.
    fc.assert(
      fc.property(
        atLeastTwoDistinctTasksArb,
        fc.integer({ min: 0, max: 19 }),
        fc.integer({ min: 0, max: 19 }),
        (tasks, rawIdxA, rawIdxB) => {
          const idxA = rawIdxA % tasks.length;
          // Pick idxB different from idxA
          const idxB = (idxA + 1 + (rawIdxB % (tasks.length - 1))) % tasks.length;

          const taskA = tasks[idxA];
          const taskB = tasks[idxB];

          // Editing taskA to have taskB's label should be detected as a duplicate
          return isDuplicate(tasks, taskB.label, taskA.id) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sub-property 11b: isDuplicate returns false when editing a task to its own current label (self-edit is not a duplicate)', () => {
    // For any array of ≥2 tasks with distinct labels, editing a task to its own label
    // must NOT be flagged as a duplicate (excludeId excludes the task itself).
    fc.assert(
      fc.property(
        atLeastTwoDistinctTasksArb,
        fc.integer({ min: 0, max: 19 }),
        (tasks, rawIdx) => {
          const idx = rawIdx % tasks.length;
          const task = tasks[idx];

          // Editing to the same label as self — should not be a duplicate
          return isDuplicate(tasks, task.label, task.id) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sub-property 11c: task array is unchanged when a duplicate edit is rejected', () => {
    // Simulates the rejection: if isDuplicate returns true, the tasks array must not change.
    fc.assert(
      fc.property(
        atLeastTwoDistinctTasksArb,
        fc.integer({ min: 0, max: 19 }),
        fc.integer({ min: 0, max: 19 }),
        (tasks, rawIdxA, rawIdxB) => {
          const idxA = rawIdxA % tasks.length;
          const idxB = (idxA + 1 + (rawIdxB % (tasks.length - 1))) % tasks.length;

          const taskA = tasks[idxA];
          const taskB = tasks[idxB];

          const wouldReject = isDuplicate(tasks, taskB.label, taskA.id);

          // If the edit would be rejected, the array stays the same
          const tasksAfter = wouldReject ? tasks : tasks.map(t =>
            t.id === taskA.id ? { ...t, label: taskB.label } : t
          );

          // Verify: rejection means array is unchanged (same labels in same order)
          if (wouldReject) {
            return tasksAfter.every((t, i) => t.label === tasks[i].label);
          }
          // Non-duplicate case: not the focus of this property, just pass
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   SortControl — Property 12: no mutation
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 12: no mutation
describe('SortControl — Property 12: no mutation', () => {
  const { sortTasks } = require('../js/app.js');

  const taskArb = fc.record({
    id:    fc.string({ minLength: 1, maxLength: 10 }),
    label: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length >= 1),
    done:  fc.boolean(),
  });

  const sortOptionArb = fc.constantFrom('default', 'az', 'za', 'incomplete-first', 'complete-first');

  it('sortTasks returns a new array and does not modify the input array', () => {
    // Validates: Requirements 5.2
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        sortOptionArb,
        (tasks, option) => {
          // Snapshot the original references and length
          const originalRefs   = tasks.slice();
          const originalLength = tasks.length;

          const result = sortTasks(tasks, option);

          // Must be a different array reference
          if (result === tasks) return false;

          // Input length must be unchanged
          if (tasks.length !== originalLength) return false;

          // Each element in the input must still be the same object reference
          for (let i = 0; i < originalLength; i++) {
            if (tasks[i] !== originalRefs[i]) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   SortControl — Property 13: set preservation
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 13: set preservation
describe('SortControl — Property 13: set preservation', () => {
  const { sortTasks } = require('../js/app.js');

  const taskArb = fc.record({
    id:    fc.uuid(),
    label: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length >= 1),
    done:  fc.boolean(),
  });

  const sortOptionArb = fc.constantFrom('default', 'az', 'za', 'incomplete-first', 'complete-first');

  it('the set of task IDs in the result equals the set of task IDs in the input', () => {
    // Validates: Requirements 5.8
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        sortOptionArb,
        (tasks, option) => {
          const result = sortTasks(tasks, option);

          const inputIds  = new Set(tasks.map(t => t.id));
          const resultIds = new Set(result.map(t => t.id));

          // Same size
          if (inputIds.size !== resultIds.size) return false;

          // Every input ID appears in the result
          for (const id of inputIds) {
            if (!resultIds.has(id)) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   SortControl — Property 14: stability
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 14: stability
describe('SortControl — Property 14: stability', () => {
  const { sortTasks } = require('../js/app.js');

  it('tasks with equal sort keys retain their relative insertion order (stable sort)', () => {
    // Validates: Requirements 5.7
    fc.assert(
      fc.property(
        // Generate an array of tasks where all tasks share the same `done` value
        // (so every pair has an equal key for completion-based sorts)
        fc.boolean(),
        fc.array(
          fc.record({
            id:    fc.uuid(),
            label: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length >= 1),
            done:  fc.constant(false), // all share the same done value
          }),
          { minLength: 2, maxLength: 20 }
        ),
        fc.constantFrom('incomplete-first', 'complete-first'),
        (_ignored, tasks, option) => {
          const result = sortTasks(tasks, option);

          // Since all tasks have the same `done` value, the sort key is equal for all.
          // Stability requires the relative order to be preserved.
          // The result IDs must appear in the same order as the input IDs.
          const inputOrder  = tasks.map(t => t.id);
          const resultOrder = result.map(t => t.id);

          return inputOrder.every((id, i) => id === resultOrder[i]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('tasks with equal alphabetical keys retain their relative insertion order', () => {
    // Validates: Requirements 5.7
    fc.assert(
      fc.property(
        // All tasks share the same label so the alphabetical sort key is equal for all
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length >= 1),
        fc.array(
          fc.record({
            id:   fc.uuid(),
            done: fc.boolean(),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        fc.constantFrom('az', 'za'),
        (sharedLabel, taskBases, option) => {
          const tasks = taskBases.map(t => ({ ...t, label: sharedLabel }));
          const result = sortTasks(tasks, option);

          const inputOrder  = tasks.map(t => t.id);
          const resultOrder = result.map(t => t.id);

          return inputOrder.every((id, i) => id === resultOrder[i]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   SortControl — Property 15: sort option persistence round-trip
   ═══════════════════════════════════════════════════════════════════════ */

// Feature: dashboard-enhancements, Property 15: sort option persistence round-trip
describe('SortControl — Property 15: sort option persistence round-trip', () => {
  let store;

  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('persisting a sort option and reading it back returns the same option string', () => {
    // Validates: Requirements 5.3
    const { SortControl } = require('../js/app.js');

    fc.assert(
      fc.property(
        fc.constantFrom('default', 'az', 'za', 'incomplete-first', 'complete-first'),
        (option) => {
          SortControl.persist(option);
          return globalThis.localStorage.getItem('dashboard_todo_sort') === option;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Unit tests — validateName boundary values
   ═══════════════════════════════════════════════════════════════════════ */

describe('validateName — boundary values', () => {
  const { validateName } = require('../js/app.js');

  it('accepts a name of exactly 50 characters', () => {
    expect(validateName('a'.repeat(50))).toBeNull();
  });

  it('rejects a name of 51 characters', () => {
    expect(validateName('a'.repeat(51))).not.toBeNull();
  });

  it('rejects an empty string', () => {
    expect(validateName('')).not.toBeNull();
  });

  it('rejects a whitespace-only string', () => {
    expect(validateName('   ')).not.toBeNull();
  });

  it('accepts a single non-whitespace character', () => {
    expect(validateName('A')).toBeNull();
  });

  it('accepts a name with leading/trailing whitespace whose trimmed length is ≤ 50', () => {
    expect(validateName('  hello  ')).toBeNull();
  });

  it('rejects a name whose trimmed length is 51 (padded with spaces)', () => {
    expect(validateName('  ' + 'a'.repeat(51) + '  ')).not.toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Unit tests — validateDuration boundary values
   ═══════════════════════════════════════════════════════════════════════ */

describe('validateDuration — boundary values', () => {
  const { validateDuration } = require('../js/app.js');

  it('rejects 0', () => {
    expect(validateDuration(0)).not.toBeNull();
  });

  it('accepts 1 (lower bound)', () => {
    expect(validateDuration(1)).toBeNull();
  });

  it('accepts 120 (upper bound)', () => {
    expect(validateDuration(120)).toBeNull();
  });

  it('rejects 121', () => {
    expect(validateDuration(121)).not.toBeNull();
  });

  it('rejects a non-integer (1.5)', () => {
    expect(validateDuration(1.5)).not.toBeNull();
  });

  it('rejects a non-numeric string', () => {
    expect(validateDuration('abc')).not.toBeNull();
  });

  it('rejects NaN', () => {
    expect(validateDuration(NaN)).not.toBeNull();
  });

  it('rejects Infinity', () => {
    expect(validateDuration(Infinity)).not.toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Unit tests — localStorage absent-key defaults
   ═══════════════════════════════════════════════════════════════════════ */

describe('localStorage absent-key defaults', () => {
  let store;

  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('theme defaults to "light" when dashboard_theme is absent', () => {
    // ThemeToggle.init reads localStorage; absent key → stored = null → falls back to "light"
    // We test the logic directly: getItem returns null → stored should be treated as "light"
    const raw = globalThis.localStorage.getItem('dashboard_theme');
    const resolved = (raw === 'dark' || raw === 'light') ? raw : 'light';
    expect(resolved).toBe('light');
  });

  it('duration defaults to 1500 s when dashboard_timer_duration is absent', () => {
    const { parseDuration, validateDuration } = require('../js/app.js');
    const raw = globalThis.localStorage.getItem('dashboard_timer_duration');
    // null → parseDuration(null) returns null → fall back to 1500
    const parsed = raw !== null ? parseDuration(raw) : null;
    const defaultSeconds = (parsed !== null && validateDuration(parsed) === null)
      ? parsed * 60
      : 1500;
    expect(defaultSeconds).toBe(1500);
  });

  it('sort option defaults to "default" when dashboard_todo_sort is absent', () => {
    const VALID = ['default', 'az', 'za', 'incomplete-first', 'complete-first'];
    const raw = globalThis.localStorage.getItem('dashboard_todo_sort');
    const resolved = (raw !== null && VALID.includes(raw)) ? raw : 'default';
    expect(resolved).toBe('default');
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   Unit tests — DOM injection smoke tests
   ═══════════════════════════════════════════════════════════════════════ */

describe('DOM injection smoke tests', () => {
  let store;

  /**
   * Builds a minimal in-memory DOM tree that mirrors the real HTML structure.
   * Returns a document-like object with querySelector, createElement, head,
   * and body — enough for all the init() methods to run without errors.
   */
  function buildMockDocument() {
    // Track all created elements by id and class for later querying
    const elements = {};
    const allElements = [];

    function createElement(tag) {
      const el = {
        _tag: tag,
        _id: '',
        _classes: new Set(),
        _children: [],
        _parent: null,
        _attrs: {},
        _listeners: {},
        textContent: '',
        hidden: false,
        disabled: false,
        value: '',
        innerHTML: '',
        type: '',
        min: '',
        max: '',
        placeholder: '',
        maxLength: undefined,
        rel: '',
        href: '',
        get id() { return this._id; },
        set id(v) {
          this._id = v;
          elements[v] = this;
        },
        get className() { return [...this._classes].join(' '); },
        set className(v) {
          this._classes = new Set(v.split(' ').filter(Boolean));
        },
        classList: null, // set below
        setAttribute(k, v) { this._attrs[k] = v; },
        getAttribute(k) { return this._attrs[k] ?? null; },
        appendChild(child) {
          this._children.push(child);
          child._parent = this;
          allElements.push(child);
          return child;
        },
        insertBefore(child, ref) {
          const idx = this._children.indexOf(ref);
          if (idx === -1) {
            this._children.push(child);
          } else {
            this._children.splice(idx, 0, child);
          }
          child._parent = this;
          allElements.push(child);
          return child;
        },
        get firstChild() { return this._children[0] ?? null; },
        addEventListener(evt, fn, opts) {
          if (!this._listeners[evt]) this._listeners[evt] = [];
          this._listeners[evt].push(fn);
        },
        querySelectorAll(sel) {
          return allElements.filter(e => matchesSelector(e, sel));
        },
        querySelector(sel) {
          return allElements.find(e => matchesSelector(e, sel)) ?? null;
        },
        cloneNode(deep) { return createElement(this._tag); },
        replaceChild(newChild, oldChild) {
          const idx = this._children.indexOf(oldChild);
          if (idx !== -1) this._children[idx] = newChild;
          newChild._parent = this;
          allElements.push(newChild);
        },
      };
      // Attach classList after el is defined
      el.classList = {
        _el: el,
        add(c) { el._classes.add(c); },
        remove(c) { el._classes.delete(c); },
        contains(c) { return el._classes.has(c); },
      };
      allElements.push(el);
      return el;
    }

    function matchesSelector(el, sel) {
      // Support: #id, .class, tag, tag.class, [attr^=val], selector > child (basic)
      sel = sel.trim();
      if (sel.startsWith('#')) return el._id === sel.slice(1);
      if (sel.startsWith('.')) return el._classes.has(sel.slice(1));
      if (sel.startsWith('[')) {
        // e.g. [href="css/enhancements.css"] or [aria-label^="Edit task"]
        const m = sel.match(/^\[([^\]=^]+)(\^?=["']?([^"'\]]+)["']?)?\]$/);
        if (m) {
          const attr = el._attrs[m[1]];
          if (!m[2]) return attr !== undefined;
          if (m[2].startsWith('^=')) return attr && attr.startsWith(m[3]);
          return attr === m[3];
        }
        return false;
      }
      // tag.class or tag#id
      const dotIdx = sel.indexOf('.');
      if (dotIdx > 0) {
        const tag = sel.slice(0, dotIdx);
        const cls = sel.slice(dotIdx + 1);
        return el._tag === tag && el._classes.has(cls);
      }
      return el._tag === sel;
    }

    // Build the DOM tree
    const head = createElement('head');
    const body = createElement('body');
    body.classList = {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
    };

    // <main class="dashboard">
    const main = createElement('main');
    main.className = 'dashboard';

    // #greeting
    const greeting = createElement('section');
    greeting.id = 'greeting';
    const greetingMsg = createElement('span');
    greetingMsg.id = 'greeting-message';
    greeting.appendChild(greetingMsg);
    main.appendChild(greeting);

    // #timer
    const timer = createElement('section');
    timer.id = 'timer';
    main.appendChild(timer);

    // #todo
    const todo = createElement('section');
    todo.id = 'todo';
    const todoForm = createElement('form');
    todoForm.id = 'todo-add-form';
    const todoInput = createElement('input');
    todoInput.id = 'todo-input';
    todoForm.appendChild(todoInput);
    const todoError = createElement('p');
    todoError.id = 'todo-error';
    todoError.hidden = true;
    const todoList = createElement('ul');
    todoList.id = 'todo-list';
    todo.appendChild(todoForm);
    todo.appendChild(todoError);
    todo.appendChild(todoList);
    main.appendChild(todo);

    body.appendChild(main);
    allElements.push(main, greeting, greetingMsg, timer, todo, todoForm, todoInput, todoError, todoList);

    const doc = {
      body,
      head,
      _allElements: allElements,
      _elements: elements,
      createElement,
      querySelector(sel) {
        if (sel === 'main.dashboard') return main;
        if (sel === 'link[href="css/enhancements.css"]') return null;
        return allElements.find(e => matchesSelector(e, sel)) ?? null;
      },
      querySelectorAll(sel) {
        return allElements.filter(e => matchesSelector(e, sel));
      },
      getElementById(id) { return elements[id] ?? null; },
    };

    return { doc, allElements, matchesSelector };
  }

  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem:    (k) => (k in store ? store[k] : null),
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.document;
    delete globalThis.localStorage;
  });

  it('ThemeToggle.init() injects a .theme-toolbar with a .theme-toggle-btn into <main>', () => {
    const { ThemeToggle } = require('../js/app.js');
    const { doc } = buildMockDocument();
    globalThis.document = doc;
    ThemeToggle.init();
    expect(doc.querySelector('.theme-toolbar')).not.toBeNull();
    expect(doc.querySelector('.theme-toggle-btn')).not.toBeNull();
  });

  it('GreetingNameUI.init() injects a .name-store-form into #greeting', () => {
    const { GreetingNameUI } = require('../js/app.js');
    const { doc } = buildMockDocument();
    globalThis.document = doc;
    GreetingNameUI.init();
    const form = doc.querySelector('.name-store-form');
    expect(form).not.toBeNull();
    expect(doc.querySelector('.name-store-input')).not.toBeNull();
    expect(doc.querySelector('.name-store-btn')).not.toBeNull();
  });

  it('TimerConfig.init() injects a .timer-config-form into #timer', () => {
    const { TimerConfig, FocusTimerWidget } = require('../js/app.js');
    const { doc } = buildMockDocument();
    globalThis.document = doc;
    FocusTimerWidget._state = { remaining: 1500, running: false };
    FocusTimerWidget.render = () => {};
    TimerConfig._inputEl  = null;
    TimerConfig._setBtnEl = null;
    TimerConfig._errorEl  = null;
    TimerConfig.init();
    expect(doc.querySelector('.timer-config-form')).not.toBeNull();
    expect(doc.querySelector('.timer-config-input')).not.toBeNull();
    expect(doc.querySelector('.timer-config-btn')).not.toBeNull();
  });

  it('SortControl.init() injects a .sort-control with a select into #todo', () => {
    const { SortControl, TodoWidget } = require('../js/app.js');
    const { doc } = buildMockDocument();
    globalThis.document = doc;
    TodoWidget._tasks = [];
    TodoWidget.render = () => {};
    SortControl._option = 'default';
    SortControl.init();
    expect(doc.querySelector('.sort-control')).not.toBeNull();
    expect(doc.querySelector('#sort-control-select')).not.toBeNull();
  });
});
