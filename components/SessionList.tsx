'use client';

import { useState } from 'react';
import { formatMonthDay } from '@/server/dateUtil';
import type { Session } from '@/server/schema';
import styles from './SessionList.module.css';

export function SessionList({ sessions }: { sessions: Session[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (sessions.length === 0) {
    return <div className={styles.empty}>no sessions yet — log one to get started.</div>;
  }

  const groups = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = groups.get(s.readOn) ?? [];
    list.push(s);
    groups.set(s.readOn, list);
  }

  const days = Array.from(groups.entries()).sort(([a], [b]) => (a < b ? 1 : -1));

  return (
    <div className={styles.list}>
      {days.map(([day, daySessions]) => {
        const ordered = [...daySessions].sort((a, b) =>
          a.createdAt < b.createdAt ? -1 : 1,
        );
        const totalPages = ordered.reduce((sum, s) => sum + (s.endPage - s.startPage), 0);
        const minStart = Math.min(...ordered.map((s) => s.startPage));
        const maxEnd = Math.max(...ordered.map((s) => s.endPage));
        const isOpen = expanded[day] ?? false;
        const count = ordered.length;

        return (
          <div key={day} className={styles.row}>
            <button
              type="button"
              className={styles.header}
              onClick={() => setExpanded((prev) => ({ ...prev, [day]: !prev[day] }))}
              aria-expanded={isOpen}
            >
              <span className={styles.date}>
                <span className={styles.caret}>{isOpen ? '▾' : '▸'}</span>
                {formatMonthDay(day)}
                {count > 1 && <span className={styles.count}> · {count} sessions</span>}
              </span>
              <span>
                p. {minStart} → {maxEnd} · {totalPages}pp
              </span>
            </button>
            {isOpen && (
              <div className={styles.sessions}>
                {ordered.map((s) => {
                  const pages = s.endPage - s.startPage;
                  return (
                    <div key={s.id} className={styles.session}>
                      <div className={styles.sessionHeader}>
                        <span>
                          p. {s.startPage} → {s.endPage} · {pages}pp
                        </span>
                      </div>
                      {s.note && <div className={styles.note}>{s.note}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
