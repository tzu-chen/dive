export const SPINE_COUNT = 8;

export function spineIndex(bookId: string): number {
  let hash = 0;
  for (let i = 0; i < bookId.length; i++) {
    hash = (hash * 31 + bookId.charCodeAt(i)) >>> 0;
  }
  return (hash % SPINE_COUNT) + 1;
}

export function spineVars(bookId: string): { ['--spine-bg']: string; ['--spine-fg']: string } {
  const i = spineIndex(bookId);
  return {
    ['--spine-bg']: `var(--spine-${i}-bg)`,
    ['--spine-fg']: `var(--spine-${i}-fg)`,
  };
}
