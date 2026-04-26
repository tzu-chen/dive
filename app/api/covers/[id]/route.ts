import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { coverFilePath } from '@/server/openlibrary';
import { db } from '@/server/db';
import { books } from '@/server/schema';
import { nowISO } from '@/server/dateUtil';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return new NextResponse('bad id', { status: 400 });
  }
  try {
    const buf = await fs.readFile(coverFilePath(id));
    return new NextResponse(buf, {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'private, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('not found', { status: 404 });
  }
}

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return new NextResponse('bad id', { status: 400 });
  }
  const existing = db.select().from(books).where(eq(books.id, id)).get();
  if (!existing) return new NextResponse('not found', { status: 404 });

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return new NextResponse('bad size', { status: 400 });
  }
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
    return new NextResponse('not a jpeg', { status: 400 });
  }

  const filePath = coverFilePath(id);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buf);

  db.update(books)
    .set({ coverPath: filePath, coverUrl: null, updatedAt: nowISO() })
    .where(eq(books.id, id))
    .run();

  return NextResponse.json({ ok: true });
}
