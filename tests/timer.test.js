/**
 * Property-based tests for timer pure functions.
 * Feature: personal-dashboard
 */

const fc = require('fast-check');
const { formatTimer, createTimerState } = require('../js/app.js');

// ── Property 4: tick decrements remaining by exactly 1 ───────────────────
// Feature: personal-dashboard, Property 4: tick decrements remaining by 1
describe('createTimerState — tick', () => {
  it('decrements remaining by exactly 1 when remaining > 0', () => {
    // Validates: Requirements 2.2
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1500 }), (remaining) => {
        const state = createTimerState();
        state.remaining = remaining;
        state.running = true;
        const before = state.remaining;
        state.tick();
        return state.remaining === before - 1;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: formatTimer produces MM:SS ───────────────────────────────
// Feature: personal-dashboard, Property 5: formatTimer produces MM:SS
describe('formatTimer', () => {
  it('returns a string matching /^\\d{2}:\\d{2}$/ for any integer in [0, 1500]', () => {
    // Validates: Requirements 2.3
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = formatTimer(seconds);
        return /^\d{2}:\d{2}$/.test(result);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: stop retains remaining value ─────────────────────────────
// Feature: personal-dashboard, Property 6: stop retains remaining
describe('createTimerState — stop', () => {
  it('leaves remaining unchanged after stop()', () => {
    // Validates: Requirements 2.4
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), fc.boolean(), (remaining, running) => {
        const state = createTimerState();
        state.remaining = remaining;
        state.running = running;
        const before = state.remaining;
        state.stop();
        return state.remaining === before;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 7: reset restores remaining to 1500 ─────────────────────────
// Feature: personal-dashboard, Property 7: reset restores to 1500
describe('createTimerState — reset', () => {
  it('sets remaining to exactly 1500 for any timer state', () => {
    // Validates: Requirements 2.5
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), fc.boolean(), (remaining, running) => {
        const state = createTimerState();
        state.remaining = remaining;
        state.running = running;
        state.reset();
        return state.remaining === 1500;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 8: start is idempotent ──────────────────────────────────────
// Feature: personal-dashboard, Property 8: start is idempotent
describe('createTimerState — start', () => {
  it('does not change running state when already running', () => {
    // Validates: Requirements 2.7
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1500 }), (remaining) => {
        const state = createTimerState();
        state.remaining = remaining;
        state.start(); // first call — sets running = true
        state.start(); // second call — should be a no-op
        return state.running === true;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Unit tests: timer edge cases (Requirement 2.6) ───────────────────────
describe('timer edge cases', () => {
  it('tick() at remaining=1 sets remaining to 0 and running to false', () => {
    // Validates: Requirement 2.6
    const state = createTimerState();
    state.remaining = 1;
    state.running = true;
    state.tick();
    expect(state.remaining).toBe(0);
    expect(state.running).toBe(false);
  });

  it('tick() at remaining=0 does not go below 0 and running stays false', () => {
    // Validates: Requirement 2.6
    const state = createTimerState();
    state.remaining = 0;
    state.running = false;
    state.tick();
    expect(state.remaining).toBe(0);
    expect(state.running).toBe(false);
  });

  it('formatTimer(0) returns "00:00"', () => {
    // Validates: Requirement 2.6
    expect(formatTimer(0)).toBe('00:00');
  });
});
