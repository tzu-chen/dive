import { spineVars } from '@/lib/spineColor';
import styles from './BookSpine.module.css';

type Size = 'sm' | 'md' | 'lg' | 'fluid';

export function BookSpine({
  title,
  bookId,
  size = 'md',
}: {
  title: string;
  bookId: string;
  size?: Size;
}) {
  return (
    <div
      className={`${styles.spine} ${styles[size]}`}
      style={spineVars(bookId) as React.CSSProperties}
    >
      <div className={styles.highlight} />
      <div className={styles.title}>{title}</div>
    </div>
  );
}
