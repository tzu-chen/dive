import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const books = sqliteTable(
  'books',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    authors: text('authors').notNull().default('[]'),
    isbn13: text('isbn_13'),
    openLibraryId: text('open_library_id'),
    pageCount: integer('page_count'),
    publishedYear: integer('published_year'),
    coverUrl: text('cover_url'),
    coverPath: text('cover_path'),
    status: text('status').notNull().default('want'),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    abandonedAt: text('abandoned_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    check(
      'books_status_check',
      sql`${t.status} IN ('want', 'reading', 'finished', 'abandoned')`,
    ),
    index('books_status_idx').on(t.status),
  ],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    readOn: text('read_on').notNull(),
    startPage: integer('start_page').notNull(),
    endPage: integer('end_page').notNull(),
    note: text('note'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('sessions_book_day_unique').on(t.bookId, t.readOn),
    index('sessions_read_on_idx').on(t.readOn),
    check('sessions_page_range_check', sql`${t.endPage} >= ${t.startPage}`),
  ],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    body: text('body').notNull(),
    page: integer('page'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    check('notes_kind_check', sql`${t.kind} IN ('quote', 'thought')`),
    index('notes_book_idx').on(t.bookId),
  ],
);

export const bookMetadataCache = sqliteTable('book_metadata_cache', {
  queryHash: text('query_hash').primaryKey(),
  responseJson: text('response_json').notNull(),
  fetchedAt: text('fetched_at').notNull(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
