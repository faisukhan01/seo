"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Bot,
  Braces,
  Brain,
  CheckCircle2,
  Code2,
  HelpCircle,
  Sparkles,
  Target,
  TriangleAlert,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { AiAction, AiResponse } from "@/lib/seo/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CopyButton, CodeBlock } from "./snippets";

// ─── action card config ──────────────────────────────────────────────────

interface ActionConfig {
  action: AiAction;
  title: string;
  description: string;
  icon: LucideIcon;
  hasTopic?: boolean;
}

const ACTION_CONFIG: ActionConfig[] = [
  {
    action: "meta",
    title: "Optimized Titles & Metas",
    description: "Rewritten title tags and meta descriptions for every crawled page, with the reasoning behind each change.",
    icon: Wand2,
  },
  {
    action: "keywords",
    title: "Keyword Opportunities",
    description: "Keywords the site could realistically win, with intent, difficulty and the page type to target.",
    icon: Target,
  },
  {
    action: "brief",
    title: "Content Brief",
    description: "A publish-ready brief: outline, questions to answer, entities and word-count target.",
    icon: BookOpen,
    hasTopic: true,
  },
  {
    action: "schema",
    title: "Schema Markup (JSON-LD)",
    description: "Copy-paste JSON-LD blocks per page with the exact placement guidance.",
    icon: Braces,
  },
  {
    action: "summary",
    title: "Executive Summary",
    description: "The state of the site in plain language plus a prioritized action plan.",
    icon: Brain,
  },
  {
    action: "nextjs",
    title: "Next.js Code Fixes",
    description: "Concrete file-level code fixes (metadata, sitemap, robots, JSON-LD) for Next.js sites.",
    icon: Code2,
  },
];

type ActionState = {
  status: "idle" | "loading" | "done" | "error";
  response?: AiResponse;
  error?: string;
};

// ─── result renderers ────────────────────────────────────────────────────

