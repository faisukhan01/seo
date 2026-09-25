# SEO Autopilot — 100% SEO for Any Website

> Crawl any website → 48-check audit → weighted scoring → **AI-generated fixes** → track scores over time.

An open-source, self-hostable SEO platform built on the principles of [OpenSEO](https://github.com/every-app/open-seo) (open-source Semrush/Ahrefs alternative) — extended with an AI autopilot layer that doesn't just *report* SEO problems, but **writes the fixes for you**.

## What it does

```
┌─────────┐   ┌──────────────┐   ┌──────────┐   ┌───────────────┐   ┌──────────┐
│  Crawl  │ → │ 48 SEO checks │ → │  Scoring  │ → │ AI-generated  │ → │  Track   │
│ BFS bot │   │  7 categories │   │ A+ … F    │   │ fixes & briefs│   │ over time│
└─────────┘   └──────────────┘   └──────────┘   └───────────────┘   └──────────┘
```

### 1. Live Crawl
BFS crawler with redirect-chain tracking, bot-challenge detection, per-page timing, 12s timeouts and a 55s crawl budget.

### 2. 48-Check Audit — 7 Categories

| Category | Sample checks |
|---|---|
| **Technical SEO** (25%) | 5xx/4xx, redirect chains & loops, noindex, canonical conflicts, robots.txt, XML sitemap, broken internal links, orphans, deep pages, HTTPS, duplicate titles/descriptions/content |
| **Content & On-Page** (25%) | title missing/length, meta description missing/length, H1 missing/multiple, heading order, thin content, text-to-HTML ratio, image alt text, outgoing links |
| **Social / Open Graph** (10%) | OG tags, og:image, Twitter cards |
| **Structured Data** (10%) | JSON-LD presence, validity, BreadcrumbList |
| **Mobile & Trust** (10%) | viewport, lang, charset, mixed content |
| **Performance** (10%) | TTFB, HTML size, DOM size |
| **AI Search Readiness** (10%) | llms.txt, AI-bot blocking in robots.txt (GPTBot/ClaudeBot/PerplexityBot) |

Scores are severity-weighted (critical 12 / warning 5 / info 1.5) with page-count damping, rolled up into an overall 0–100 score and letter grade.

### 3. AI Autopilot (z-ai SDK, server-side)
- **Optimized Titles & Metas** — rewritten per page with rationale
- **Keyword Opportunities** — 12+ ideas with intent, difficulty, target page type
- **Content Brief** — outline, questions to answer, entities, word-count target
- **Schema Markup** — ready-to-paste Organization/WebSite/Article JSON-LD
- **Executive Summary** — plain-language verdict + prioritized 5-step action plan
- **Next.js Code Fixes** — `metadata` exports, `app/robots.ts`, `app/sitemap.ts`, JSON-LD components

### 4. Tracking & Export
Every audit is persisted (SQLite via Prisma). Score history per domain is charted, and full markdown reports are downloadable.

## Quick start

```bash
bun install
bun run db:push     # create SQLite schema
bun run dev         # http://localhost:3000
```

Paste a URL (e.g. `your-website.com`), pick a crawl depth, hit **Run Free SEO Audit**.

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/seo/audit` | POST | `{url, maxPages}` → run crawl + audit, persist, return full result |
| `/api/seo/audits` | GET | recent audits (50) |
| `/api/seo/audits/{id}` | GET | full audit + score history for its domain |
| `/api/seo/ai` | POST | `{auditId, action, topic?}` → AI meta / keywords / brief / schema / summary / nextjs |
| `/api/seo/report/{id}` | GET | download markdown report |

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite · cheerio · recharts · framer-motion · z-ai-web-dev-sdk (server-side LLM)

## Relationship to OpenSEO

The issue registry and audit philosophy are modeled on [every-app/open-seo](https://github.com/every-app/open-seo)'s site-audit engine (28 issue types), expanded here to 48 checks and combined with AI fix generation, content strategy and score tracking. Use OpenSEO when you need DataForSEO-powered keyword/rank/backlink data; use SEO Autopilot when you want a free, instant, self-hosted audit-and-fix loop for sites you control.

## License

MIT
