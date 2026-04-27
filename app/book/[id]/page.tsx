import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRPCError } from '@trpc/server';
import { getCaller } from '@/server/caller';
import { BookSpine } from '@/components/BookSpine';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusActions } from '@/components/StatusActions';
import { RefetchCoverButton } from '@/components/RefetchCoverButton';
import { BookEditForm } from '@/components/BookEditForm';
import { SessionForm } from '@/components/SessionForm';
import { SessionList } from '@/components/SessionList';
import { NoteForm } from '@/components/NoteForm';
import { NoteCard } from '@/components/NoteCard';
import { formatMonthDay, todayISO } from '@/server/dateUtil';
import type { BookStatus, NoteKind } from '@/server/types';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = getCaller();

  let book;
  try {
    book = await caller.books.get({ id });
  } catch (err) {
    if (err instanceof TRPCError && err.code === 'NOT_FOUND') notFound();
    throw err;
  }

  const [sessions, notes, progress] = await Promise.all([
    caller.sessions.listForBook({ bookId: id }),
    caller.notes.listForBook({ bookId: id }),
    caller.stats.forBook({ bookId: id }),
  ]);

  const authors = JSON.parse(book.authors) as string[];
  const status = book.status as BookStatus;
  const metaParts = [
    authors.join(', ') || 'unknown author',
    book.pageCount ? `${book.pageCount} pages` : null,
    book.publishedYear ?? null,
    book.type ?? null,
  ].filter(Boolean);
  const purchaseLocation = book.purchaseLocation;
  const purchaseDate = book.purchaseDate;
  const provenance = [
    purchaseLocation ? `acquired from ${purchaseLocation}` : null,
    purchaseDate ? `on ${formatMonthDay(purchaseDate)}` : null,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>← back to the reading room</Link>

      <div className={styles.headerCard}>
        <div className={styles.spineWrap}>
          <BookSpine title={book.title} bookId={book.id} size="lg" hasCover={Boolean(book.coverPath)} />
          <RefetchCoverButton bookId={book.id} hasCover={Boolean(book.coverPath)} />
        </div>
        <div className={styles.headerBody}>
          <h1 className={styles.title}>{book.title}</h1>
          <div className={styles.meta}>{metaParts.join(' · ')}</div>
          <div className={styles.statusRow}>
            <StatusBadge status={status} />
            <StatusActions bookId={book.id} current={status} />
          </div>
          {provenance && (
            <div className={styles.provenance}>{provenance}</div>
          )}
          <BookEditForm
            bookId={book.id}
            title={book.title}
            authors={authors}
            pageCount={book.pageCount}
            isbn13={book.isbn13}
            publishedYear={book.publishedYear}
            type={book.type}
            purchaseLocation={book.purchaseLocation}
            purchaseDate={book.purchaseDate}
          />
          <div className={styles.progressRow}>
            <ProgressBar
              currentPage={progress.currentPage}
              pageCount={book.pageCount}
            />
            {book.startedAt && (
              <div className={styles.startedAt}>
                started {formatMonthDay(book.startedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        <div>
          <h2 className={styles.section}>Log a session</h2>
          <SessionForm
            bookId={book.id}
            today={todayISO()}
            currentPage={progress.currentPage}
          />

          <h2 className={styles.section}>Recent sessions</h2>
          <SessionList sessions={sessions} />
        </div>

        <div>
          <h2 className={styles.section}>Marginalia</h2>
          <NoteForm bookId={book.id} />
          {notes.length === 0 ? (
            <div className={styles.empty}>no notes yet — quotes and thoughts land here.</div>
          ) : (
            notes.map((n) => (
              <NoteCard
                key={n.id}
                kind={n.kind as NoteKind}
                body={n.body}
                page={n.page}
                createdAt={n.createdAt}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
