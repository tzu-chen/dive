import styles from './ProgressBar.module.css';

export function ProgressBar({
  currentPage,
  pageCount,
}: {
  currentPage: number;
  pageCount: number | null | undefined;
}) {
  const total = pageCount && pageCount > 0 ? pageCount : null;
  const pct = total ? Math.min(1, Math.max(0, currentPage / total)) : 0;
  return (
    <div>
      <div className={styles.row}>
        <span>page {currentPage}{total ? ` of ${total}` : ''}</span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
