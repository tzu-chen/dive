'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import type { BookStatus } from '@/server/types';
import styles from './StatusActions.module.css';

const ACTIONS: { status: BookStatus; label: string }[] = [
  { status: 'reading', label: 'mark reading' },
  { status: 'finished', label: 'mark finished' },
  { status: 'abandoned', label: 'abandon' },
];

export function StatusActions({ bookId, current }: { bookId: string; current: BookStatus }) {
  const router = useRouter();
  const mutation = trpc.books.updateStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className={styles.actions}>
      {ACTIONS.filter((a) => a.status !== current).map((a) => (
        <button
          key={a.status}
          type="button"
          className={styles.pill}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ id: bookId, status: a.status })}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
