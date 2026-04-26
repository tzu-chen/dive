import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { books } from '../schema';
import { bookStatusEnum } from '../types';
import { nowISO } from '../dateUtil';
import { fetchCoverForBook, deleteCoverFile } from '../openlibrary';

const createInput = z.object({
  title: z.string().min(1).max(500),
  authors: z.array(z.string().min(1)).default([]),
  pageCount: z.number().int().positive().nullable().optional(),
  isbn13: z.string().optional().nullable(),
  publishedYear: z.number().int().optional().nullable(),
  type: z.string().trim().min(1).optional().nullable(),
  purchaseLocation: z.string().trim().min(1).optional().nullable(),
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

  create: publicProcedure.input(createInput).mutation(async ({ input }) => {
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
      coverPath: null as string | null,
      type: input.type ?? null,
      purchaseLocation: input.purchaseLocation ?? null,
      status: input.status,
      startedAt: input.status === 'reading' ? now : null,
      finishedAt: input.status === 'finished' ? now : null,
      abandonedAt: input.status === 'abandoned' ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(books).values(row).run();

    const coverPath = await fetchCoverForBook(id, input.title, input.authors);
    if (coverPath) {
      db.update(books).set({ coverPath, updatedAt: nowISO() }).where(eq(books.id, id)).run();
      row.coverPath = coverPath;
    }
    return row;
  }),

  refetchCover: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = db.select().from(books).where(eq(books.id, input.id)).get();
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      const authors = JSON.parse(existing.authors) as string[];
      const coverPath = await fetchCoverForBook(existing.id, existing.title, authors);
      if (!coverPath) return { id: existing.id, coverPath: null };
      db.update(books)
        .set({ coverPath, updatedAt: nowISO() })
        .where(eq(books.id, existing.id))
        .run();
      return { id: existing.id, coverPath };
    }),

  removeCover: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = db.select().from(books).where(eq(books.id, input.id)).get();
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      if (existing.coverPath) await deleteCoverFile(existing.coverPath);
      db.update(books)
        .set({ coverPath: null, coverUrl: null, updatedAt: nowISO() })
        .where(eq(books.id, input.id))
        .run();
      return { id: input.id };
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
      } else if (input.status === 'owned') {
        update.startedAt = null;
        update.finishedAt = null;
        update.abandonedAt = null;
      } else {
        update.startedAt = null;
        update.finishedAt = null;
        update.abandonedAt = null;
      }
      db.update(books).set(update).where(eq(books.id, input.id)).run();
      return { id: input.id, status: input.status };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().trim().min(1).max(500),
        authors: z.array(z.string().trim().min(1)).default([]),
        pageCount: z.number().int().positive().nullable(),
        isbn13: z.string().trim().min(1).nullable(),
        publishedYear: z.number().int().nullable(),
        type: z.string().trim().min(1).nullable(),
        purchaseLocation: z.string().trim().min(1).nullable(),
      }),
    )
    .mutation(({ input }) => {
      const existing = db.select().from(books).where(eq(books.id, input.id)).get();
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Book not found' });
      db.update(books)
        .set({
          title: input.title,
          authors: JSON.stringify(input.authors),
          pageCount: input.pageCount,
          isbn13: input.isbn13,
          publishedYear: input.publishedYear,
          type: input.type,
          purchaseLocation: input.purchaseLocation,
          updatedAt: nowISO(),
        })
        .where(eq(books.id, input.id))
        .run();
      return { id: input.id };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      db.delete(books).where(eq(books.id, input.id)).run();
      return { id: input.id };
    }),
});
