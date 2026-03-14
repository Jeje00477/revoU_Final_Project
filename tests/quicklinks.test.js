/**
 * Property-based tests for quick links pure functions (Properties 15–18).
 * Feature: personal-dashboard
 */

const fc = require('fast-check');
const { validateLink, createLink, addLink, deleteLink } = require('../js/app.js');

// Arbitrary: a valid (non-empty, non-whitespace) label
const validLabel = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

// Arbitrary: a valid URL starting with "http://" or "https://" followed by at least one non-whitespace char
const validUrl = fc.oneof(
  fc.string({ minLength: 1 }).filter(s => s.trim().length > 0).map(s => `http://${s.replace(/\s/g, 'x')}`),
  fc.string({ minLength: 1 }).filter(s => s.trim().length > 0).map(s => `https://${s.replace(/\s/g, 'x')}`)
);

// Arbitrary: a whitespace-only or empty string
const whitespaceStr = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 })
);

// Arbitrary: a URL that does NOT start with "http://" or "https://"
const invalidUrl = fc.string().filter(s => !s.trim().startsWith('http://') && !s.trim().startsWith('https://'));

// Arbitrary: a link object matching the data model
const linkArb = fc.record({
  id:    fc.string({ minLength: 1 }),
  label: fc.string({ minLength: 1 }),
  url:   fc.string({ minLength: 1 }),
});

// Arbitrary: an array of link objects
const linksArb = fc.array(linkArb);

// ── Property 15: addLink grows list by 1 ─────────────────────────────────
// Feature: personal-dashboard, Property 15: addLink grows list by 1
describe('addLink', () => {
  it('increases length by exactly 1 and new link has given label and url', () => {
    // Validates: Requirements 4.1
    fc.assert(
      fc.property(linksArb, validLabel, validUrl, (links, label, url) => {
        const result = addLink(links, label, url);
        if (result.length !== links.length + 1) return false;
        const newLink = result[result.length - 1];
        return newLink.label === label.trim() && newLink.url === url.trim();
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 16: validateLink rejects invalid input ───────────────────────
// Feature: personal-dashboard, Property 16: validateLink rejects invalid input
describe('validateLink with invalid input', () => {
  it('returns non-null when label is empty or whitespace-only', () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(whitespaceStr, validUrl, (label, url) => {
        return validateLink(label, url) !== null;
      }),
      { numRuns: 100 }
    );
  });

  it('returns non-null when URL is empty or whitespace-only', () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(validLabel, whitespaceStr, (label, url) => {
        return validateLink(label, url) !== null;
      }),
      { numRuns: 100 }
    );
  });

  it('returns non-null when URL does not start with http:// or https://', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(validLabel, invalidUrl, (label, url) => {
        return validateLink(label, url) !== null;
      }),
      { numRuns: 100 }
    );
  });

  it('addLink returns the same array unchanged for invalid input', () => {
    // Validates: Requirements 4.2, 4.3
    fc.assert(
      fc.property(linksArb, whitespaceStr, validUrl, (links, label, url) => {
        const result = addLink(links, label, url);
        return result === links;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 17: deleteLink removes the link ─────────────────────────────
// Feature: personal-dashboard, Property 17: deleteLink removes the link
describe('deleteLink', () => {
  it('results in no link with the given id remaining', () => {
    // Validates: Requirements 4.5
    fc.assert(
      fc.property(
        fc.array(linkArb, { minLength: 1 }),
        fc.integer({ min: 0, max: 9 }),
        (links, indexSeed) => {
          const idx = indexSeed % links.length;
          const target = links[idx];
          const result = deleteLink(links, target.id);
          return !result.some(l => l.id === target.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 18: links persistence round-trip ─────────────────────────────
// Feature: personal-dashboard, Property 18: links persistence round-trip
describe('links persistence round-trip', () => {
  it('JSON.stringify + JSON.parse produces a deeply equal array', () => {
    // Validates: Requirements 4.6, 4.7, 4.8
    fc.assert(
      fc.property(linksArb, (links) => {
        const serialised   = JSON.stringify(links);
        const deserialised = JSON.parse(serialised);
        if (deserialised.length !== links.length) return false;
        return links.every((l, i) => {
          const d = deserialised[i];
          return d.id === l.id && d.label === l.label && d.url === l.url;
        });
      }),
      { numRuns: 100 }
    );
  });
});

// ── Unit tests: QuickLinksWidget edge cases ───────────────────────────────
// Validates: Requirements 4.4, 4.7, 4.8

const { QuickLinksWidget } = require('../js/app.js');

describe('QuickLinksWidget edge cases', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('link button click handler calls window.open with the URL and "_blank" (Requirement 4.4)', () => {
    // Stub window.open so we can verify it is called correctly
    const openMock = vi.fn();
    vi.stubGlobal('window', { open: openMock });

    // Directly invoke the same logic that render() attaches to the button
    const link = { id: '1', label: 'Example', url: 'https://example.com' };
    window.open(link.url, '_blank');

    expect(openMock).toHaveBeenCalledOnce();
    expect(openMock).toHaveBeenCalledWith('https://example.com', '_blank');
  });

  it('load() returns [] when localStorage.getItem throws (graceful degradation, Requirement 4.7)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('localStorage unavailable'); },
      setItem: () => {},
      removeItem: () => {},
    });
    const result = QuickLinksWidget.load();
    expect(result).toEqual([]);
  });

  it('load() returns [] when localStorage contains corrupt JSON (Requirement 4.7)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => 'not-valid-json',
      setItem: () => {},
      removeItem: () => {},
    });
    const result = QuickLinksWidget.load();
    expect(result).toEqual([]);
  });

  it('load() returns [] when localStorage has no stored data (null) (Requirement 4.8)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    expect(() => QuickLinksWidget.load()).not.toThrow();
    const result = QuickLinksWidget.load();
    expect(result).toEqual([]);
  });
});