function ModelErrorNote({ message }: { message: string }) {
  return (
    <Alert className="border-amber-500/30 text-amber-700 dark:text-amber-300">
      <TriangleAlert className="size-4" />
      <AlertTitle>Model notice</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function MetaResults({ response }: { response: AiResponse }) {
  if (!response.meta?.length) return null;
  return (
    <div className="space-y-3">
      {response.meta.map((m, i) => (
        <Card key={`${m.pageUrl}-${i}`} className="gap-3 py-4">
          <CardContent className="space-y-3 px-4">
            <p className="truncate font-mono text-xs text-muted-foreground">
              {m.pageUrl}
            </p>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Title
                </span>
                <CopyButton text={m.title} title="Copy title" />
              </div>
              <p className="text-sm font-medium">{m.title}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </span>
                <CopyButton text={m.description} title="Copy description" />
              </div>
              <p className="text-sm leading-relaxed">{m.description}</p>
            </div>
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              {m.rationale}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const INTENT_CLASS: Record<string, string> = {
  informational: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  commercial: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  transactional: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  navigational: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
};

const DIFFICULTY_CLASS: Record<string, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

function KeywordsResults({ response }: { response: AiResponse }) {
  if (!response.keywords?.length) return null;
  return (
    <div className="thin-scrollbar max-h-[480px] overflow-auto rounded-xl border bg-card">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
          <TableRow>
            <TableHead className="min-w-[180px]">Keyword</TableHead>
            <TableHead>Intent</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead className="min-w-[140px]">Page type</TableHead>
            <TableHead className="min-w-[240px]">Why</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {response.keywords.map((k, i) => (
            <TableRow key={`${k.keyword}-${i}`}>
              <TableCell className="font-medium">{k.keyword}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", INTENT_CLASS[k.intent])}>
                  {k.intent}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", DIFFICULTY_CLASS[k.difficulty])}>
                  {k.difficulty}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{k.suggestedPageType}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{k.why}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BriefResults({ response }: { response: AiResponse }) {
  const brief = response.brief;
  if (!brief) return null;
  return (
    <Card className="gap-4 py-5">
      <CardContent className="space-y-5 px-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300">
              Target keyword: {brief.targetKeyword}
            </Badge>
            <Badge variant="secondary">{brief.wordCountTarget} words target</Badge>
          </div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-semibold leading-snug tracking-tight">
              {brief.workingTitle}
            </h4>
            <CopyButton
              text={`${brief.workingTitle}\n\nTarget keyword: ${brief.targetKeyword}\n\nOutline:\n${brief.outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}`}
              title="Copy brief"
            />
          </div>
        </div>
        <Separator />
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Outline
          </h5>
          <ol className="space-y-1.5">
            {brief.outline.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Questions to answer
          </h5>
          <ul className="space-y-1.5">
            {brief.questionsToAnswer.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {q}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Entities to mention
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {brief.entitiesToMention.map((e, i) => (
              <Badge key={i} variant="outline" className="font-normal">
                {e}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SchemaResults({ response }: { response: AiResponse }) {
  if (!response.schema?.length) return null;
  return (
    <div className="space-y-4">
      {response.schema.map((s, i) => (
        <div key={`${s.pageUrl}-${i}`} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px]">
              {s.schemaType}
            </Badge>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {s.pageUrl}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Placement:</span> {s.whereToPlace}
          </p>
          <CodeBlock code={s.jsonLd} language="json" />
        </div>
      ))}
    </div>
  );
}

const PRIORITY_CLASS: Record<number, string> = {
  1: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  2: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  3: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

function SummaryResults({ response }: { response: AiResponse }) {
  const summary = response.summary;
  if (!summary) return null;
  return (
    <Card className="gap-4 py-5">
      <CardContent className="space-y-5 px-5">
        <h4 className="text-xl font-semibold tracking-tight">{summary.headline}</h4>
        {summary.paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
        <Separator />
        <div>
          <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Action plan
          </h5>
          <ol className="space-y-3">
            {summary.topActions.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[11px]", PRIORITY_CLASS[a.priority] ?? PRIORITY_CLASS[3])}
                    >
                      Priority {a.priority}
                    </Badge>
                    <span className="text-sm font-medium">{a.action}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{a.impact}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function NextjsResults({ response }: { response: AiResponse }) {
  if (!response.nextjs?.length) return null;
  return (
    <div className="space-y-4">
      {response.nextjs.map((f, i) => (
        <div key={`${f.fileName}-${i}`} className="space-y-2">
          <CodeBlock code={f.code} fileName={f.fileName} language={f.language} />
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
            {f.explanation}
          </p>
        </div>
      ))}
    </div>
  );
}

function ResultRenderer({ action, response }: { action: AiAction; response: AiResponse }) {
  switch (action) {
    case "meta":
      return <MetaResults response={response} />;
    case "keywords":
      return <KeywordsResults response={response} />;
    case "brief":
      return <BriefResults response={response} />;
    case "schema":
      return <SchemaResults response={response} />;
    case "summary":
      return <SummaryResults response={response} />;
    case "nextjs":
      return <NextjsResults response={response} />;
    default:
      return null;
  }
}

// ─── tab root ────────────────────────────────────────────────────────────

export function AiFixesTab({ auditId, domain }: { auditId: string; domain: string }) {
  const [states, setStates] = useState<Partial<Record<AiAction, ActionState>>>({});
  const [topic, setTopic] = useState("");

  // results are cached per auditId — reset when another audit is selected
  useEffect(() => {
    setStates({});
    setTopic("");
  }, [auditId]);

  const run = async (action: AiAction) => {
    setStates((s) => ({ ...s, [action]: { status: "loading" } }));
    try {
      const res = await fetch("/api/seo/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          action,
          topic: action === "brief" && topic.trim() ? topic.trim() : undefined,
        }),
      });
      const data = (await res.json()) as AiResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setStates((s) => ({ ...s, [action]: { status: "done", response: data } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      setStates((s) => ({ ...s, [action]: { status: "error", error: message } }));
    }
  };

  const completedActions = ACTION_CONFIG.filter(
    (cfg) => states[cfg.action]?.status === "done",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="size-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold tracking-tight">
          AI fixes for <span className="font-mono text-emerald-600 dark:text-emerald-400">{domain}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ACTION_CONFIG.map((cfg) => {
          const Icon = cfg.icon;
          const state = states[cfg.action];
          const loading = state?.status === "loading";
          return (
            <Card
              key={cfg.action}
              className="gap-3 py-4 transition-shadow hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col gap-3 px-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400">
                    <Icon className="size-4.5" />
                  </span>
                  <CardTitle className="text-sm leading-tight">{cfg.title}</CardTitle>
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  {cfg.description}
                </CardDescription>
                {cfg.hasTopic ? (
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic (optional) — e.g. headless CMS"
                    className="min-h-9 text-xs"
                    aria-label="Content brief topic"
                  />
                ) : null}
                <div className="mt-auto pt-1">
                  {state?.status === "error" ? (
                    <p className="mb-2 line-clamp-2 text-xs text-red-600 dark:text-red-400">
                      {state.error}
                    </p>
                  ) : null}
                  <Button
                    onClick={() => void run(cfg.action)}
                    disabled={loading}
                    variant={state?.status === "done" ? "outline" : "default"}
                    className={cn(
                      "min-h-9 w-full gap-2 text-xs",
                      state?.status === "done"
                        ? ""
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500",
                    )}
                  >
                    {loading ? (
                      <>
                        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating…
                      </>
                    ) : state?.status === "done" ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        Regenerate
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {completedActions.length > 0 ? (
        <div className="space-y-8">
          {completedActions.map((cfg) => {
            const state = states[cfg.action];
            const response = state?.response;
            if (!response) return null;
            return (
              <motion.section
                key={cfg.action}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <cfg.icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {cfg.title}
                  </h3>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {response.modelError ? <ModelErrorNote message={response.modelError} /> : null}
                <ResultRenderer action={cfg.action} response={response} />
              </motion.section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
