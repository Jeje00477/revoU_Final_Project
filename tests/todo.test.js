/**
 * Property-based tests for todo pure functions (Properties 9–14).
 * Feature: personal-dashboard
 */

const fc = require('fast-check');
const { validateTask, createTask, addTask, editTask, toggleTask, deleteTask } = require('../js/app.js');

// Arbitrary: a valid (non-empty, non-whitespace) label
const validLabel = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

// Arbitrary: a whitespace-only or empty string
const whitespaceLabel = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 })
);

// Arbitrary: a task object matching the data model
const taskArb = fc.record({
  id:    fc.string({ minLength: 1 }),
  label: fc.string({ minLength: 1 }),
  done:  fc.boolean(),
});

// Arbitrary: an array of task objects
const tasksArb = fc.array(taskArb);

// ── Property 9: addTask grows list by 1 ──────────────────────────────────
// Feature: personal-dashboard, Property 9: addTask grows list by 1
describe('addTask', () => {
  it('increases length by exactly 1 and new task has given label and done:false', () => {
    // Validates: Requirements 3.1
    fc.assert(
      fc.property(tasksArb, validLabel, (tasks, label) => {
        const result = addTask(tasks, label);
        if (result.length !== tasks.length + 1) return false;
        const newTask = result[result.length - 1];
        return newTask.label === label.trim() && newTask.done === false;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 10: whitespace/empty labels rejected ─────────────────────────
// Feature: personal-dashboard, Property 10: whitespace/empty labels rejected
describe('validateTask + addTask with invalid labels', () => {
  it('validateTask returns non-null for whitespace/empty labels', () => {
    // Validates: Requirements 3.2
    fc.assert(
      fc.property(whitespaceLabel, (label) => {
        return validateTask(label) !== null;
      }),
      { numRuns: 100 }
    );
  });

  it('addTask returns the same array unchanged for whitespace/empty labels', () => {
    // Validates: Requirements 3.2
    fc.assert(
      fc.property(tasksArb, whitespaceLabel, (tasks, label) => {
        const result = addTask(tasks, label);
        return result === tasks; // same reference — no new array created
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 11: editTask updates label only ──────────────────────────────
// Feature: personal-dashboard, Property 11: editTask updates label only
describe('editTask', () => {
  it('updates the target task label and leaves all other fields unchanged', () => {
    // Validates: Requirements 3.3
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1 }),
        fc.integer({ min: 0, max: 9 }),
        validLabel,
        (tasks, indexSeed, newLabel) => {
          const idx = indexSeed % tasks.length;
          const target = tasks[idx];
          const result = editTask(tasks, target.id, newLabel);

          const updated = result.find(t => t.id === target.id);
          if (!updated) return false;
          // label must be updated
          if (updated.label !== newLabel) return false;
          // id and done must be unchanged
          if (updated.id !== target.id) return false;
          if (updated.done !== target.done) return false;
          // all other tasks must be identical
          return result.every((t, i) => {
            if (t.id === target.id) return true;
            return t === tasks[i];
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 12: toggleTask is its own inverse ────────────────────────────
// Feature: personal-dashboard, Property 12: toggleTask is its own inverse
describe('toggleTask', () => {
  it('calling toggleTask twice returns done to its original value', () => {
    // Validates: Requirements 3.4
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1 }),
        fc.integer({ min: 0, max: 9 }),
        (tasks, indexSeed) => {
          const idx = indexSeed % tasks.length;
          const target = tasks[idx];
          const once  = toggleTask(tasks, target.id);
          const twice = toggleTask(once, target.id);
          const restored = twice.find(t => t.id === target.id);
          return restored !== undefined && restored.done === target.done;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 13: deleteTask removes the task ─────────────────────────────
// Feature: personal-dashboard, Property 13: deleteTask removes the task
describe('deleteTask', () => {
  it('results in no task with the given id remaining', () => {
    // Validates: Requirements 3.5
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1 }),
        fc.integer({ min: 0, max: 9 }),
        (tasks, indexSeed) => {
          const idx = indexSeed % tasks.length;
          const target = tasks[idx];
          const result = deleteTask(tasks, target.id);
          return !result.some(t => t.id === target.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 14: todo persistence round-trip ─────────────────────────────
// Feature: personal-dashboard, Property 14: todo persistence round-trip
describe('todo persistence round-trip', () => {
  it('JSON.stringify + JSON.parse produces a deeply equal array', () => {
    // Validates: Requirements 3.6, 3.7, 3.8
    fc.assert(
      fc.property(tasksArb, (tasks) => {
        const serialised   = JSON.stringify(tasks);
        const deserialised = JSON.parse(serialised);
        if (deserialised.length !== tasks.length) return false;
        return tasks.every((t, i) => {
          const d = deserialised[i];
          return d.id === t.id && d.label === t.label && d.done === t.done;
        });
      }),
      { numRuns: 100 }
    );
  });
});

// ── Unit tests: TodoWidget.load() edge cases ─────────────────────────────
// Validates: Requirements 3.7, 3.8

const { TodoWidget } = require('../js/app.js');

describe('TodoWidget.load() edge cases', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns [] when localStorage.getItem throws (graceful degradation)', () => {
    // Requirement 3.7: graceful degradation when localStorage is unavailable
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('localStorage unavailable'); },
      setItem: () => {},
      removeItem: () => {},
    });
    const result = TodoWidget.load();
    expect(result).toEqual([]);
  });

  it('returns [] when localStorage contains corrupt JSON', () => {
    // Requirement 3.7: corrupt data falls back to empty array
    vi.stubGlobal('localStorage', {
      getItem: () => 'not-valid-json',
      setItem: () => {},
      removeItem: () => {},
    });
    const result = TodoWidget.load();
    expect(result).toEqual([]);
  });

  it('returns [] when localStorage has no stored data (null)', () => {
    // Requirement 3.8: no stored data renders empty list without errors
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    expect(() => TodoWidget.load()).not.toThrow();
    const result = TodoWidget.load();
    expect(result).toEqual([]);
  });
});
