import Link from 'next/link';
import { BookSpine } from './BookSpine';
import { ProgressBar } from './ProgressBar';
import { formatMonthDay } from '@/server/dateUtil';
import styles from './BookCard.module.css';

export function BookCard({
  bookId,
  title,
  authors,
  pageCount,
  currentPage,
  startedAt,
  noteCount,
  latestNote,
  coverVersion,
}: {
  bookId: string;
  title: string;
  authors: string[];
  pageCount: number | null;
  currentPage: number;
  startedAt: string | null;
  noteCount: number;
  latestNote: { body: string; kind: string } | null;
  coverVersion?: string | null;
}) {
  return (
    <Link href={`/book/${bookId}`} className={styles.card}>
      <BookSpine title={title} bookId={bookId} size="md" coverVersion={coverVersion} />
      <div className={styles.body}>
        <div>
          <div className={styles.title}>{title}</div>
          <div className={styles.author}>{authors.join(', ')}</div>
          {latestNote && latestNote.kind === 'quote' ? (
            <div className={styles.quote}>&ldquo;{latestNote.body}&rdquo;</div>
          ) : (
            <div className={styles.meta}>
              {noteCount > 0 && (
                <>
                  <span className={styles.metaItalic}>
                    {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                  </span>
                  {startedAt && <span className={styles.dot}>·</span>}
                </>
              )}
              {startedAt && (
                <span className={styles.metaPlain}>started {formatMonthDay(startedAt)}</span>
              )}
            </div>
          )}
        </div>
        <div className={styles.progress}>
          <ProgressBar currentPage={currentPage} pageCount={pageCount} />
        </div>
        <span className={styles.cta}>+ log pages</span>
      </div>
    </Link>
  );
}
