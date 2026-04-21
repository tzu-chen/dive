'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import type { NoteKind } from '@/server/types';
import styles from './NoteForm.module.css';

export function NoteForm({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<NoteKind>('quote');
  const [body, setBody] = useState('');
  const [page, setPage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      setBody('');
      setPage('');
      setError(null);
      setOpen(false);
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  if (!open) {
    return (
      <button type="button" className={styles.toggle} onClick={() => setOpen(true)}>
        + add a note
      </button>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Write something first.');
      return;
    }
    const pageNum = page.trim() ? Number(page) : null;
    mutation.mutate({
      bookId,
      kind,
      body: trimmed,
      page: pageNum && Number.isFinite(pageNum) && pageNum > 0 ? pageNum : null,
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <select
          className={styles.kind}
          value={kind}
          onChange={(e) => setKind(e.target.value as NoteKind)}
        >
          <option value="quote">quote</option>
          <option value="thought">thought</option>
        </select>
        <input
          type="number"
          inputMode="numeric"
          className={styles.page}
          placeholder="page (optional)"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          min={1}
        />
      </div>
      <textarea
        className={styles.body}
        placeholder={kind === 'quote' ? 'paste the quote...' : 'jot a thought...'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
          cancel
        </button>
        <button type="submit" className={styles.save} disabled={mutation.isPending}>
          {mutation.isPending ? 'saving...' : 'save note'}
        </button>
      </div>
    </form>
  );
}
