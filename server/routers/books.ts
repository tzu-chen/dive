import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { books } from '../schema';
import { bookStatusEnum } from '../types';
import { nowISO } from '../dateUtil';

const createInput = z.object({
  title: z.string().min(1).max(500),
  authors: z.array(z.string().min(1)).default([]),
  pageCount: z.number().int().positive().nullable().optional(),
  isbn13: z.string().optional().nullable(),
  publishedYear: z.number().int().optional().nullable(),
  status: bookStatusEnum.default('want'),
});

export const booksRouter = router({
  list: publicProcedure
    .input(z.object({ status: bookStatusEnum.optional() }).optional())
    .query(({ input }) => {
      const status = input?.status;
      const rows = status
        ? db.select().from(books).where(eq(books.status, status)).orderBy(desc(books.updatedAt)).all()
        : db.select().from(books).orderBy(desc(books.updatedAt)).all();
      return rows;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const row = db.select().from(books).where(eq(books.id, input.id)).get();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      return row;
    }),

  create: publicProcedure.input(createInput).mutation(({ input }) => {
    const now = nowISO();
    const id = crypto.randomUUID();
    const row = {
      id,
      title: input.title,
      authors: JSON.stringify(input.authors),
      pageCount: input.pageCount ?? null,
      isbn13: input.isbn13 ?? null,
      publishedYear: input.publishedYear ?? null,
      openLibraryId: null,
      coverUrl: null,
      coverPath: null,
      status: input.status,
      startedAt: input.status === 'reading' ? now : null,
      finishedAt: input.status === 'finished' ? now : null,
      abandonedAt: input.status === 'abandoned' ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(books).values(row).run();
    return row;
  }),

  updateStatus: publicProcedure
    .input(z.object({ id: z.string(), status: bookStatusEnum }))
    .mutation(({ input }) => {
      const existing = db.select().from(books).where(eq(books.id, input.id)).get();
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });

      const now = nowISO();
      const update: Record<string, string | null> = {
        status: input.status,
        updatedAt: now,
      };
      if (input.status === 'reading') {
        update.startedAt = existing.startedAt ?? now;
        update.finishedAt = null;
        update.abandonedAt = null;
      } else if (input.status === 'finished') {
        update.finishedAt = now;
        update.abandonedAt = null;
      } else if (input.status === 'abandoned') {
        update.abandonedAt = now;
      } else {
        update.startedAt = null;
        update.finishedAt = null;
        update.abandonedAt = null;
      }
      db.update(books).set(update).where(eq(books.id, input.id)).run();
      return { id: input.id, status: input.status };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      db.delete(books).where(eq(books.id, input.id)).run();
      return { id: input.id };
    }),
});
