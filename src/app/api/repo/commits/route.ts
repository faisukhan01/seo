// GET /api/repo/commits?limit=<1..200, default 50> — recent commit history.

import { NextRequest, NextResponse } from 'next/server';

import type { CommitInfo, CommitsResponse } from '@/lib/repo-types';
import { execGit, gitErrorMessage, parseCommitFields } from '@/lib/repo-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<CommitsResponse | { error: string }>> {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    let limit = 50;
    if (limitParam !== null) {
      const parsed = Number.parseInt(limitParam, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 200) {
        return NextResponse.json({ error: 'limit must be an integer between 1 and 200' }, { status: 400 });
      }
      limit = parsed;
    }

    const stdout = await execGit([
      'log',
      '-n',
      String(limit),
      '--pretty=format:%H|%h|%an|%ae|%aI|%s',
    ]);

    const commits: CommitInfo[] = stdout
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => parseCommitFields(line.split('|')));

    return NextResponse.json({ commits } satisfies CommitsResponse);
  } catch (err) {
    return NextResponse.json(
      { error: gitErrorMessage(err, 'Failed to read commit history') },
      { status: 500 },
    );
  }
}
