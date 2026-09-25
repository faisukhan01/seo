"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Braces,
  Download,
  FileText,
  Gauge,
  Globe,
  HelpCircle,
  Plus,
  Share2,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  AuditHistoryPoint,
  AuditIssueInstance,
  CategoryScore,
  SiteAuditResult,
} from "@/lib/seo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getIssueHelp } from "./issue-help";
import {
  SEVERITY_BADGE_CLASS,
  formatDuration,
  scoreBadgeClass,
  scoreTextClass,
  truncateMiddle,
} from "./helpers";
import { ScoreRing } from "./score-ring";

// ─── category config ─────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { icon: LucideIcon; blurb: string }
> = {
  technical: { icon: Wrench, blurb: "Indexing, redirects, sitemaps" },
  content: { icon: FileText, blurb: "Titles, headings, content depth" },
  social: { icon: Share2, blurb: "Open Graph & Twitter cards" },
  structured: { icon: Braces, blurb: "JSON-LD & rich results" },
  mobile: { icon: Smartphone, blurb: "Viewport, lang, HTTPS trust" },
  performance: { icon: Gauge, blurb: "TTFB, page weight, DOM size" },
  aiReadiness: { icon: Bot, blurb: "llms.txt & AI crawler access" },
};

function CategoryCard({ category }: { category: CategoryScore }) {
  const meta = CATEGORY_META[category.key];
  const Icon = meta?.icon ?? Gauge;
  const barClass =
    category.score >= 80
      ? "[&>div]:bg-emerald-500"
      : category.score >= 60
        ? "[&>div]:bg-amber-500"
        : "[&>div]:bg-red-500";
  return (
    <Card className="gap-3 py-4 transition-transform hover:-translate-y-0.5">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icon className="size-4.5" />
            </span>
            <span className="text-sm font-medium leading-tight">
              {category.label}
            </span>
          </div>
          <span className={cn("text-lg font-bold tabular-nums", scoreTextClass(category.score))}>
            {category.score}
          </span>
        </div>
        <Progress
          value={category.score}
          aria-label={`${category.label} score ${category.score} of 100`}
          className={cn("h-2 bg-muted", barClass)}
        />
        <p className="text-xs text-muted-foreground">{meta?.blurb}</p>
      </CardContent>
    </Card>
  );
}

// ─── issue row ───────────────────────────────────────────────────────────

function IssueRow({
  issue,
  rowId,
}: {
  issue: AuditIssueInstance;
  rowId: string;
}) {
  const help = getIssueHelp(issue.issueId);
  return (
    <AccordionItem value={rowId} className="border-b last:border-b-0">
      <AccordionTrigger className="gap-3 px-3 py-3 text-left hover:no-underline [&>svg]:self-center [&>svg]:shrink-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                SEVERITY_BADGE_CLASS[issue.severity],
              )}
            >
              {issue.severity}
            </Badge>
            <span className="text-sm font-medium">{issue.title}</span>
          </div>
          {issue.pageUrl ? (
            <span className="truncate font-mono text-xs text-muted-foreground">
              {truncateMiddle(issue.pageUrl, 72)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="size-3" /> site-wide
            </span>
          )}
          {issue.detail ? (
            <span className="line-clamp-2 text-xs text-muted-foreground/80">
              {issue.detail}
            </span>
          ) : null}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 px-3 pb-4">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <HelpCircle className="size-3.5" /> Why it matters
          </p>
          <p className="text-sm leading-relaxed">{help.explanation}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <Wrench className="size-3.5" /> How to fix
          </p>
          <p className="text-sm leading-relaxed">{help.howToFix}</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── results view ────────────────────────────────────────────────────────

type IssueFilter = "all" | "critical" | "warning" | "info";

const FILTERS: { key: IssueFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

export function ResultsView({
  auditId,
  result,
  history,
  onNewAudit,
}: {
  auditId: string;
  result: SiteAuditResult;
  history: AuditHistoryPoint[];
  onNewAudit: () => void;
}) {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const { scores, domain, pages, issues } = result;

  const filtered = useMemo(
    () => (filter === "all" ? issues : issues.filter((i) => i.severity === filter)),
    [filter, issues],
  );

  const grouped = useMemo(() => {
    if (filter !== "all") return null;
    return {
      critical: filtered.filter((i) => i.severity === "critical"),
      warning: filtered.filter((i) => i.severity === "warning"),
      info: filtered.filter((i) => i.severity === "info"),
    };
  }, [filter, filtered]);

  const scoreTrend = useMemo(() => {
    if (history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    const delta = last.overallScore - first.overallScore;
    return delta;
  }, [history]);

  const counts: Record<IssueFilter, number> = {
    all: issues.length,
    critical: scores.critical,
    warning: scores.warning,
    info: scores.info,
  };

  return (
    <div className="space-y-6">
      {/* ── score hero ── */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing value={scores.overall} />
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge
                variant="outline"
                className={cn("px-2.5 py-0.5 text-sm font-bold", scoreBadgeClass(scores.overall))}
              >
                {scores.grade}
              </Badge>
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {domain}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {pages.length} pages · {formatDuration(result.durationMs)} ·{" "}
              {issues.length} issues ({scores.critical} critical)
            </p>
            <p className="text-xs text-muted-foreground">
              Audited {new Date(result.crawledAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {scoreTrend !== null ? (
                <>
                  {" · "}
                  <span
                    className={
                      scoreTrend >= 0
                        ? "font-medium text-emerald-600 dark:text-emerald-400"
                        : "font-medium text-red-600 dark:text-red-400"
                    }
                  >
                    {scoreTrend >= 0 ? "+" : ""}
                    {scoreTrend} vs previous run
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              <Button asChild className="min-h-11 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500">
                <a href={`/api/seo/report/${auditId}`} download>
                  <Download className="size-4" />
                  Download Report
                </a>
              </Button>
              <Button variant="outline" onClick={onNewAudit} className="min-h-11 gap-2">
                <Plus className="size-4" />
                New audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── category scores ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Category scores
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {scores.categories.map((c) => (
            <CategoryCard key={c.key} category={c} />
          ))}
        </div>
      </section>

      {/* ── issues ── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Issues
          </h3>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter issues by severity">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums opacity-70">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="py-10">
            <CardContent className="text-center text-sm text-muted-foreground">
              No {filter === "all" ? "" : `${filter} `}issues found. Impressive.
            </CardContent>
          </Card>
        ) : (
          <div className="thin-scrollbar max-h-[480px] overflow-y-auto rounded-xl border bg-card">
            {grouped ? (
              (["critical", "warning", "info"] as const).map((sev) =>
                grouped[sev].length > 0 ? (
                  <div key={sev}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-muted/80 px-3 py-2 backdrop-blur">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: sev === "critical" ? "#ef4444" : sev === "warning" ? "#f59e0b" : "#a1a1aa" }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {sev} ({grouped[sev].length})
                      </span>
                    </div>
                    <Accordion type="multiple" className="px-1">
                      {grouped[sev].map((issue, idx) => (
                        <IssueRow
                          key={`${issue.issueId}-${issue.pageUrl ?? "site"}-${idx}`}
                          issue={issue}
                          rowId={`${sev}-${idx}`}
                        />
                      ))}
                    </Accordion>
                  </div>
                ) : null,
              )
            ) : (
              <Accordion type="multiple" className="px-1">
                {filtered.map((issue, idx) => (
                  <IssueRow
                    key={`${issue.issueId}-${issue.pageUrl ?? "site"}-${idx}`}
                    issue={issue}
                    rowId={`issue-${idx}`}
                  />
                ))}
              </Accordion>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
