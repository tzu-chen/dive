import { z } from 'zod';
import { and, eq, lt, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { sessions } from '../schema';
import { nowISO, todayISO } from '../dateUtil';
import { currentPage } from '../stats';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const sessionsRouter = router({
  listForBook: publicProcedure
    .input(z.object({ bookId: z.string() }))
    .query(({ input }) => {
      return db
        .select()
        .from(sessions)
        .where(eq(sessions.bookId, input.bookId))
        .orderBy(desc(sessions.readOn))
        .all();
    }),

  upsertForToday: publicProcedure
    .input(
      z.object({
        bookId: z.string(),
        endPage: z.number().int().min(0),
        note: z.string().nullable().optional(),
        readOn: isoDate.optional(),
      }),
    )
    .mutation(({ input }) => {
      const readOn = input.readOn ?? todayISO();
      const note = input.note?.trim() ? input.note : null;

      const priorSessions = db
        .select()
        .from(sessions)
        .where(and(eq(sessions.bookId, input.bookId), lt(sessions.readOn, readOn)))
        .all();
      const startPage = currentPage(priorSessions);

      if (input.endPage < startPage) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `End page ${input.endPage} is before current page ${startPage}.`,
        });
      }

      db.insert(sessions)
        .values({
          id: crypto.randomUUID(),
          bookId: input.bookId,
          readOn,
          startPage,
          endPage: input.endPage,
          note,
          createdAt: nowISO(),
        })
        .onConflictDoUpdate({
          target: [sessions.bookId, sessions.readOn],
          set: { startPage, endPage: input.endPage, note },
        })
        .run();

      return { bookId: input.bookId, readOn, startPage, endPage: input.endPage };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      db.delete(sessions).where(eq(sessions.id, input.id)).run();
      return { id: input.id };
    }),
});
