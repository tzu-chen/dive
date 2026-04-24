import { spineVars } from '@/lib/spineColor';
import styles from './BookSpine.module.css';

type Size = 'sm' | 'md' | 'lg' | 'fluid';

export function BookSpine({
  title,
  bookId,
  size = 'md',
  progress,
}: {
  title: string;
  bookId: string;
  size?: Size;
  progress?: number;
}) {
  return (
    <div
      className={`${styles.spine} ${styles[size]}`}
      style={spineVars(bookId) as React.CSSProperties}
    >
      <div className={styles.highlight} />
      <div className={styles.title}>{title}</div>
      {typeof progress === 'number' && (
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
