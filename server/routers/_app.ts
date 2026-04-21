import { router } from '../trpc';
import { booksRouter } from './books';
import { sessionsRouter } from './sessions';
import { notesRouter } from './notes';
import { statsRouter } from './stats';

export const appRouter = router({
  books: booksRouter,
  sessions: sessionsRouter,
  notes: notesRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
