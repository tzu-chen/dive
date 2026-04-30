import Link from 'next/link';
import { BookSpine } from './BookSpine';
import styles from './UpNextSpine.module.css';

export function UpNextSpine({
  bookId,
  title,
  authors,
  coverVersion,
}: {
  bookId: string;
  title: string;
  authors: string[];
  coverVersion?: string | null;
}) {
  const lastName = authors[0]?.split(' ').pop() ?? '';
  return (
    <Link href={`/book/${bookId}`} className={styles.cell}>
      <div className={styles.spineWrap}>
        <BookSpine title={title} bookId={bookId} size="fluid" coverVersion={coverVersion} />
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.author}>{lastName}</div>
    </Link>
  );
}
