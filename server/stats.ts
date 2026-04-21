import type { Book, Session } from './schema';
import { addDaysISO, formatISODate, yearOf } from './dateUtil';

export function currentPage(sessions: Session[]): number {
  let max = 0;
  for (const s of sessions) {
    if (s.endPage > max) max = s.endPage;
  }
  return max;
}

export function progressPercent(current: number, pageCount: number | null | undefined): number {
  if (!pageCount || pageCount <= 0) return 0;
  const p = current / pageCount;
  if (p < 0) return 0;
  if (p > 1) return 1;
  return p;
}

export function dailyPages(sessions: Session[], date: string): number {
  let total = 0;
  for (const s of sessions) {
    if (s.readOn === date) total += s.endPage - s.startPage;
  }
  return total;
}

export function last7DaysActivity(sessions: Session[], today: string): boolean[] {
  const days: boolean[] = [];
  const set = new Set(sessions.map((s) => s.readOn));
  for (let offset = 6; offset >= 0; offset--) {
    days.push(set.has(addDaysISO(today, -offset)));
  }
  return days;
}

export function streak(sessions: Session[], today: string): number {
  const set = new Set(sessions.map((s) => s.readOn));
  // Per CLAUDE.md: don't break the streak until day's end. If today has no
  // session yet, anchor on yesterday.
  let cursor = set.has(today) ? today : addDaysISO(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = addDaysISO(cursor, -1);
  }
  return count;
}

export function booksFinishedThisYear(books: Book[], today: string): number {
  const year = yearOf(today);
  let count = 0;
  for (const b of books) {
    if (b.status === 'finished' && b.finishedAt && yearOf(b.finishedAt) === year) {
      count++;
    }
  }
  return count;
}

export function todayISOFromDate(d: Date): string {
  return formatISODate(d);
}
