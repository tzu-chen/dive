'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import styles from './BookEditForm.module.css';

type Props = {
  bookId: string;
  title: string;
  authors: string[];
  pageCount: number | null;
  isbn13: string | null;
  publishedYear: number | null;
  type: string | null;
  purchaseLocation: string | null;
  purchaseDate: string | null;
};

export function BookEditForm(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(props.title);
  const [authors, setAuthors] = useState(props.authors.join(', '));
  const [pageCount, setPageCount] = useState(props.pageCount?.toString() ?? '');
  const [isbn13, setIsbn13] = useState(props.isbn13 ?? '');
  const [year, setYear] = useState(props.publishedYear?.toString() ?? '');
  const [type, setType] = useState(props.type ?? '');
  const [purchaseLocation, setPurchaseLocation] = useState(props.purchaseLocation ?? '');
  const [purchaseDate, setPurchaseDate] = useState(props.purchaseDate ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.books.update.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  if (!open) {
    return (
      <button type="button" className={styles.toggle} onClick={() => setOpen(true)}>
        edit details
      </button>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }
    const authorList = authors.split(',').map((a) => a.trim()).filter(Boolean);
    const pageCountNum = pageCount.trim() ? Number(pageCount) : null;
    const yearNum = year.trim() ? Number(year) : null;
    mutation.mutate({
      id: props.bookId,
      title: trimmedTitle,
      authors: authorList,
      pageCount:
        pageCountNum && Number.isFinite(pageCountNum) && pageCountNum > 0 ? pageCountNum : null,
      isbn13: isbn13.trim() || null,
      publishedYear: yearNum && Number.isFinite(yearNum) ? yearNum : null,
      type: type.trim() || null,
      purchaseLocation: purchaseLocation.trim() || null,
      purchaseDate: purchaseDate.trim() || null,
    });
  };

  const onCancel = () => {
    setTitle(props.title);
    setAuthors(props.authors.join(', '));
    setPageCount(props.pageCount?.toString() ?? '');
    setIsbn13(props.isbn13 ?? '');
    setYear(props.publishedYear?.toString() ?? '');
    setType(props.type ?? '');
    setPurchaseLocation(props.purchaseLocation ?? '');
    setPurchaseDate(props.purchaseDate ?? '');
    setError(null);
    setOpen(false);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>title</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>
          authors <span className={styles.hint}>(comma separated)</span>
        </span>
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
        <span className={styles.label}>isbn-13</span>
        <input
          className={styles.input}
          value={isbn13}
          onChange={(e) => setIsbn13(e.target.value)}
        />
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>
            type <span className={styles.hint}>(fiction, poem, ...)</span>
          </span>
          <input
            className={styles.input}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>purchased at</span>
          <input
            className={styles.input}
            value={purchaseLocation}
            onChange={(e) => setPurchaseLocation(e.target.value)}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>purchase date</span>
        <input
          type="date"
          className={styles.input}
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </label>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <button type="submit" className={styles.save} disabled={mutation.isPending}>
          {mutation.isPending ? 'saving...' : 'save'}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          cancel
        </button>
      </div>
    </form>
  );
}
