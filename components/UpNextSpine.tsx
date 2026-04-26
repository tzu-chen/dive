import Link from 'next/link';
import { BookSpine } from './BookSpine';
import styles from './UpNextSpine.module.css';

export function UpNextSpine({
  bookId,
  title,
  authors,
  hasCover,
}: {
  bookId: string;
  title: string;
  authors: string[];
  hasCover?: boolean;
}) {
  const lastName = authors[0]?.split(' ').pop() ?? '';
  return (
    <Link href={`/book/${bookId}`} className={styles.cell}>
      <div className={styles.spineWrap}>
        <BookSpine title={title} bookId={bookId} size="fluid" hasCover={hasCover} />
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.author}>{lastName}</div>
    </Link>
  );
}
