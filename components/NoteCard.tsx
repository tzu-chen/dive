import { formatMonthDay } from '@/server/dateUtil';
import type { NoteKind } from '@/server/types';
import styles from './NoteCard.module.css';

export function NoteCard({
  kind,
  body,
  page,
  createdAt,
}: {
  kind: NoteKind;
  body: string;
  page: number | null;
  createdAt: string;
}) {
  return (
    <div className={styles.card}>
      <div className={kind === 'quote' ? styles.bodyQuote : styles.bodyThought}>
        {kind === 'quote' ? `"${body}"` : body}
      </div>
      <div className={styles.footer}>
        {page ? `page ${page} · ` : ''}
        {formatMonthDay(createdAt)}
      </div>
    </div>
  );
}
