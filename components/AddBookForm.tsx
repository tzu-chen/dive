'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { bookStatusEnum, type BookStatus } from '@/server/types';
import styles from './AddBookForm.module.css';

const STATUSES: BookStatus[] = bookStatusEnum.options;

export function AddBookForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [isbn13, setIsbn13] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState<BookStatus>('want');
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.books.create.useMutation({
    onSuccess: (book) => router.push(`/book/${book.id}`),
    onError: (err) => setError(err.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }
    const authorList = authors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    const pageCountNum = pageCount.trim() ? Number(pageCount) : null;
    const yearNum = year.trim() ? Number(year) : null;
    mutation.mutate({
      title: trimmedTitle,
      authors: authorList,
      pageCount: pageCountNum && Number.isFinite(pageCountNum) && pageCountNum > 0 ? pageCountNum : null,
      isbn13: isbn13.trim() || null,
      publishedYear: yearNum && Number.isFinite(yearNum) ? yearNum : null,
      status,
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>title</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>authors <span className={styles.hint}>(comma separated)</span></span>
        <input
          className={styles.input}
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
        />
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>page count</span>
          <input
            type="number"
            inputMode="numeric"
            className={styles.input}
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            min={1}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>year</span>
          <input
            type="number"
            inputMode="numeric"
            className={styles.input}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>isbn-13 <span className={styles.hint}>(optional)</span></span>
        <input
          className={styles.input}
          value={isbn13}
          onChange={(e) => setIsbn13(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>status</span>
        <select
          className={styles.input}
          value={status}
          onChange={(e) => setStatus(e.target.value as BookStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      {error && <div className={styles.error}>{error}</div>}
      <button type="submit" className={styles.save} disabled={mutation.isPending}>
        {mutation.isPending ? 'adding...' : 'add to library'}
      </button>
    </form>
  );
}
