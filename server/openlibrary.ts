import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? './data';
const COVERS_DIR = path.join(DATA_DIR, 'covers');

type SearchDoc = {
  cover_i?: number;
  cover_edition_key?: string;
  key?: string;
};

type SearchResponse = {
  docs?: SearchDoc[];
};

async function searchCoverId(title: string, authors: string[]): Promise<number | null> {
  const params = new URLSearchParams();
  params.set('title', title);
  const author = authors[0]?.trim();
  if (author) params.set('author', author);
  params.set('limit', '5');
  params.set('fields', 'cover_i,cover_edition_key,key');

  const url = `https://openlibrary.org/search.json?${params.toString()}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) return null;
  const json = (await res.json()) as SearchResponse;
  const withCover = json.docs?.find((d) => typeof d.cover_i === 'number');
  return withCover?.cover_i ?? null;
}

async function downloadCoverById(coverId: number, bookId: string): Promise<string | null> {
  const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) return null;

  await fs.mkdir(COVERS_DIR, { recursive: true });
  const filePath = path.join(COVERS_DIR, `${bookId}.jpg`);
  await fs.writeFile(filePath, buf);
  return filePath;
}

export async function fetchCoverForBook(
  bookId: string,
  title: string,
  authors: string[],
): Promise<string | null> {
  try {
    const coverId = await searchCoverId(title, authors);
    if (coverId === null) return null;
    return await downloadCoverById(coverId, bookId);
  } catch {
    return null;
  }
}

export function coverFilePath(bookId: string): string {
  return path.join(COVERS_DIR, `${bookId}.jpg`);
}

export async function deleteCoverFile(coverPath: string): Promise<void> {
  try {
    await fs.unlink(coverPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}
