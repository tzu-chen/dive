'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookSpine } from './BookSpine';
import { progressPercent } from '@/server/stats';
import styles from './LibraryView.module.css';

const MONTH_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

export type LibraryBook = {
  id: string;
  title: string;
  authors: string[];
  status: 'want' | 'owned' | 'reading' | 'finished' | 'abandoned';
  pageCount: number | null;
  currentPage: number;
  finishedAt: string | null;
  updatedAt: string;
};

type SortKey = 'recent' | 'title' | 'author';
const INITIAL_LIMIT = 8;

export function LibraryView({ books }: { books: LibraryBook[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [year, setYear] = useState<number | 'all'>(() => {
    for (const b of books) {
      if (b.status === 'finished' && b.finishedAt) {
        return Number(b.finishedAt.slice(0, 4));
      }
    }
    return new Date().getFullYear();
  });
  const [showAllWant, setShowAllWant] = useState(false);
  const [showAllOwned, setShowAllOwned] = useState(false);
  const [showAllFinished, setShowAllFinished] = useState(false);
  const [showSetAside, setShowSetAside] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.authors.some((a) => a.toLowerCase().includes(q)),
    );
  }, [books, query]);

  const sortBooks = (list: LibraryBook[]) => {
    const arr = [...list];
    if (sort === 'title') {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'author') {
      arr.sort((a, b) => (a.authors[0] ?? '').localeCompare(b.authors[0] ?? ''));
    } else {
      arr.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    return arr;
  };

  const reading = sortBooks(filtered.filter((b) => b.status === 'reading'));
  const owned = sortBooks(filtered.filter((b) => b.status === 'owned'));
  const want = sortBooks(filtered.filter((b) => b.status === 'want'));
  const abandoned = sortBooks(filtered.filter((b) => b.status === 'abandoned'));

  const finishedAll = filtered.filter((b) => b.status === 'finished');
  const finishedYears = Array.from(
    new Set(
      books
        .filter((b) => b.status === 'finished' && b.finishedAt)
        .map((b) => Number(b.finishedAt!.slice(0, 4))),
    ),
  ).sort((a, b) => b - a);

  const finished = sortBooks(
    year === 'all'
      ? finishedAll
      : finishedAll.filter(
          (b) => b.finishedAt && Number(b.finishedAt.slice(0, 4)) === year,
        ),
  );

  const wantVisible = showAllWant ? want : want.slice(0, INITIAL_LIMIT);
  const ownedVisible = showAllOwned ? owned : owned.slice(0, INITIAL_LIMIT);
  const finishedVisible = showAllFinished
    ? finished
    : finished.slice(0, INITIAL_LIMIT);

  const totalCount = books.length;

  return (
    <>
      <div className={styles.toolbar}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search title or author..."
          className={styles.search}
        />
        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>sort by</span>
          {(['recent', 'title', 'author'] as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={`${styles.sortChip} ${sort === k ? styles.sortChipActive : ''}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <Section title="Reading" count={reading.length}>
        {reading.length === 0 ? (
          <p className={styles.empty}>nothing on the nightstand right now.</p>
        ) : (
          <div className={styles.grid}>
            {reading.map((b) => (
              <SpineCell
                key={b.id}
                book={b}
                progress={progressPercent(b.currentPage, b.pageCount)}
                meta={
                  b.pageCount
                    ? `${b.authors[0] ?? '—'} · ${Math.round(
                        progressPercent(b.currentPage, b.pageCount) * 100,
                      )}%`
                    : (b.authors[0] ?? '—')
                }
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="On the shelf" count={owned.length}>
        {owned.length === 0 ? (
          <p className={styles.empty}>nothing waiting on the shelf.</p>
        ) : (
          <>
            <div className={styles.grid}>
              {ownedVisible.map((b) => (
                <SpineCell key={b.id} book={b} meta={b.authors[0] ?? '—'} />
              ))}
            </div>
            {owned.length > INITIAL_LIMIT && (
              <div className={styles.showMoreRow}>
                <button
                  type="button"
                  onClick={() => setShowAllOwned((v) => !v)}
                  className={styles.showMore}
                >
                  {showAllOwned
                    ? 'show fewer ↑'
                    : `show ${owned.length - INITIAL_LIMIT} more ↓`}
                </button>
              </div>
            )}
          </>
        )}
      </Section>

      <Section title="Want to read" count={want.length}>
        {want.length === 0 ? (
          <p className={styles.empty}>nothing in the queue.</p>
        ) : (
          <>
            <div className={styles.grid}>
              {wantVisible.map((b) => (
                <SpineCell key={b.id} book={b} meta={b.authors[0] ?? '—'} />
              ))}
            </div>
            {want.length > INITIAL_LIMIT && (
              <div className={styles.showMoreRow}>
                <button
                  type="button"
                  onClick={() => setShowAllWant((v) => !v)}
                  className={styles.showMore}
                >
                  {showAllWant
                    ? 'show fewer ↑'
                    : `show ${want.length - INITIAL_LIMIT} more ↓`}
                </button>
              </div>
            )}
          </>
        )}
      </Section>

      <SectionHeader title="Finished" count={finishedAll.length}>
        {finishedYears.length > 0 && (
          <div className={styles.yearGroup}>
            <span className={styles.sortLabel}>year</span>
            {finishedYears.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`${styles.yearChip} ${year === y ? styles.yearChipActive : ''}`}
              >
                {y}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setYear('all')}
              className={`${styles.yearChip} ${year === 'all' ? styles.yearChipActive : ''}`}
            >
              all
            </button>
          </div>
        )}
      </SectionHeader>
      {finished.length === 0 ? (
        <p className={styles.empty}>none finished {year === 'all' ? 'yet' : `in ${year}`}.</p>
      ) : (
        <>
          <div className={`${styles.grid} ${styles.gridFinished}`}>
            {finishedVisible.map((b) => (
              <SpineCell
                key={b.id}
                book={b}
                meta={b.finishedAt ? `finished ${formatFinished(b.finishedAt)}` : 'finished'}
              />
            ))}
          </div>
          {finished.length > INITIAL_LIMIT && (
            <div className={styles.showMoreRow}>
              <button
                type="button"
                onClick={() => setShowAllFinished((v) => !v)}
                className={styles.showMore}
              >
                {showAllFinished
                  ? 'show fewer ↑'
                  : `show all ${finished.length} from ${year === 'all' ? 'every year' : year} ↓`}
              </button>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setShowSetAside((v) => !v)}
        className={styles.setAsideHeader}
      >
        <span className={styles.setAsideTitle}>
          Set aside <span className={styles.setAsideCount}>· {abandoned.length}</span>
        </span>
        <span className={styles.setAsideToggle}>
          {showSetAside ? 'collapse ↑' : 'expand ↓'}
        </span>
      </button>
      {showSetAside && abandoned.length > 0 && (
        <div className={`${styles.grid} ${styles.gridAbandoned}`}>
          {abandoned.map((b) => (
            <SpineCell key={b.id} book={b} meta={b.authors[0] ?? '—'} />
          ))}
        </div>
      )}
      {showSetAside && abandoned.length === 0 && (
        <p className={styles.empty}>none set aside.</p>
      )}

      {totalCount === 0 && (
        <p className={styles.empty}>
          no books yet. <Link href="/add" className={styles.inlineLink}>add one</Link>.
        </p>
      )}
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <SectionHeader title={title} count={count} />
      {children}
    </>
  );
}

function SectionHeader({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>
        {title} <span className={styles.sectionCount}>· {count}</span>
      </h2>
      {children}
    </div>
  );
}

function SpineCell({
  book,
  meta,
  progress,
}: {
  book: LibraryBook;
  meta: string;
  progress?: number;
}) {
  return (
    <Link href={`/book/${book.id}`} className={styles.cell}>
      <BookSpine
        title={book.title}
        bookId={book.id}
        size="fluid"
        progress={progress}
      />
      <div className={styles.cellTitle}>{book.title}</div>
      <div className={styles.cellMeta}>{meta}</div>
    </Link>
  );
}

function formatFinished(iso: string): string {
  const y = iso.slice(2, 4);
  const m = Number(iso.slice(5, 7)) - 1;
  return `${MONTH_SHORT[m] ?? ''} '${y}`;
}
