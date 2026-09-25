"use client";

import { motion } from "framer-motion";
import { Loader2, Search, Sparkles, TriangleAlert } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUDIT_STATUS_MESSAGES,
  useRotatingMessage,
} from "./helpers";

const EXAMPLE_SITES = ["vercel.com", "openai.com", "github.com"];

const PAGE_OPTIONS = [
  { value: "5", label: "Quick · 5 pages" },
  { value: "8", label: "Standard · 8 pages" },
  { value: "15", label: "Deep · 15 pages" },
  { value: "25", label: "Full · 25 pages" },
];

export function AuditForm({
  url,
  onUrlChange,
  maxPages,
  onMaxPagesChange,
  loading,
  error,
  onRun,
}: {
  url: string;
  onUrlChange: (value: string) => void;
  maxPages: string;
  onMaxPagesChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onRun: (url: string, maxPages: number) => void;
}) {
  const submit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onRun(trimmed, Number(maxPages));
  };

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mb-1 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <Sparkles className="size-6" />
        </div>
        <CardTitle className="text-2xl tracking-tight">
          Run a free SEO audit
        </CardTitle>
        <CardDescription className="max-w-md text-balance">
          Crawl any public website and get a 48-check audit with scores,
          prioritized issues and AI-generated fixes. Takes 10–60 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Audit failed</AlertTitle>
            <AlertDescription className="break-words">{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) submit();
            }}
            placeholder="your-website.com"
            inputMode="url"
            autoComplete="url"
            aria-label="Website URL to audit"
            className="min-h-11 flex-1"
          />
          <Select value={maxPages} onValueChange={onMaxPagesChange}>
            <SelectTrigger
              aria-label="Number of pages to crawl"
              className="w-full min-h-11 sm:w-[168px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={submit}
            disabled={loading || url.trim().length === 0}
            className="min-h-11 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500"
          >
            <Search className="size-4" />
            Run Free SEO Audit
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span className="mr-1">Try:</span>
          {EXAMPLE_SITES.map((site) => (
            <button
              key={site}
              type="button"
              onClick={() => onUrlChange(site)}
              className="min-h-8 rounded-full border bg-card px-3 py-1 font-mono text-xs text-foreground/80 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-foreground"
            >
              {site}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── In-progress view: rotating status + skeleton ────────────────────────

export function AuditLoading() {
  const message = useRotatingMessage(AUDIT_STATUS_MESSAGES, true, 2000);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="relative inline-flex size-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            <span className="relative inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Loader2 className="size-7 animate-spin" />
            </span>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">{message}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Live crawl in progress — this usually takes 10–60 seconds.
            </p>
          </div>
          <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              animate={{ x: ["-120%", "360%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-5">
            <CardContent className="flex items-center gap-3 space-y-0">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
