import Link from 'next/link';
import { AddBookForm } from '@/components/AddBookForm';
import styles from './page.module.css';

export default function AddPage() {
  return (
    <div className={styles.page}>
      <Link href="/library" className={styles.back}>← back to the library</Link>
      <h1 className={styles.title}>Add a book</h1>
      <p className={styles.subtitle}>
        manual entry — autocomplete arrives in a future pass.
      </p>
      <AddBookForm />
    </div>
  );
}
