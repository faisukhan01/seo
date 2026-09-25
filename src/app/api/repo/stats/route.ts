// GET /api/repo/stats — aggregate stats about the cloned OpenSEO repository.

import fs from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import type { CommitInfo, RepoStats } from '@/lib/repo-types';
import {
  HIDDEN_SEGMENTS,
  REPO_ROOT,
  execGit,
  extOf,
  gitErrorMessage,
} from '@/lib/repo-server';

export const dynamic = 'force-dynamic';

interface ExtAccum {
  files: number;
  bytes: number;
}

interface WalkAccum {
  fileCount: number;
  dirCount: number;
  totalBytes: number;
  exts: Map<string, ExtAccum>;
  topLevel: Map<string, ExtAccum>;
}

const TOP_DIR_DESCRIPTIONS: Record<string, string> = {
  src: 'Main application: SEO workflows, MCP server, auth, billing',
  web: 'Marketing site openseo.so: docs, blog, free SEO tools',
  badseo: 'Deliberately bad-SEO fixture site for audit testing',
  e2e: 'Playwright end-to-end tests',
  scripts: 'Ops, seed, migration and release scripts',
  docs: 'Self-hosting & development documentation',
  'release-notes': 'Versioned release notes (v0.0.2 → v0.1.9)',
  plugins: 'Claude Code plugin with agent skills',
};

const TOP_DIR_ORDER = [
  'src',
  'web',
  'badseo',
  'e2e',
  'scripts',
  'docs',
  'release-notes',
  'plugins',
];

async function walk(dir: string, rel: string, topLevel: string | null, acc: WalkAccum): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (HIDDEN_SEGMENTS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      acc.dirCount += 1;
      await walk(abs, rel ? `${rel}/${entry.name}` : entry.name, topLevel ?? entry.name, acc);
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = (await fs.stat(abs)).size;
      } catch {
        continue; // vanished mid-walk; ignore
      }
      acc.fileCount += 1;
      acc.totalBytes += size;

      const extKey = extOf(entry.name) || 'no-ext';
      const extAcc = acc.exts.get(extKey) ?? { files: 0, bytes: 0 };
      extAcc.files += 1;
      extAcc.bytes += size;
      acc.exts.set(extKey, extAcc);

      if (topLevel !== null) {
        const topAcc = acc.topLevel.get(topLevel) ?? { files: 0, bytes: 0 };
        topAcc.files += 1;
        topAcc.bytes += size;
        acc.topLevel.set(topLevel, topAcc);
      }
    }
    // symlinks & special files are skipped intentionally (no escapes, no cycles)
  }
}

async function dirExists(name: string): Promise<boolean> {
  try {
    return (await fs.stat(path.join(REPO_ROOT, name))).isDirectory();
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse<RepoStats | { error: string }>> {
  try {
    const acc: WalkAccum = {
      fileCount: 0,
      dirCount: 0,
      totalBytes: 0,
      exts: new Map(),
      topLevel: new Map(),
    };
    await walk(REPO_ROOT, '', null, acc);

    const languages = [...acc.exts.entries()]
      .map(([ext, v]) => ({ ext, files: v.files, bytes: v.bytes }))
      .sort((a, b) => b.bytes - a.bytes || b.files - a.files)
      .slice(0, 12);

    const topDirPresence = await Promise.all(TOP_DIR_ORDER.map((name) => dirExists(name)));
    const topDirs = TOP_DIR_ORDER.flatMap((name, i) => {
      if (!topDirPresence[i]) return [];
      const v = acc.topLevel.get(name) ?? { files: 0, bytes: 0 };
      return [{ name, files: v.files, bytes: v.bytes, description: TOP_DIR_DESCRIPTIONS[name] }];
    });

    const [branchRes, remoteRes, countRes, latestRes, authorsRes] = await Promise.all([
      execGit(['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => 'unknown'),
      execGit(['config', '--get', 'remote.origin.url']).catch(
        () => 'https://github.com/every-app/open-seo.git',
      ),
      execGit(['rev-list', '--count', 'HEAD']).catch(() => '0'),
      execGit(['log', '-1', '--pretty=format:%H|%an|%ae|%aI|%s']).catch(() => ''),
      execGit(['log', '--pretty=format:%an']).catch(() => ''),
    ]);

    const latestParts = latestRes.trim() === '' ? [] : latestRes.split('|');
    let latestCommit: CommitInfo;
    if (latestParts.length >= 5) {
      latestCommit = {
        hash: latestParts[0],
        shortHash: latestParts[0].slice(0, 7),
        author: latestParts[1],
        email: latestParts[2],
        date: latestParts[3],
        subject: latestParts.slice(4).join('|'),
      };
    } else {
      latestCommit = { hash: '', shortHash: '', author: '', email: '', date: '', subject: '' };
    }

    const counts = new Map<string, number>();
    for (const line of authorsRes.split('\n')) {
      const name = line.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const contributors = [...counts.entries()]
      .map(([name, commits]) => ({ name, commits }))
      .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
      .slice(0, 10);

    const stats: RepoStats = {
      fileCount: acc.fileCount,
      dirCount: acc.dirCount,
      totalBytes: acc.totalBytes,
      commitCount: Number.parseInt(countRes.trim(), 10) || 0,
      branch: branchRes.trim() || 'unknown',
      remoteUrl: remoteRes.trim() || 'https://github.com/every-app/open-seo.git',
      latestCommit,
      contributors,
      languages,
      topDirs,
    };
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: gitErrorMessage(err, 'Failed to compute repository stats') },
      { status: 500 },
    );
  }
}
