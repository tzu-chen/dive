'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import styles from './SessionForm.module.css';

export function SessionForm({
  bookId,
  today,
  currentPage,
}: {
  bookId: string;
  today: string;
  currentPage: number;
}) {
  const router = useRouter();
  const [readOn, setReadOn] = useState(today);
  const [endPage, setEndPage] = useState<string>(String(currentPage));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      setNote('');
      setError(null);
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(endPage);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Enter a valid page number.');
      return;
    }
    mutation.mutate({
      bookId,
      readOn,
      endPage: parsed,
      note: note.trim() || null,
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <input
          type="date"
          className={styles.date}
          value={readOn}
          onChange={(e) => setReadOn(e.target.value)}
        />
        <input
          type="number"
          inputMode="numeric"
          className={styles.page}
          placeholder="read to page..."
          value={endPage}
          onChange={(e) => setEndPage(e.target.value)}
          min={0}
        />
      </div>
      <textarea
        className={styles.note}
        placeholder="notes, quotes, thoughts... (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
      />
      {error && <div className={styles.error}>{error}</div>}
      <button type="submit" className={styles.save} disabled={mutation.isPending}>
        {mutation.isPending ? 'saving...' : 'save session'}
      </button>
    </form>
  );
}
