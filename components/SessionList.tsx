import { formatMonthDay } from '@/server/dateUtil';
import type { Session } from '@/server/schema';
import styles from './SessionList.module.css';

export function SessionList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <div className={styles.empty}>no sessions yet — log one to get started.</div>;
  }
  return (
    <div className={styles.list}>
      {sessions.map((s) => {
        const pages = s.endPage - s.startPage;
        return (
          <div key={s.id} className={styles.row}>
            <span className={styles.date}>{formatMonthDay(s.readOn)}</span>
            <span>
              p. {s.startPage} → {s.endPage} · {pages}pp
            </span>
          </div>
        );
      })}
    </div>
  );
}
