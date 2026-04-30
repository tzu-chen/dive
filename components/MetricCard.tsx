import styles from './MetricCard.module.css';

export function MetricCard({
  label,
  value,
  unit,
  highlighted = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`${styles.card} ${highlighted ? styles.highlighted : ''}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        {value}
        {unit && <span className={styles.unit}> {unit}</span>}
      </div>
    </div>
  );
}
