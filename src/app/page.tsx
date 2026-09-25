"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Github,
  History as HistoryIcon,
  Info,
  Moon,
  Search,
  Sparkles,
  Sun,
  Wand2,
} from "lucide-react";
import type {
  AuditHistoryPoint,
  AuditRecordSummary,
  SiteAuditResult,
} from "@/lib/seo/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AuditForm, AuditLoading } from "@/components/seo/audit-form";
import { ResultsView } from "@/components/seo/results-view";
import { AiFixesTab } from "@/components/seo/ai-tab";
import { HistoryTab } from "@/components/seo/history-tab";
import { HowItWorksTab } from "@/components/seo/how-it-works-tab";

type SelectedAudit = { id: string; result: SiteAuditResult };

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

const THIN_SCROLLBAR_CSS = `
.thin-scrollbar { scrollbar-width: thin; scrollbar-color: rgb(161 161 170 / 0.4) transparent; }
.thin-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
.thin-scrollbar::-webkit-scrollbar-thumb { background: rgb(161 161 170 / 0.4); border-radius: 9999px; }
.thin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(161 161 170 / 0.6); }
`;

export default function Home() {
  const { toast } = useToast();

  const [tab, setTab] = useState("audit");
  const [dark, setDark] = useState(false);

  // audit flow
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [audit, setAudit] = useState<SelectedAudit | null>(null);
  const [history, setHistory] = useState<AuditHistoryPoint[]>([]);
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState("8");

  // history tab
  const [recentAudits, setRecentAudits] = useState<AuditRecordSummary[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [loadingAuditId, setLoadingAuditId] = useState<string | null>(null);

  // sync theme toggle with whatever is on <html>
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/seo/audits", { cache: "no-store" });
      const data = (await res.json()) as { audits?: AuditRecordSummary[] };
      setRecentAudits(data.audits ?? []);
    } catch {
      // silent — history tab shows empty state
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecent();
  }, [fetchRecent]);

  const runAudit = useCallback(
    async (url: string, maxPages: number) => {
      setAuditing(true);
      setAuditError(null);
      setAudit(null);
      setHistory([]);
      try {
        const res = await fetch("/api/seo/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, maxPages }),
        });
        const data = (await res.json()) as {
          id?: string;
          result?: SiteAuditResult;
          error?: string;
        };
        if (!res.ok || !data.id || !data.result) {
          throw new Error(data.error || "Audit failed. Please try again.");
        }
        setAudit({ id: data.id, result: data.result });
        toast({
          title: "Audit complete",
          description: `${data.result.domain} scored ${data.result.scores.overall}/100 (${data.result.scores.grade}).`,
        });
        // pull score history for the domain (non-fatal if it fails)
        try {
          const detailRes = await fetch(`/api/seo/audits/${data.id}`);
          const detail = (await detailRes.json()) as { history?: AuditHistoryPoint[] };
          setHistory(detail.history ?? []);
        } catch {
          setHistory([]);
        }
        void fetchRecent();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Audit failed. Please try again.";
        setAuditError(message);
        toast({
          title: "Audit failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setAuditing(false);
      }
    },
    [fetchRecent, toast],
  );

  const selectAudit = useCallback(
    async (id: string) => {
      setLoadingAuditId(id);
      try {
        const res = await fetch(`/api/seo/audits/${id}`, { cache: "no-store" });
        const data = (await res.json()) as {
          id?: string;
          result?: SiteAuditResult;
          history?: AuditHistoryPoint[];
          error?: string;
        };
        if (!res.ok || !data.id || !data.result) {
          throw new Error(data.error || "Failed to load audit.");
        }
        setAudit({ id: data.id, result: data.result });
        setHistory(data.history ?? []);
        setAuditError(null);
        setTab("audit");
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast({
          title: "Audit loaded",
          description: `${data.result.domain} — ${data.result.scores.overall}/100 (${data.result.scores.grade}).`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load audit.";
        toast({ title: "Could not load audit", description: message, variant: "destructive" });
      } finally {
        setLoadingAuditId(null);
      }
    },
    [toast],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <style dangerouslySetInnerHTML={{ __html: THIN_SCROLLBAR_CSS }} />

      {/* ── header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-base font-bold tracking-tight">
                SEO Autopilot
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                100% SEO for any website — audit → fix → track
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="size-10"
            >
              {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
            <Button variant="ghost" size="icon" asChild className="size-10">
              <a
                href="https://github.com/faisukhan01/seo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
                title="View source on GitHub"
              >
                <Github className="size-4.5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* ── main ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={setTab} className="gap-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
            <TabsTrigger value="audit" className="min-h-10 gap-1.5 px-3 py-2 dark:data-[state=inactive]:text-zinc-300">
              <Search className="size-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              disabled={!audit}
              className="min-h-10 gap-1.5 px-3 py-2 dark:data-[state=inactive]:text-zinc-300"
              title={audit ? undefined : "Run an audit first"}
            >
              <Wand2 className="size-4" />
              AI Fixes
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-10 gap-1.5 px-3 py-2 dark:data-[state=inactive]:text-zinc-300">
              <HistoryIcon className="size-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="how" className="min-h-10 gap-1.5 px-3 py-2 dark:data-[state=inactive]:text-zinc-300">
              <Info className="size-4" />
              How it works
            </TabsTrigger>
          </TabsList>

          {/* ── tab 1: audit ── */}
          <TabsContent value="audit" className="mt-2">
            <AnimatePresence mode="wait" initial={false}>
              {auditing ? (
                <motion.div key="audit-loading" {...fadeUp}>
                  <AuditLoading />
                </motion.div>
              ) : audit ? (
                <motion.div key="audit-results" {...fadeUp}>
                  <ResultsView
                    auditId={audit.id}
                    result={audit.result}
                    history={history}
                    onNewAudit={() => {
                      setAudit(null);
                      setAuditError(null);
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div key="audit-form" {...fadeUp}>
                  <AuditForm
                    url={url}
                    onUrlChange={setUrl}
                    maxPages={maxPages}
                    onMaxPagesChange={setMaxPages}
                    loading={auditing}
                    error={auditError}
                    onRun={(u, mp) => void runAudit(u, mp)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ── tab 2: ai fixes ── */}
          <TabsContent value="ai" className="mt-2">
            {audit ? (
              <motion.div key={`ai-${audit.id}`} {...fadeUp}>
                <AiFixesTab auditId={audit.id} domain={audit.result.domain} />
              </motion.div>
            ) : null}
          </TabsContent>

          {/* ── tab 3: history ── */}
          <TabsContent value="history" className="mt-2">
            <motion.div key="history-tab" {...fadeUp}>
              <HistoryTab
                audits={recentAudits}
                loading={recentLoading}
                loadingAuditId={loadingAuditId}
                selectedDomain={audit?.result.domain ?? null}
                history={history}
                onSelect={(id) => void selectAudit(id)}
                onRefresh={() => {
                  setRecentLoading(true);
                  void fetchRecent();
                }}
              />
            </motion.div>
          </TabsContent>

          {/* ── tab 4: how it works ── */}
          <TabsContent value="how" className="mt-2">
            <motion.div key="how-tab" {...fadeUp}>
              <HowItWorksTab />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── footer ── */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>
            SEO Autopilot — built on OpenSEO principles · Data: live crawl + AI ·
            Not affiliated with Google
          </p>
          <p>© {new Date().getFullYear()} SEO Autopilot</p>
        </div>
      </footer>
    </div>
  );
}
