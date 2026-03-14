/**
 * Property-based tests for greeting pure functions.
 * Feature: personal-dashboard
 */

const fc = require('fast-check');
const { getGreeting, formatTime, formatDate } = require('../js/app.js');

// ── Property 1: getGreeting covers all hours ──────────────────────────────
// Feature: personal-dashboard, Property 1: getGreeting covers all hours
describe('getGreeting', () => {
  it('returns a valid greeting for every hour in [0,23]', () => {
    // Validates: Requirements 1.3, 1.4, 1.5, 1.6
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (h) => {
        const result = getGreeting(h);
        const valid = ['Good morning', 'Good afternoon', 'Good evening', 'Good night'];
        return valid.includes(result);
      }),
      { numRuns: 100 }
    );
  });

  it('maps hours to the correct greeting string', () => {
    // Validates: Requirements 1.3, 1.4, 1.5, 1.6
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (h) => {
        const result = getGreeting(h);
        if (h >= 5 && h <= 11)  return result === 'Good morning';
        if (h >= 12 && h <= 17) return result === 'Good afternoon';
        if (h >= 18 && h <= 21) return result === 'Good evening';
        // [22,23] ∪ [0,4] → night
        return result === 'Good night';
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 2: formatTime produces HH:MM ────────────────────────────────
// Feature: personal-dashboard, Property 2: formatTime produces HH:MM
describe('formatTime', () => {
  it('returns a string matching /^\\d{2}:\\d{2}$/ for any Date', () => {
    // Validates: Requirements 1.1
    fc.assert(
      fc.property(fc.date(), (d) => {
        const result = formatTime(d);
        return /^\d{2}:\d{2}$/.test(result);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: formatDate contains required components ──────────────────
// Feature: personal-dashboard, Property 3: formatDate contains required components
describe('formatDate', () => {
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS   = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

  it('contains a full weekday name, full month name, numeric day, and four-digit year', () => {
    // Validates: Requirements 1.2
    // Constrain to years 1970–2099 — toLocaleDateString is unreliable for extreme/negative years
    const reasonableDate = fc.date({
      min: new Date('1970-01-01T00:00:00.000Z'),
      max: new Date('2099-12-31T23:59:59.999Z'),
    });
    fc.assert(
      fc.property(reasonableDate, (d) => {
        const result = formatDate(d);
        const hasWeekday = WEEKDAYS.some((w) => result.includes(w));
        const hasMonth   = MONTHS.some((m) => result.includes(m));
        const hasDay     = /\b\d{1,2}\b/.test(result);
        const hasYear    = /\b\d{4}\b/.test(result);
        return hasWeekday && hasMonth && hasDay && hasYear;
      }),
      { numRuns: 100 }
    );
  });
});
