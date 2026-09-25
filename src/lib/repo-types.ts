// Shared types for the OpenSEO repository explorer APIs.
// Contract used by both backend (/api/repo/*) and frontend (Explorer UI).

export interface CommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string; // ISO timestamp
  subject: string;
}

export interface RepoStats {
  fileCount: number;
  dirCount: number;
  totalBytes: number;
  commitCount: number;
  branch: string;
  remoteUrl: string;
  latestCommit: CommitInfo;
  contributors: { name: string; commits: number }[];
  languages: { ext: string; files: number; bytes: number }[];
  topDirs: { name: string; files: number; bytes: number; description: string }[];
}

export interface TreeNode {
  name: string;
  path: string; // relative to repo root, "/" separated
  type: "file" | "dir";
  size?: number; // files only, bytes
  childCount?: number; // dirs only: number of immediate children
}

export interface FileContent {
  path: string;
  size: number;
  lines: number;
  language: string; // "typescript" | "markdown" | "json" | ...
  isBinary: boolean;
  isImage: boolean;
  truncated: boolean;
  content: string; // empty string for binary/image
}

export interface SearchResult {
  path: string;
  line: number;
  text: string; // trimmed match line, max ~300 chars
}

export interface SearchResponse {
  query: string;
  mode: "content" | "files";
  totalMatches: number;
  truncated: boolean;
  results: SearchResult[]; // content mode (max 200)
  files: { path: string; size: number }[]; // files mode (max 200)
}

export interface TreeResponse {
  path: string;
  nodes: TreeNode[];
}

export interface CommitsResponse {
  commits: CommitInfo[];
}

export interface ApiError {
  error: string;
}
