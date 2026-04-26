'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import styles from './RefetchCoverButton.module.css';

type Props = {
  bookId: string;
  hasCover: boolean;
};

export function RefetchCoverButton({ bookId, hasCover }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refetch = trpc.books.refetchCover.useMutation({
    onSuccess: (res) => {
      if (res.coverPath) {
        setMessage('cover found');
        router.refresh();
      } else {
        setMessage('no match on open library');
      }
    },
    onError: (err) => setMessage(err.message),
  });

  const remove = trpc.books.removeCover.useMutation({
    onSuccess: () => {
      setMessage('cover removed');
      router.refresh();
    },
    onError: (err) => setMessage(err.message),
  });

  const onFile = async (file: File) => {
    setMessage(null);
    setUploading(true);
    try {
      const res = await fetch(`/api/covers/${bookId}`, {
        method: 'POST',
        headers: { 'content-type': 'image/jpeg' },
        body: file,
      });
      if (!res.ok) {
        setMessage(`upload failed (${res.status})`);
        return;
      }
      setMessage('cover uploaded');
      router.refresh();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const busy = refetch.isPending || remove.isPending || uploading;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            setMessage(null);
            refetch.mutate({ id: bookId });
          }}
          disabled={busy}
        >
          {refetch.isPending ? 'fetching cover...' : 'refetch cover'}
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={() => fileInput.current?.click()}
          disabled={busy}
        >
          {uploading ? 'uploading...' : 'upload jpg'}
        </button>
        {hasCover && (
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setMessage(null);
              remove.mutate({ id: bookId });
            }}
            disabled={busy}
          >
            {remove.isPending ? 'removing...' : 'remove cover'}
          </button>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg"
        className={styles.fileInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void onFile(file);
        }}
      />
      {message && <span className={styles.status}>{message}</span>}
    </div>
  );
}
