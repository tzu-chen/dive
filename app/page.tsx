import Link from 'next/link';
import { getCaller } from '@/server/caller';
import { MetricCard } from '@/components/MetricCard';
import { BookCard } from '@/components/BookCard';
import { UpNextSpine } from '@/components/UpNextSpine';
import { StreakDots } from '@/components/StreakDots';
import { formatLong, parseISODate } from '@/server/dateUtil';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const caller = getCaller();
  const data = await caller.stats.dashboard();
  const todayLong = formatLong(parseISODate(data.today));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>The Reading Room</h1>
          <p className={styles.subtitle}>{todayLong}</p>
        </div>
        <Link href="/add" className={styles.addLink}>+ add a book</Link>
      </header>

      <div className={styles.streakRow}>
        <StreakDots days={data.last7Days} />
      </div>

      <div className={styles.metrics}>
        <MetricCard
          label="streak"
          value={data.streak}
          unit="days"
          highlighted={data.streak > 0}
        />
        <MetricCard
          label="today"
          value={data.todayPages}
          unit={`/ ${data.dailyGoal} pp`}
          highlighted={data.todayPages >= data.dailyGoal}
        />
        <MetricCard
          label="this year"
          value={data.booksFinishedThisYear}
          unit={`/ ${data.yearlyGoal}`}
          highlighted={data.booksFinishedThisYear >= data.yearlyGoal}
        />
        <Link href="/library" className={styles.libraryMetric} aria-label="open the library">
          <MetricCard label="library" value={data.libraryCount} unit="books" />
        </Link>
      </div>

      <h2 className={styles.section}>Currently reading</h2>
      {data.currentlyReading.length === 0 ? (
        <p className={styles.empty}>
          nothing on the nightstand. <Link href="/add" className={styles.inlineLink}>add a book</Link> to get going.
        </p>
      ) : (
        data.currentlyReading.map((b) => (
          <BookCard
            key={b.id}
            bookId={b.id}
            title={b.title}
            authors={JSON.parse(b.authors) as string[]}
            pageCount={b.pageCount}
            currentPage={b.currentPage}
            startedAt={b.startedAt}
            noteCount={0}
            latestNote={b.latestNote}
            coverVersion={b.coverPath ? b.updatedAt : null}
          />
        ))
      )}

      {data.upNext.length > 0 && (
        <>
          <h2 className={styles.section}>Up next</h2>
          <div className={styles.upNext}>
            {data.upNext.map((b) => (
              <UpNextSpine
                key={b.id}
                bookId={b.id}
                title={b.title}
                authors={JSON.parse(b.authors) as string[]}
                coverVersion={b.coverPath ? b.updatedAt : null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
