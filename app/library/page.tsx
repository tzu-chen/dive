import Link from 'next/link';
import { getCaller } from '@/server/caller';
import { BookListRow } from '@/components/BookListRow';
import { currentPage as pageFromSessions } from '@/server/stats';
import { bookStatusEnum, type BookStatus } from '@/server/types';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const FILTERS: { key: 'all' | BookStatus; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'reading', label: 'reading' },
  { key: 'want', label: 'want' },
  { key: 'finished', label: 'finished' },
  { key: 'abandoned', label: 'abandoned' },
];

function chipHref(key: 'all' | BookStatus) {
  return key === 'all' ? '/library' : `/library?status=${key}`;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const parsed = bookStatusEnum.safeParse(statusParam);
  const active: 'all' | BookStatus = parsed.success ? parsed.data : 'all';

  const caller = getCaller();
  const books = await caller.books.list(active === 'all' ? undefined : { status: active });

  const readingIds = books.filter((b) => b.status === 'reading').map((b) => b.id);
  const sessionsByBook = new Map<string, Awaited<ReturnType<typeof caller.sessions.listForBook>>>();
  await Promise.all(
    readingIds.map(async (id) => {
      sessionsByBook.set(id, await caller.sessions.listForBook({ bookId: id }));
    }),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Library</h1>
        <Link href="/add" className={styles.addLink}>+ add a book</Link>
      </header>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={chipHref(f.key)}
            className={`${styles.chip} ${active === f.key ? styles.chipActive : ''}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {books.length === 0 ? (
        <p className={styles.empty}>
          {active === 'all'
            ? 'no books yet.'
            : `no books in "${active}".`}{' '}
          <Link href="/add" className={styles.inlineLink}>add one</Link>.
        </p>
      ) : (
        <div className={styles.list}>
          {books.map((b) => (
            <BookListRow
              key={b.id}
              book={b}
              authors={JSON.parse(b.authors) as string[]}
              currentPage={pageFromSessions(sessionsByBook.get(b.id) ?? [])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
