// GET /api/repo/tree?path=<relative dir> — list immediate children of a directory.

import fs from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import type { TreeNode, TreeResponse } from '@/lib/repo-types';
import {
  HIDDEN_SEGMENTS,
  gitErrorMessage,
  resolveSafePath,
  toRepoRel,
} from '@/lib/repo-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<TreeResponse | { error: string }>> {
  try {
    const relParam = request.nextUrl.searchParams.get('path');

    const abs = await resolveSafePath(relParam);
    if (abs === null) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    let st;
    try {
      st = await fs.stat(abs);
    } catch {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }
    if (!st.isDirectory()) {
      return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }

    const entries = await fs.readdir(abs, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      if (HIDDEN_SEGMENTS.has(entry.name)) continue;
      const childAbs = path.join(abs, entry.name);
      const childRel = relParam && relParam !== '' ? `${relParam}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        let childCount = 0;
        try {
          const children = await fs.readdir(childAbs, { withFileTypes: true });
          childCount = children.filter((c) => !HIDDEN_SEGMENTS.has(c.name)).length;
        } catch {
          childCount = 0;
        }
        nodes.push({ name: entry.name, path: childRel, type: 'dir', childCount });
      } else if (entry.isFile()) {
        let size = 0;
        try {
          size = (await fs.stat(childAbs)).size;
        } catch {
          size = 0;
        }
        nodes.push({ name: entry.name, path: childRel, type: 'file', size });
      }
      // symlinks & special files are skipped intentionally
    }

    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
    });

    const responsePath = toRepoRel(abs);
    return NextResponse.json({ path: responsePath, nodes } satisfies TreeResponse);
  } catch (err) {
    return NextResponse.json(
      { error: gitErrorMessage(err, 'Failed to list directory') },
      { status: 500 },
    );
  }
}
