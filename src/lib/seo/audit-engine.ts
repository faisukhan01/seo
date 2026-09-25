import { fetchPage, parsePageHtml, extractLinks, collectSiteExtras, type RawPage } from "./crawler";
import { ISSUE_REGISTRY, SEVERITY_WEIGHTS } from "./issue-registry";
import type {
  AuditIssueInstance,
  PageAudit,
  ScoreKey,
  ScoreSummary,
  SiteAuditResult,
} from "./types";

const CRAWL_BUDGET_MS = 55_000;

interface CrawlOutput {
  rawPages: RawPage[];
  parsed: PageAudit[];
  internalLinksSeen: Set<string>;
  inboundCount: Map<string, number>;
  minDepth: Map<string, number>;
}

export async function crawlAndParse(startUrl: string, maxPages: number): Promise<CrawlOutput> {
  const started = Date.now();
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
  const enqueued = new Set<string>([startUrl]);
  const rawPages: RawPage[] = [];
  const parsed: PageAudit[] = [];
  const internalLinksSeen = new Set<string>();
  const inboundCount = new Map<string, number>();
  const minDepth = new Map<string, number>();

  while (queue.length > 0 && rawPages.length < maxPages) {
    if (Date.now() - started > CRAWL_BUDGET_MS) break;
    const batch = queue.splice(0, 3);
    const results = await Promise.all(batch.map(({ url, depth }) => fetchPage(url, depth)));
    for (const page of results) {
      rawPages.push(page);
      if (page.html && page.status >= 200 && page.status < 400) {
        const audit = parsePageHtml(page);
        parsed.push(audit);
        const links = extractLinks(page);
        for (const link of links.internal) {
          internalLinksSeen.add(link);
          inboundCount.set(link, (inboundCount.get(link) ?? 0) + 1);
          minDepth.set(link, Math.min(minDepth.get(link) ?? 99, page.depth + 1));
          if (
            !enqueued.has(link) &&
            rawPages.length + queue.length < maxPages &&
            Date.now() - started < CRAWL_BUDGET_MS
          ) {
            enqueued.add(link);
            queue.push({ url: link, depth: page.depth + 1 });
          }
        }
        // mixed content per page recorded by extractLinks during scoring
      }
    }
  }

  return { rawPages, parsed, internalLinksSeen, inboundCount, minDepth };
}

function computeScores(issues: AuditIssueInstance[], pageCount: number): ScoreSummary {
  const byCategory: Record<string, { critical: number; warning: number; info: number }> = {};
  const totals = { critical: 0, warning: 0, info: 0 };

  for (const issue of issues) {
    const w = SEVERITY_WEIGHTS[issue.severity];
    const cat = byCategory[issue.category] ?? { critical: 0, warning: 0, info: 0 };
    cat[issue.severity] += 1;
    byCategory[issue.category] = cat;
    totals[issue.severity] += 1;
  }

  const weights: Record<ScoreKey, number> = {
    technical: 0.25,
    content: 0.25,
    social: 0.1,
    structured: 0.1,
    mobile: 0.1,
    performance: 0.1,
    aiReadiness: 0.1,
  };

  const labels: Record<ScoreKey, string> = {
    technical: "Technical SEO",
    content: "Content & On-Page",
    social: "Social / Open Graph",
    structured: "Structured Data",
    mobile: "Mobile & Trust",
    performance: "Performance",
    aiReadiness: "AI Search Readiness",
  };

  const categories = (Object.keys(weights) as ScoreKey[]).map((key) => {
    const cat = byCategory[key] ?? { critical: 0, warning: 0, info: 0 };
    const penalty =
      cat.critical * SEVERITY_WEIGHTS.critical +
      cat.warning * SEVERITY_WEIGHTS.warning +
      cat.info * SEVERITY_WEIGHTS.info;
    // damping: 1 page with an issue hurts less than 5 pages
    const damped = penalty / Math.max(1, Math.sqrt(pageCount));
    return {
      key,
      label: labels[key],
      score: Math.max(0, Math.round(100 - damped)),
    };
  });

  const overall = Math.round(
    categories.reduce((acc, c) => acc + c.score * weights[c.key], 0),
  );
  const grade =
    overall >= 97 ? "A+" :
    overall >= 90 ? "A" :
    overall >= 80 ? "B" :
    overall >= 70 ? "C" :
    overall >= 60 ? "D" :
    overall >= 45 ? "E" : "F";

  return { overall, grade, categories, ...totals };
}

