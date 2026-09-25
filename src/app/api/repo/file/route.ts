// GET /api/repo/file?path=<relative file> — text content preview (max 512 KB, binary-aware).

import fs from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import type { FileContent } from '@/lib/repo-types';
import {
  IMAGE_EXTS,
  MAX_FILE_BYTES,
  extToLanguage,
  gitErrorMessage,
  isBinaryBuffer,
  resolveSafePath,
  toRepoRel,
} from '@/lib/repo-server';

export const dynamic = 'force-dynamic';

/** Read at most `length` bytes from a file without loading the whole thing. */
async function readPrefix(abs: string, length: number): Promise<Buffer> {
  const fh = await fs.open(abs, 'r');
  try {
    const buf = Buffer.alloc(length);
    let read = 0;
    while (read < length) {
      const { bytesRead } = await fh.read(buf, read, length - read, read);
      if (bytesRead === 0) break;
      read += bytesRead;
    }
    return buf.subarray(0, read);
  } finally {
    await fh.close();
  }
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<FileContent | { error: string }>> {
  try {
    const relParam = request.nextUrl.searchParams.get('path');
    if (relParam === null || relParam === '') {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const abs = await resolveSafePath(relParam);
    if (abs === null) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (st.isDirectory()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const truncated = st.size > MAX_FILE_BYTES;
    const buf = truncated ? await readPrefix(abs, MAX_FILE_BYTES) : await fs.readFile(abs);

    const ext = path.extname(abs).toLowerCase();
    const isImage = IMAGE_EXTS.has(ext);
    const isBinary = isBinaryBuffer(buf);

    const content = isBinary ? '' : buf.toString('utf8');
    const fileContent: FileContent = {
      path: toRepoRel(abs),
      size: st.size,
      lines: isBinary ? 0 : content.split('\n').length,
      language: extToLanguage(ext),
      isBinary,
      isImage,
      truncated,
      content,
    };
    return NextResponse.json(fileContent);
  } catch (err) {
    return NextResponse.json(
      { error: gitErrorMessage(err, 'Failed to read file') },
      { status: 500 },
    );
  }
}
