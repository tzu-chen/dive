import { describe, it, expect } from 'vitest';
import {
  currentPage,
  progressPercent,
  dailyPages,
  last7DaysActivity,
  streak,
  booksFinishedThisYear,
} from './stats';
import type { Book, Session } from './schema';

const session = (overrides: Partial<Session>): Session => ({
  id: 'x',
  bookId: 'b',
  readOn: '2026-04-20',
  startPage: 0,
  endPage: 0,
  note: null,
  createdAt: '2026-04-20T00:00:00Z',
  ...overrides,
});

const book = (overrides: Partial<Book>): Book => ({
  id: 'b',
  title: 't',
  authors: '[]',
  isbn13: null,
  openLibraryId: null,
  pageCount: null,
  publishedYear: null,
  coverUrl: null,
  coverPath: null,
  type: null,
  purchaseLocation: null,
  status: 'reading',
  startedAt: null,
  finishedAt: null,
  abandonedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('currentPage', () => {
  it('returns 0 for empty sessions', () => {
    expect(currentPage([])).toBe(0);
  });
  it('returns max end_page across sessions', () => {
    expect(
      currentPage([
        session({ endPage: 50 }),
        session({ endPage: 100 }),
        session({ endPage: 80 }),
      ]),
    ).toBe(100);
  });
});

describe('progressPercent', () => {
  it('returns 0 when pageCount is null/zero', () => {
    expect(progressPercent(50, null)).toBe(0);
    expect(progressPercent(50, 0)).toBe(0);
  });
  it('returns ratio for normal case', () => {
    expect(progressPercent(50, 100)).toBe(0.5);
  });
  it('clamps above 1', () => {
    expect(progressPercent(150, 100)).toBe(1);
  });
  it('clamps below 0', () => {
    expect(progressPercent(-5, 100)).toBe(0);
  });
});

describe('dailyPages', () => {
  it('sums pages for the given date only', () => {
    expect(
      dailyPages(
        [
          session({ readOn: '2026-04-20', startPage: 0, endPage: 30 }),
          session({ readOn: '2026-04-19', startPage: 0, endPage: 50 }),
        ],
        '2026-04-20',
      ),
    ).toBe(30);
  });
  it('returns 0 when no sessions match', () => {
    expect(dailyPages([], '2026-04-20')).toBe(0);
  });
});

describe('last7DaysActivity', () => {
  it('returns 7 booleans, oldest first', () => {
    const result = last7DaysActivity(
      [session({ readOn: '2026-04-20' }), session({ readOn: '2026-04-18' })],
      '2026-04-20',
    );
    expect(result).toHaveLength(7);
    // oldest (apr 14) … newest (apr 20)
    expect(result).toEqual([false, false, false, false, true, false, true]);
  });
});

describe('streak', () => {
  it('returns 0 when there are no sessions', () => {
    expect(streak([], '2026-04-20')).toBe(0);
  });
  it('counts consecutive days ending today', () => {
    expect(
      streak(
        [
          session({ readOn: '2026-04-20' }),
          session({ readOn: '2026-04-19' }),
          session({ readOn: '2026-04-18' }),
        ],
        '2026-04-20',
      ),
    ).toBe(3);
  });
  it("does not break streak if today has no session but yesterday does", () => {
    expect(
      streak(
        [session({ readOn: '2026-04-19' }), session({ readOn: '2026-04-18' })],
        '2026-04-20',
      ),
    ).toBe(2);
  });
  it('resets when there is a gap', () => {
    expect(
      streak(
        [
          session({ readOn: '2026-04-20' }),
          session({ readOn: '2026-04-18' }),
        ],
        '2026-04-20',
      ),
    ).toBe(1);
  });
  it('returns 0 when neither today nor yesterday have sessions', () => {
    expect(streak([session({ readOn: '2026-04-15' })], '2026-04-20')).toBe(0);
  });
});

describe('booksFinishedThisYear', () => {
  it('counts only finished books with matching year', () => {
    expect(
      booksFinishedThisYear(
        [
          book({ status: 'finished', finishedAt: '2026-03-01T00:00:00Z' }),
          book({ status: 'finished', finishedAt: '2025-12-31T00:00:00Z' }),
          book({ status: 'reading' }),
          book({ status: 'abandoned', finishedAt: '2026-02-01T00:00:00Z' }),
        ],
        '2026-04-20',
      ),
    ).toBe(1);
  });
});
