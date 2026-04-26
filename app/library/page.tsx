import Link from 'next/link';
import { getCaller } from '@/server/caller';
import { LibraryView, type LibraryBook } from '@/components/LibraryView';
import { currentPage as pageFromSessions } from '@/server/stats';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const caller = getCaller();
  const books = await caller.books.list();

  const readingIds = books.filter((b) => b.status === 'reading').map((b) => b.id);
  const currentPageByBook = new Map<string, number>();
  await Promise.all(
    readingIds.map(async (id) => {
      const sessions = await caller.sessions.listForBook({ bookId: id });
      currentPageByBook.set(id, pageFromSessions(sessions));
    }),
  );

  const view: LibraryBook[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    authors: JSON.parse(b.authors) as string[],
    status: b.status as LibraryBook['status'],
    pageCount: b.pageCount,
    currentPage: currentPageByBook.get(b.id) ?? 0,
    finishedAt: b.finishedAt,
    updatedAt: b.updatedAt,
    coverPath: b.coverPath,
  }));

  const total = books.length;

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>← back to the reading room</Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>The Library</h1>
          <p className={styles.subtitle}>{subtitleFor(total)}</p>
        </div>
        <Link href="/add" className={styles.addLink}>+ add a book</Link>
      </header>

      <LibraryView books={view} />
    </div>
  );
}

function subtitleFor(count: number): string {
  if (count === 0) return 'no books on the shelves yet';
  if (count === 1) return 'one book, quietly kept';
  return `${count} books, quietly kept`;
}
