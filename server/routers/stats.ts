import { z } from 'zod';
import { eq, desc, inArray } from 'drizzle-orm';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { books, sessions, notes } from '../schema';
import {
  currentPage,
  progressPercent,
  dailyPages,
  last7DaysActivity,
  streak,
  booksFinishedThisYear,
} from '../stats';
import { todayISO } from '../dateUtil';

export const DAILY_GOAL_PAGES = 30;
export const YEARLY_GOAL_BOOKS = 30;
export const UP_NEXT_LIMIT = 5;

export const statsRouter = router({
  dashboard: publicProcedure.query(() => {
    const today = todayISO();
    const allBooks = db.select().from(books).all();
    const allSessions = db.select().from(sessions).all();

    const reading = allBooks
      .filter((b) => b.status === 'reading')
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    const wanted = allBooks
      .filter((b) => b.status === 'want')
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
      .slice(0, UP_NEXT_LIMIT);

    const readingIds = reading.map((b) => b.id);
    const latestNoteByBook = new Map<string, { body: string; kind: string }>();
    if (readingIds.length > 0) {
      const noteRows = db
        .select()
        .from(notes)
        .where(inArray(notes.bookId, readingIds))
        .orderBy(desc(notes.createdAt))
        .all();
      for (const n of noteRows) {
        if (!latestNoteByBook.has(n.bookId)) {
          latestNoteByBook.set(n.bookId, { body: n.body, kind: n.kind });
        }
      }
    }

    const sessionsByBook = new Map<string, typeof allSessions>();
    for (const s of allSessions) {
      const list = sessionsByBook.get(s.bookId) ?? [];
      list.push(s);
      sessionsByBook.set(s.bookId, list);
    }

    const currentlyReading = reading.map((b) => {
      const bookSessions = sessionsByBook.get(b.id) ?? [];
      const cp = currentPage(bookSessions);
      return {
        ...b,
        currentPage: cp,
        progressPercent: progressPercent(cp, b.pageCount),
        latestNote: latestNoteByBook.get(b.id) ?? null,
      };
    });

    return {
      today,
      streak: streak(allSessions, today),
      todayPages: dailyPages(allSessions, today),
      dailyGoal: DAILY_GOAL_PAGES,
      yearlyGoal: YEARLY_GOAL_BOOKS,
      booksFinishedThisYear: booksFinishedThisYear(allBooks, today),
      libraryCount: allBooks.length,
      last7Days: last7DaysActivity(allSessions, today),
      currentlyReading,
      upNext: wanted,
    };
  }),

  forBook: publicProcedure
    .input(z.object({ bookId: z.string() }))
    .query(({ input }) => {
      const book = db.select().from(books).where(eq(books.id, input.bookId)).get();
      if (!book) return { currentPage: 0, progressPercent: 0 };
      const bookSessions = db
        .select()
        .from(sessions)
        .where(eq(sessions.bookId, input.bookId))
        .all();
      const cp = currentPage(bookSessions);
      return { currentPage: cp, progressPercent: progressPercent(cp, book.pageCount) };
    }),
});
