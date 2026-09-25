// Shared server-side utilities for the /api/repo/* repository explorer routes.
// READ ONLY: nothing here ever writes to REPO_ROOT.

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { CommitInfo } from '@/lib/repo-types';

const execFileAsync = promisify(execFile);

/** Absolute path to the cloned OpenSEO repository (READ ONLY). */
export const REPO_ROOT = '/home/z/my-project/open-seo';

/** Directory/file names never exposed via tree/search/stats. */
export const HIDDEN_SEGMENTS = new Set([
  '.git',
  'node_modules',
  '.next',
  '.wrangler',
  'dist',
  'dist-sourcemaps',
  '.turbo',
  '.logs',
  '.output',
]);

/** Maximum bytes read for file content preview (512 KB). */
export const MAX_FILE_BYTES = 512 * 1024;

let cachedRealRepoRoot: string | null = null;
async function getRealRepoRoot(): Promise<string> {
  if (cachedRealRepoRoot === null) {
    cachedRealRepoRoot = await fs.realpath(REPO_ROOT);
  }
  return cachedRealRepoRoot;
}

function hasGitSegment(relSegs: string[]): boolean {
  return relSegs.some((seg) => seg === '.git');
}

/**
 * Resolve a repo-relative path to an absolute path inside REPO_ROOT.
 * Returns null when the path is unsafe: absolute, contains "..", contains a
 * ".git" segment, or escapes REPO_ROOT (including through symlinks).
 * null/"" resolves to REPO_ROOT itself.
 */
export async function resolveSafePath(relPath: string | null): Promise<string | null> {
  if (relPath === null || relPath === '') return REPO_ROOT;
  if (relPath.includes('\0')) return null;
  if (path.isAbsolute(relPath)) return null;

  const normalized = path.normalize(relPath);
  const segs = normalized.split(path.sep).filter((s) => s.length > 0 && s !== '.');
  if (segs.length > 0 && segs.some((s) => s === '..')) return null;
  if (hasGitSegment(segs)) return null;

  const abs = path.resolve(REPO_ROOT, ...segs);
  const rel = path.relative(REPO_ROOT, abs);
  if (rel === '' || rel === '..' || rel.startsWith(`..${path.sep}`)) return null;
  if (hasGitSegment(rel.split(path.sep))) return null;

  // Symlink escape check: realpath the deepest existing ancestor and ensure it
  // still lands inside the real repo root and not inside a real .git dir.
  let probe = abs;
  for (;;) {
    try {
      const [real, realRoot] = await Promise.all([fs.realpath(probe), getRealRepoRoot()]);
      const realRel = path.relative(realRoot, real);
      if (realRel === '' || realRel === '..' || realRel.startsWith(`..${path.sep}`)) return null;
      if (hasGitSegment(realRel.split(path.sep))) return null;
      break;
    } catch {
      const parent = path.dirname(probe);
      if (parent === probe) return null; // hit filesystem root without resolving
      probe = parent;
    }
  }

  return abs;
}

/** Convert an absolute path inside REPO_ROOT back to a "/"-separated repo-relative path. */
export function toRepoRel(absPath: string): string {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/');
}

/** Run a git command inside REPO_ROOT and return stdout. */
export async function execGit(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: REPO_ROOT,
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout;
}

/** Lowercase extension without the leading dot ('' when the name has no extension). */
export function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

const EXT_LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  md: 'markdown',
  mdx: 'markdown',
  css: 'css',
  html: 'html',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  sql: 'sql',
  py: 'python',
  rs: 'rust',
  sh: 'bash',
  bash: 'bash',
  prisma: 'prisma',
  svg: 'xml',
  txt: 'text',
  lock: 'text',
};

/** Map a file extension (with or without leading dot) to a display language. */
export function extToLanguage(ext: string): string {
  const key = ext.replace(/^\./, '').toLowerCase();
  return EXT_LANGUAGE[key] ?? 'text';
}

export const IMAGE_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.bmp',
  '.avif',
]);

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
};

/** MIME type for a known image extension (ext includes the leading dot). */
export function contentTypeForImage(ext: string): string {
  return IMAGE_MIME[ext.toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Heuristic binary detection: scan the first 8 KB and treat any NUL byte as binary.
 */
export function isBinaryBuffer(buf: Buffer): boolean {
  const len = Math.min(buf.length, 8192);
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

/** Parse a `git log --pretty=format:` line split on '|' into a CommitInfo. */
export function parseCommitFields(parts: string[]): CommitInfo {
  return {
    hash: parts[0] ?? '',
    shortHash: parts[1] ?? '',
    author: parts[2] ?? '',
    email: parts[3] ?? '',
    date: parts[4] ?? '',
    subject: parts.slice(5).join('|'),
  };
}

export function gitErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    const firstLine = err.message.split('\n')[0]?.trim();
    if (firstLine) return firstLine.slice(0, 300);
  }
  return fallback;
}
