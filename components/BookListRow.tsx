import Link from 'next/link';
import { BookSpine } from './BookSpine';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import type { Book } from '@/server/schema';
import type { BookStatus } from '@/server/types';
import styles from './BookListRow.module.css';

export function BookListRow({
  book,
  authors,
  currentPage,
}: {
  book: Book;
  authors: string[];
  currentPage: number;
}) {
  return (
    <Link href={`/book/${book.id}`} className={styles.row}>
      <BookSpine
        title={book.title}
        bookId={book.id}
        size="sm"
        coverVersion={book.coverPath ? book.updatedAt : null}
      />
      <div className={styles.body}>
        <div className={styles.title}>{book.title}</div>
        <div className={styles.author}>{authors.join(', ')}</div>
        {book.status === 'reading' && (
          <div className={styles.progress}>
            <ProgressBar currentPage={currentPage} pageCount={book.pageCount} />
          </div>
        )}
      </div>
      <div className={styles.badge}>
        <StatusBadge status={book.status as BookStatus} />
      </div>
    </Link>
  );
}
