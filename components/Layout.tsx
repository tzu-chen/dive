import Link from 'next/link';
import styles from './Layout.module.css';

const NAV = [
  { href: '/', label: 'now' },
  { href: '/library', label: 'library' },
  { href: '/library?status=want', label: 'queue' },
  { href: '/add', label: '+ add' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.outer}>
      <div className={styles.container}>{children}</div>
      <nav className={styles.bottomNav}>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={styles.navItem}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
