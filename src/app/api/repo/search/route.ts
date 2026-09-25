// GET /api/repo/search?q=<query>&mode=content|files — ripgrep-backed repo search.

import fs from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { SearchResponse, SearchResult } from '@/lib/repo-types';
import { REPO_ROOT } from '@/lib/repo-server';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const RG_BIN = '/usr/bin/rg';
const MAX_RESULTS = 200;
const MAX_FILE_STATS = 500;

const EXCLUDE_GLOBS = [
  '-g',
  '!.git/**',
  '-g',
  '!node_modules/**',
  '-g',
  '!.next/**',
  '-g',
  '!.wrangler/**',
  '-g',
  '!dist/**',
];

interface RgFailure extends Error {
  code?: number | string;
  stdout?: string;
}

function toRepoRelative(p: string): string {
  if (path.isAbsolute(p)) {
    const rel = path.relative(REPO_ROOT, p);
    if (rel && !rel.startsWith('..')) return rel.split(path.sep).join('/');
  }
  return p.split(path.sep).join('/');
}

async function runRg(args: string[]): Promise<{ stdout: string; code: number }> {
  try {
    const { stdout } = await execFileAsync(RG_BIN, args, {
      cwd: REPO_ROOT,
      maxBuffer: 20 * 1024 * 1024,
    });
    return { stdout, code: 0 };
  } catch (err) {
    const failure = err as RgFailure;
    const code = typeof failure.code === 'number' ? failure.code : 2;
    // rg exit code 1 = no matches (not an error); anything else is a real failure.
    return { stdout: failure.stdout ?? '', code };
  }
}

async function searchContent(query: string): Promise<Omit<SearchResponse, 'query' | 'mode'>> {
  const args = [
    '-n',
    '--no-heading',
    '--fixed-strings',
    '-m',
    '3',
    '--max-columns',
    '300',
    '--hidden',
    ...EXCLUDE_GLOBS,
    '--',
    query,
  ];
  const { stdout, code } = await runRg(args);
  if (code >= 2) {
    throw new Error('ripgrep failed');
  }

  const results: SearchResult[] = [];
  for (const line of stdout.split('\n')) {
    if (!line) continue;
    const match = /^(.+?):(\d+):(.*)$/.exec(line);
    if (!match) continue;
    results.push({
      path: toRepoRelative(match[1]),
      line: Number.parseInt(match[2], 10) || 0,
      text: match[3].trim().slice(0, 300),
    });
    if (results.length >= MAX_RESULTS) break;
  }
  return {
    totalMatches: results.length,
    truncated: results.length >= MAX_RESULTS,
    results,
    files: [],
  };
}

async function searchFiles(query: string): Promise<Omit<SearchResponse, 'query' | 'mode'>> {
  const args = ['--files', '--hidden', ...EXCLUDE_GLOBS];
  const { stdout, code } = await runRg(args);
  if (code >= 2) {
    throw new Error('ripgrep failed');
  }

  const needle = query.toLowerCase();
  const candidates: string[] = [];
  for (const line of stdout.split('\n')) {
    const p = line.trim();
    if (!p) continue;
    const rel = toRepoRelative(p);
    const base = rel.slice(rel.lastIndexOf('/') + 1);
    if (base.toLowerCase().includes(needle) || rel.toLowerCase().includes(needle)) {
      candidates.push(rel);
      if (candidates.length >= MAX_FILE_STATS) break;
    }
  }

  const files: { path: string; size: number }[] = [];
  await Promise.all(
    candidates.map(async (rel) => {
      try {
        const st = await fs.stat(path.join(REPO_ROOT, rel));
        files.push({ path: rel, size: st.size });
      } catch {
        // skip entries that vanish or fail to stat
      }
    }),
  );
  files.sort((a, b) => a.path.localeCompare(b.path));
  const capped = files.slice(0, MAX_RESULTS);
  return {
    totalMatches: capped.length,
    truncated: files.length > MAX_RESULTS,
    results: [],
    files: capped,
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<SearchResponse | { error: string }>> {
  try {
    const params = request.nextUrl.searchParams;
    const q = params.get('q') ?? '';
    const mode = params.get('mode') === 'files' ? 'files' : 'content';

    if (q.length < 1 || q.length > 200) {
      return NextResponse.json({ error: 'Query must be 1..200 characters' }, { status: 400 });
    }

    const body = mode === 'files' ? await searchFiles(q) : await searchContent(q);
    const response: SearchResponse = { query: q, mode, ...body };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