export async function runAudit(startUrl: string, maxPages: number): Promise<SiteAuditResult> {
  const started = Date.now();
  const { rawPages, parsed, internalLinksSeen, inboundCount, minDepth } =
    await crawlAndParse(startUrl, maxPages);

  const site = await collectSiteExtras(startUrl, rawPages, parsed, internalLinksSeen);
  const issues: AuditIssueInstance[] = [];
  const add = (
    issueId: string,
    pageUrl?: string,
    detail?: string,
  ) => {
    const desc = ISSUE_REGISTRY[issueId];
    if (!desc) return;
    issues.push({
      issueId,
      severity: desc.severity,
      category: desc.category,
      title: desc.title,
      pageUrl,
      detail,
    });
  };

  const homeUrl = startUrl.replace(/\/$/, "");

  // ── per-page checks ────────────────────────────────────────────────────
  for (const p of parsed) {
    const u = p.meta.finalUrl;

    if (p.meta.status >= 500) add("server-error", u, `Status ${p.meta.status}`);
    else if (p.meta.status >= 400) add("broken-page", u, `Status ${p.meta.status}`);

    if (p.meta.redirectChain.length >= 2) {
      add("redirect-chain", u, p.meta.redirectChain.join(" → ") + ` → ${u}`);
    }

    if (p.robotsMeta?.includes("noindex")) add("noindex-page", u, p.robotsMeta);

    if (!p.title) add("missing-title", u);
    else if (p.titleLength > 65) add("title-too-long", u, `"${p.title}" (${p.titleLength} chars)`);
    else if (p.titleLength < 20) add("title-too-short", u, `"${p.title}" (${p.titleLength} chars)`);

    if (!p.metaDescription) add("missing-meta-description", u);
    else if (p.metaDescriptionLength > 165)
      add("meta-description-too-long", u, `${p.metaDescriptionLength} chars`);
    else if (p.metaDescriptionLength > 0 && p.metaDescriptionLength < 70)
      add("meta-description-too-short", u, `${p.metaDescriptionLength} chars`);

    if (p.canonical && u.replace(/\/$/, "") !== p.canonical.replace(/\/$/, "") && p.meta.status === 200) {
      add("canonical-conflict", u, `canonical → ${p.canonical}`);
    } else if (!p.canonical) {
      add("missing-canonical", u);
    }

    if (p.h1Count === 0) add("missing-h1", u);
    else if (p.h1Count > 1) add("multiple-h1", u, p.h1Texts.join(" | ").slice(0, 160));

    // heading order skip
    let prev = 0;
    for (const h of p.headingOutline) {
      if (prev > 0 && h.level > prev + 1) {
        add("heading-order-skip", u, `H${prev} → H${h.level} ("${h.text}")`);
        break;
      }
      prev = h.level;
    }

    if (p.wordCount < 150) add("thin-content", u, `${p.wordCount} words`);
    if (p.internalLinks + p.externalLinks === 0) add("no-outgoing-links", u);
    if (p.textRatio < 0.08 && p.wordCount > 0) add("low-text-ratio", u, `ratio ${p.textRatio}`);

    if (p.imagesMissingAlt > 0)
      add("images-missing-alt", u, `${p.imagesMissingAlt}/${p.imagesTotal} images missing alt`);

    if (!p.hasOpenGraph) add("missing-og-tags", u);
    else if (!p.hasOgImage) add("og-image-missing", u);
    if (!p.hasTwitterCard) add("missing-twitter-card", u);
    if (!p.hasViewport) add("missing-viewport", u);
    if (!p.lang) add("missing-lang", u);
    if (!p.charset) add("missing-charset", u);

    if (p.jsonLdTypes.length === 0) add("no-json-ld", u);
    else if (p.jsonLdTypes.includes("__invalid__")) add("json-ld-invalid", u);
    if (!p.jsonLdTypes.includes("BreadcrumbList") && p.internalLinks > 3)
      add("missing-breadcrumb-schema", u);

    if (p.meta.responseTimeMs > 1500)
      add("slow-response", u, `${(p.meta.responseTimeMs / 1000).toFixed(2)}s TTFB`);
    if (p.meta.bytes > 500_000) add("huge-page", u, `${Math.round(p.meta.bytes / 1024)}KB HTML`);
    if (p.domNodeCount > 1500) add("dom-too-large", u, `${p.domNodeCount} nodes`);
  }

  // ── site-level checks ─────────────────────────────────────────────────
  if (!site.protocol || site.protocol === "http") add("not-https", homeUrl);

  if (!site.hasRobotsTxt) add("missing-robots-txt", `${new URL(startUrl).origin}/robots.txt`);
  else if (!site.robotsHasSitemap)
    add("robots-sitemap-missing", `${new URL(startUrl).origin}/robots.txt`);
  if (site.robotsAiBotsBlocked) add("ai-bot-blocked", `${new URL(startUrl).origin}/robots.txt`);

  if (!site.hasSitemap) add("missing-sitemap", `${new URL(startUrl).origin}/sitemap.xml`);
  else if (site.sitemapUrlCount === 0) add("sitemap-not-parseable", `${new URL(startUrl).origin}/sitemap.xml`);

  if (!site.hasFavicon) add("missing-favicon", `${new URL(startUrl).origin}/favicon.ico`);
  if (!site.hasLlmsTxt) add("no-llms-txt", `${new URL(startUrl).origin}/llms.txt`);

  if (site.mixedContentCount > 0)
    add("mixed-content", homeUrl, `${site.mixedContentCount} http:// assets on HTTPS pages`);

  for (const link of site.brokenInternalLinks.slice(0, 10)) {
    add("broken-internal-link", homeUrl, link);
  }

  // duplicate titles / descriptions / content (site-wide)
  const titleMap = new Map<string, string[]>();
  for (const t of site.allTitles) {
    if (!t.title) continue;
    titleMap.set(t.title, [...(titleMap.get(t.title) ?? []), t.url]);
  }
  for (const [title, urls] of titleMap) {
    if (urls.length > 1) add("duplicate-title", urls[0], `"${title}" on ${urls.length} pages`);
  }

  const descMap = new Map<string, string[]>();
  for (const d of site.allMetaDescriptions) {
    if (!d.description) continue;
    descMap.set(d.description, [...(descMap.get(d.description) ?? []), d.url]);
  }
  for (const [desc, urls] of descMap) {
    if (urls.length > 1)
      add("duplicate-meta-description", urls[0], `"${desc.slice(0, 80)}…" on ${urls.length} pages`);
  }

  const hashMap = new Map<string, string[]>();
  for (const c of site.contentFingerprints) {
    hashMap.set(c.hash, [...(hashMap.get(c.hash) ?? []), c.url]);
  }
  for (const [hash, urls] of hashMap) {
    if (hash && urls.length > 1) add("duplicate-content", urls[0], urls.join(", ").slice(0, 200));
  }

  // orphan + deep pages (based on internal-link discovery among crawled pages)
  for (const p of parsed) {
    const u = p.meta.finalUrl;
    const inbound = inboundCount.get(u) ?? 0;
    if (p.meta.finalUrl !== homeUrl && inbound === 0) add("orphan-page", u);
    const depth = u.replace(/\/$/, "") === homeUrl ? 0 : (minDepth.get(u) ?? 99);
    if (depth >= 4) add("deep-page", u, `${depth} clicks from homepage`);
  }

  const scores = computeScores(issues, Math.max(1, parsed.length));

  return {
    version: 1,
    startUrl,
    domain: new URL(startUrl).hostname,
    crawledAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    pages: parsed,
    site,
    issues,
    scores,
  };
}
