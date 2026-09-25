// GET /api/repo/raw?path=<relative image file> — stream raw bytes for image preview.

import fs from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { IMAGE_EXTS, contentTypeForImage, gitErrorMessage, resolveSafePath } from '@/lib/repo-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
): Promise<Response> {
  try {
    const relParam = request.nextUrl.searchParams.get('path');
    if (relParam === null || relParam === '') {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const abs = await resolveSafePath(relParam);
    if (abs === null) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const ext = path.extname(abs).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) {
      return NextResponse.json({ error: 'Not an image file' }, { status: 400 });
    }

    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (!st.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const data = await fs.readFile(abs);
    // Copy into a plain Uint8Array so the web Response body has a plain ArrayBuffer backing.
    const body = new Uint8Array(data);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentTypeForImage(ext),
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: gitErrorMessage(err, 'Failed to read image') },
      { status: 500 },
    );
  }
}
