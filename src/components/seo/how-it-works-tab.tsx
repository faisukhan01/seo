"use client";

import {
  Bot,
  BookOpen,
  Braces,
  ExternalLink,
  FileText,
  Gauge,
  ListChecks,
  Globe,
  Share2,
  Smartphone,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Globe,
    title: "Crawl",
    body: "A live crawler fetches up to 25 pages from your site — following internal links, measuring response times, and collecting every page's HTML, meta tags, headings, links and images.",
  },
  {
    icon: ListChecks,
    title: "58 strict checks",
    body: "Each page is checked against 58 SEO checkpoints across 7 categories: indexability, canonicals (including cross-domain mistakes), titles, descriptions, headings, content depth, JS-only rendering, Open Graph (og:url and og:image are validated live), JSON-LD, mobile basics, performance and AI-readiness.",
  },
  {
    icon: Gauge,
    title: "Strict, honest score",
    body: "Findings cost their full weight (critical 22 / warning 9 / info 3) and hard caps apply: a missing title, a noindex page or multiple critical failures limit the score no matter how clean the rest looks. A site with real problems gets a real number.",
  },
  {
    icon: Wand2,
    title: "AI fixes",
    body: "The audit is sent to an AI model that writes optimized titles and metas, keyword opportunities, content briefs, JSON-LD schema, an executive action plan, and ready-to-paste Next.js code fixes.",
  },
];

const COVERAGE: { icon: LucideIcon; label: string; body: string }[] = [
  { icon: Globe, label: "Technical SEO", body: "Sitemaps, robots.txt, redirects, canonicals (incl. cross-domain), orphans, HTTPS, broken links." },
  { icon: FileText, label: "Content & On-Page", body: "Titles, meta descriptions, H1s, heading order, thin content, JS-only rendering, alt text." },
  { icon: Share2, label: "Social / Open Graph", body: "og:url domain check, live og:image validation, Twitter card and twitter:image coverage." },
  { icon: Braces, label: "Structured Data", body: "JSON-LD presence and validity, breadcrumb markup, rich-result readiness." },
  { icon: Smartphone, label: "Mobile & Trust", body: "Viewport, lang attribute, charset, mixed content." },
  { icon: Gauge, label: "Performance", body: "Server response time, HTML size, DOM node count, text ratio." },
  { icon: Bot, label: "AI Search Readiness", body: "llms.txt, AI crawler access in robots.txt — how citable you are in AI answers." },
];

export function HowItWorksTab() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            SEO Autopilot runs a four-step pipeline on every audit. No sign-up,
            no stored credentials — just a URL.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="gap-3 py-5">
                <CardContent className="flex h-full flex-col gap-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                      <Icon className="size-5" />
                      <span className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full border-2 border-background bg-foreground text-[10px] font-bold text-background">
                        <span className="text-background">{i + 1}</span>
                      </span>
                    </span>
                    <h3 className="font-semibold tracking-tight">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Category coverage
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every audit scores seven categories. Each finding includes why it
            matters and how to fix it.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COVERAGE.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="gap-2 py-4">
                <CardContent className="flex items-start gap-3 px-4">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold leading-tight">{c.label}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <BookOpen className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Built on OpenSEO principles</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              SEO Autopilot complements{" "}
              <Badge variant="outline" className="mx-0.5 font-normal">
                OpenSEO
              </Badge>
              — the open-source alternative to Semrush and Ahrefs — by pairing
              its audit philosophy with live crawling, scoring and AI-generated
              fixes. All checks are transparent; no black-box heuristics.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-0 shrink-0 gap-1.5 sm:ml-auto">
            <a
              href="https://github.com/every-app/open-seo"
              target="_blank"
              rel="noopener noreferrer"
            >
              View OpenSEO
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
