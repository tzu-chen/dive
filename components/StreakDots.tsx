import styles from './StreakDots.module.css';

export function StreakDots({ days }: { days: boolean[] }) {
  return (
    <div className={styles.dots}>
      {days.map((active, i) => {
        const isToday = i === days.length - 1;
        const cls = isToday
          ? styles.today
          : active
            ? styles.active
            : styles.empty;
        return <div key={i} className={`${styles.dot} ${cls}`} />;
      })}
    </div>
  );
}
