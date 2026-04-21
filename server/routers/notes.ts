import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { notes } from '../schema';
import { noteKindEnum } from '../types';
import { nowISO } from '../dateUtil';

export const notesRouter = router({
  listForBook: publicProcedure
    .input(z.object({ bookId: z.string() }))
    .query(({ input }) => {
      return db
        .select()
        .from(notes)
        .where(eq(notes.bookId, input.bookId))
        .orderBy(desc(notes.createdAt))
        .all();
    }),

  create: publicProcedure
    .input(
      z.object({
        bookId: z.string(),
        kind: noteKindEnum,
        body: z.string().min(1).max(5000),
        page: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(({ input }) => {
      const row = {
        id: crypto.randomUUID(),
        bookId: input.bookId,
        kind: input.kind,
        body: input.body,
        page: input.page ?? null,
        createdAt: nowISO(),
      };
      db.insert(notes).values(row).run();
      return row;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      db.delete(notes).where(eq(notes.id, input.id)).run();
      return { id: input.id };
    }),
});
