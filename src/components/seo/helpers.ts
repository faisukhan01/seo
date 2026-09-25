"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── score → color mapping (emerald / amber / red) ───────────────────────

export function scoreHex(score: number): string {
  if (score >= 80) return "#10b981"; // emerald-500
  if (score >= 60) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

export function scoreTextClass(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function scoreBarClass(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function scoreBadgeClass(score: number): string {
  if (score >= 80)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (score >= 60)
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
}

export const SEVERITY_BADGE_CLASS: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

// ─── formatting helpers ──────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSeconds < 45) return "just now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function truncateMiddle(text: string, max = 56): string {
  if (text.length <= max) return text;
  const half = Math.floor((max - 1) / 2);
  return `${text.slice(0, half)}…${text.slice(text.length - half)}`;
}

// ─── clipboard hook with check feedback ──────────────────────────────────

export function useCopy(resetAfterMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetAfterMs);
      } catch {
        // clipboard unavailable — no feedback
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}

// ─── rotating status messages while the audit runs ───────────────────────

export const AUDIT_STATUS_MESSAGES = [
  "Crawling pages…",
  "Analyzing meta tags…",
  "Checking structured data…",
  "Scoring 48 checkpoints…",
];

export function useRotatingMessage(messages: string[], active: boolean, intervalMs = 2000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, messages.length]);

  return messages[index];
}
