import type { BookStatus } from '@/server/types';
import styles from './StatusBadge.module.css';

export function StatusBadge({ status }: { status: BookStatus }) {
  return <span className={styles.badge}>{status}</span>;
}
