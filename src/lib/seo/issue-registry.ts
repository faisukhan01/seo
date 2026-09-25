import type { IssueDescriptor } from "./types";

// 48-issue registry — modeled on OpenSEO's audit-issues.ts, expanded to cover
// the full technical + content + social + structured-data + mobile +
// performance + AI-readiness surface for "100% SEO" coverage.

const ISSUE_LIST: IssueDescriptor[] = [
  // ── technical ────────────────────────────────────────────────────────
  {
    id: "server-error",
    severity: "critical",
      category: "technical",
      title: "Server error (5xx)",
      explanation:
        "The page returned a 5xx server error. Search engines that repeatedly see server errors will crawl the site less and may drop pages from the index.",
      howToFix:
        "Check server logs for the URL and fix the underlying error. If the page is gone, return 404/410 or redirect to a relevant page.",
    },
    {
      id: "broken-page",
      severity: "critical",
      category: "technical",
      title: "Page returns an error (4xx)",
      explanation:
        "The crawled URL returned a client error (e.g. 404). Pages referenced from your sitemap or internal links waste crawl budget and leak link equity.",
      howToFix:
        "Restore the page if it should exist; otherwise remove it from the sitemap/links and add a 301 redirect to the closest live page.",
    },
    {
      id: "blocked-page",
      severity: "critical",
      category: "technical",
      title: "Crawler was blocked",
      explanation:
        "The site returned a bot challenge or access denial (403/503 challenge) instead of the page. Search engines may face the same friction.",
      howToFix:
        "Allowlist the SEOAutopilot user agent in your WAF/bot-protection rules, then re-run the audit.",
    },
    {
      id: "broken-internal-link",
      severity: "critical",
      category: "technical",
      title: "Broken internal link",
      explanation:
        "An internal URL returns an error status (4xx/5xx). Broken links waste crawl budget, leak link equity and hurt user trust.",
      howToFix:
        "Update or remove the link. Prefer linking directly to the new URL rather than through a redirect.",
    },
    {
      id: "redirect-chain",
      severity: "warning",
      category: "technical",
      title: "Redirect chain",
      explanation:
        "Reaching the final page requires 2+ consecutive redirects. Each hop adds latency, leaks link equity and burns crawl budget.",
      howToFix:
        "Point the first URL and internal links directly at the final destination so there is at most one redirect.",
    },
    {
      id: "redirect-loop",
      severity: "critical",
      category: "technical",
      title: "Redirect loop",
      explanation:
        "The redirect eventually points back at itself, so the URL never resolves. Crawlers and browsers give up with an error.",
      howToFix: "Break the cycle in your redirect rules so the chain terminates at a real 200 page.",
    },
    {
      id: "noindex-page",
      severity: "critical",
      category: "technical",
      title: "Page is noindex",
      explanation:
        "The page has a noindex directive (meta or X-Robots-Tag), so it cannot appear in search results at all.",
      howToFix:
        "Remove the noindex directive if the page should rank. If it is intentional (admin pages, thank-you pages), leave it out of the sitemap.",
    },
    {
      id: "canonical-conflict",
      severity: "warning",
      category: "technical",
      title: "Canonical points to another page",
      explanation:
        "The page declares a canonical URL different from itself, so most ranking signals are passed to the other page and this one is treated as a duplicate.",
      howToFix:
        "If this page should rank, make its canonical self-referencing; otherwise remove it from internal links and the sitemap.",
    },
    {
      id: "canonical-cross-domain",
      severity: "critical",
      category: "technical",
      title: "Canonical points to a different domain",
      explanation:
        "The rel=canonical of this page resolves to another domain, which effectively tells search engines to drop this page from the index and give all credit to the other site.",
      howToFix:
        "Point canonical at the same-origin absolute URL of the page. Check for leftover template placeholders (e.g. og:url from a scaffold) or wrong metadataBase.",
    },
    {
      id: "x-robots-noindex",
      severity: "critical",
      category: "technical",
      title: "X-Robots-Tag header blocks indexing",
      explanation:
        "The HTTP response includes an X-Robots-Tag: noindex header, so the page can never appear in search results — even with perfect on-page SEO.",
      howToFix:
        "Remove the noindex X-Robots-Tag header (check middleware, hosting platform headers or CDN rules) for pages that should rank.",
    },
    {
      id: "favicon-link-missing",
      severity: "info",
      category: "technical",
      title: "No favicon <link> in HTML",
      explanation:
        "The HTML head does not declare a favicon via <link rel=\"icon\">. Browsers and search engines may fall back to a generic icon, hurting brand recognition in tabs and mobile SERPs.",
      howToFix:
        "Add <link rel=\"icon\" href=\"/favicon.ico\" sizes=\"any\"> (plus apple-touch-icon and a web manifest icon) to the <head>.",
    },
    {
      id: "missing-canonical",
      severity: "info",
      category: "technical",
      title: "Missing canonical tag",
      explanation:
        "Without rel=canonical, parameter/trailing-slash/http variants of the URL can be treated as separate pages and split ranking signals.",
      howToFix: "Add a self-referencing <link rel=\"canonical\"> to every indexable page.",
    },
    {
      id: "missing-robots-txt",
      severity: "warning",
      category: "technical",
      title: "robots.txt missing",
      explanation:
        "Without robots.txt, crawlers have no crawl guidance and you cannot point them to your sitemap from a standard location.",
      howToFix: "Serve a robots.txt at the domain root, including at least one Sitemap: line.",
    },
    {
      id: "robots-sitemap-missing",
      severity: "info",
      category: "technical",
      title: "robots.txt does not declare a sitemap",
      explanation:
        "Declaring the sitemap in robots.txt helps crawlers discover it faster than sitemap ping alone.",
      howToFix: "Add a `Sitemap: https://yourdomain.com/sitemap.xml` line to robots.txt.",
    },
    {
      id: "missing-sitemap",
      severity: "critical",
      category: "technical",
      title: "XML sitemap missing",
      explanation:
        "A sitemap helps search engines discover and prioritize all your indexable pages, and reports crawl coverage issues in Search Console.",
      howToFix: "Publish an XML sitemap at /sitemap.xml listing all canonical, indexable URLs; reference it from robots.txt.",
    },
    {
      id: "sitemap-not-parseable",
      severity: "warning",
      category: "technical",
      title: "Sitemap could not be parsed",
      explanation:
        "The sitemap exists but is not valid XML (or returned an error), so search engines may ignore it.",
      howToFix: "Fix the XML validity of /sitemap.xml (correct namespaces, escaped URLs, valid lastmod dates).",
    },
    {
      id: "missing-favicon",
      severity: "info",
      category: "technical",
      title: "Favicon missing",
      explanation:
        "Favicons appear in search result snippets on mobile and in browser tabs; a missing one is a small trust/branding loss.",
      howToFix: "Add /favicon.ico plus PNG/ICO links in <head> and a web manifest icon.",
    },
    {
      id: "duplicate-title",
      severity: "warning",
      category: "technical",
      title: "Duplicate title",
      explanation:
        "Multiple pages share the same <title>, so they compete with each other and search results show identical headlines.",
      howToFix:
        "Write a unique title per page; for templates, include the distinguishing attribute (name, category, location).",
    },
    {
      id: "duplicate-meta-description",
      severity: "warning",
      category: "technical",
      title: "Duplicate meta description",
      explanation:
        "Multiple pages share the same meta description, so search snippets are identical and CTR suffers.",
      howToFix: "Write a unique description per page, or remove it entirely to let search engines pick a snippet.",
    },
    {
      id: "duplicate-content",
      severity: "warning",
      category: "technical",
      title: "Duplicate page content",
      explanation:
        "Two or more URLs serve identical visible text. Search engines pick one and split signals across the rest.",
      howToFix:
        "Pick the canonical URL, canonical the others to it, 301-redirect where possible (check trailing slashes, parameters, http/https, www).",
    },
    {
      id: "url-uppercase",
      severity: "info",
      category: "technical",
      title: "URL contains uppercase letters",
      explanation:
        "URLs are case-sensitive on many servers; mixed-case URLs invite duplicate-content variants.",
      howToFix: "Use lowercase URLs and 301-redirect uppercase variants to the lowercase one.",
    },
    {
      id: "url-underscores",
      severity: "info",
      category: "technical",
      title: "URL uses underscores",
      explanation:
        "Google treats hyphens as word separators but underscores as joiners, so `my_page` reads as one word.",
      howToFix: "Use hyphens in slugs instead of underscores.",
    },
    {
      id: "url-too-long",
      severity: "info",
      category: "technical",
      title: "URL is very long",
      explanation:
        "Extremely long URLs get truncated in SERPs and are harder to share and link.",
      howToFix: "Keep URLs under ~100 characters with 3-5 meaningful slugs.",
    },
    {
      id: "orphan-page",
      severity: "warning",
      category: "technical",
      title: "Orphan page",
      explanation:
        "This page is not linked from any other crawled page. Orphans rely solely on the sitemap and accumulate little internal link equity.",
      howToFix: "Add contextual internal links to the orphan from relevant pages (navigation counts only if natural).",
    },
    {
      id: "deep-page",
      severity: "info",
      category: "technical",
      title: "Page buried deep in site",
      explanation:
        "The page is 4+ clicks from the homepage in internal-link distance. Important pages should be reachable in ~3 clicks.",
      howToFix: "Shorten the click path: link from the homepage, a hub page, or key category pages.",
    },

    // ── content ──────────────────────────────────────────────────────────
    {
      id: "missing-title",
      severity: "critical",
      category: "content",
      title: "Missing title tag",
      explanation:
        "The page has no <title> — the strongest on-page relevance signal and the headline in search results.",
      howToFix: "Add a unique, descriptive 50-60 character title that includes the page's primary topic.",
    },
    {
      id: "title-too-long",
      severity: "warning",
      category: "content",
      title: "Title too long",
      explanation:
        "Titles beyond ~60 characters get truncated in search results, cutting off your message.",
      howToFix: "Shorten to ≤ 60 characters while keeping the primary keyword near the front.",
    },
    {
      id: "title-too-short",
      severity: "info",
      category: "content",
      title: "Title too short",
      explanation:
        "Very short titles under ~20 characters waste prime relevance space and look thin in SERPs.",
      howToFix: "Use the 50-60 character budget: primary keyword + qualifier/brand.",
    },
    {
      id: "missing-meta-description",
      severity: "warning",
      category: "content",
      title: "Missing meta description",
      explanation:
        "Without a description, search engines assemble a snippet from page text — often less compelling, hurting CTR.",
      howToFix: "Add a 70-160 character description that summarizes the page and gives a reason to click.",
    },
    {
      id: "meta-description-too-long",
      severity: "info",
      category: "content",
      title: "Meta description too long",
      explanation: "Descriptions beyond ~160 characters are truncated with ellipsis in search results.",
      howToFix: "Trim to ≤ 160 characters, front-loading the key benefit.",
    },
    {
      id: "meta-description-too-short",
      severity: "info",
      category: "content",
      title: "Meta description too short",
      explanation: "Descriptions under ~70 characters underuse the snippet space.",
      howToFix: "Expand toward 120-155 characters with a benefit + call to action.",
    },
    {
      id: "missing-h1",
      severity: "warning",
      category: "content",
      title: "Missing H1 heading",
      explanation:
        "The page has no H1 — weaker topical clarity for users and search engines.",
      howToFix: "Add a single H1 stating the page's main topic, aligned with the title tag.",
    },
    {
      id: "multiple-h1",
      severity: "warning",
      category: "content",
      title: "Multiple H1 headings",
      explanation:
        "More than one H1 dilutes the main-topic signal and usually indicates a templating mistake.",
      howToFix: "Keep one H1; demote the rest to H2/H3.",
    },
    {
      id: "heading-order-skip",
      severity: "info",
      category: "content",
      title: "Heading level skipped",
      explanation:
        "Heading levels jump (e.g. H2 → H4), which makes the document outline harder to parse for accessibility and SEO.",
      howToFix: "Use sequential heading levels; restyle with CSS instead of skipping levels.",
    },
    {
      id: "thin-content",
      severity: "warning",
      category: "content",
      title: "Thin content",
      explanation:
        "The page has very little visible text. Thin pages struggle to rank and can drag the whole domain's quality down.",
      howToFix: "Expand to 300+ words of genuinely useful content, or noindex/consolidate pages that can't be expanded.",
    },
    {
      id: "no-outgoing-links",
      severity: "info",
      category: "content",
      title: "No outgoing links",
      explanation:
        "Pages with zero links (internal or external) look dead-end to crawlers and miss chances to build topical context.",
      howToFix: "Add a few relevant internal links and, where appropriate, 1-2 authoritative external references.",
    },
    {
      id: "low-text-ratio",
      severity: "info",
      category: "content",
      title: "Low text-to-HTML ratio",
      explanation:
        "Most of the HTML is markup/script rather than readable content, often signaling bloated templates.",
      howToFix: "Reduce boilerplate markup, inline scripts and hidden text; let real content dominate the HTML.",
    },
    {
      id: "js-only-content",
      severity: "critical",
      category: "content",
      title: "Content only renders via JavaScript",
      explanation:
        "The server returns almost no readable HTML text (< 60 words) while shipping many script files. Crawlers that do not execute JavaScript (and most AI answer engines) see an empty page — this is the most common reason a modern site silently has 'zero SEO'.",
      howToFix:
        "Server-render the primary content (Next.js SSR/SSG, prerendering, or static HTML) so the title, headings and body text exist in the raw HTML response.",
    },
    {
      id: "images-missing-alt",
      severity: "warning",
      category: "content",
      title: "Images missing alt text",
      explanation:
        "Alt text is required for accessibility and is how image search understands the picture; missing alt is a lost ranking surface.",
      howToFix: "Describe each meaningful image in a short alt attribute; use alt=\"\" only for decorative images.",
    },

    // ── social ───────────────────────────────────────────────────────────
    {
      id: "missing-og-tags",
      severity: "warning",
      category: "social",
      title: "Open Graph tags missing",
      explanation:
        "Without OG tags, shares on WhatsApp/LinkedIn/Slack/iMessage show no title, description or preview image — less clicks from social.",
      howToFix:
        "Add og:title, og:description, og:type, og:url and a 1200×630 og:image to every page.",
    },
    {
      id: "og-image-missing",
      severity: "info",
      category: "social",
      title: "og:image missing",
      explanation: "Shared links without og:image render as bare text cards and get significantly fewer clicks.",
      howToFix: "Add an absolute og:image URL pointing to a 1200×630 image under 8MB.",
    },
    {
      id: "missing-twitter-card",
      severity: "info",
      category: "social",
      title: "Twitter Card tags missing",
      explanation: "Without twitter:card, X/Twitter renders a small, plain link preview instead of a large summary card.",
      howToFix: "Add twitter:card=summary_large_image plus twitter:title/description/image.",
    },
    {
      id: "og-url-mismatch",
      severity: "critical",
      category: "social",
      title: "og:url points to a different domain",
      explanation:
        "The og:url tag points to another domain than the page itself. Social platforms consolidate share counts and preview data onto that foreign URL, so your pages lose attribution, preview control and social proof.",
      howToFix:
        "Set og:url to the absolute, canonical URL of the current page (same origin). In Next.js set metadataBase and use alternates.canonical so og:url is generated correctly.",
    },
    {
      id: "og-image-broken",
      severity: "warning",
      category: "social",
      title: "og:image is broken or unreachable",
      explanation:
        "The og:image URL exists in the markup but returned an error or non-image response. Social platforms will render a blank or text-only card.",
      howToFix:
        "Make sure the og:image URL is absolute, publicly reachable (no auth), returns HTTP 200 with an image/* content type, and is ~1200x630px.",
    },
    {
      id: "twitter-image-missing",
      severity: "info",
      category: "social",
      title: "twitter:image missing",
      explanation:
        "X/Twitter falls back to og:image in most cases, but an explicit twitter:image guarantees a large, correct preview card.",
      howToFix: "Add <meta name=\"twitter:image\" content=\"absolute image URL\"> alongside twitter:card.",
    },

    // ── structured data ──────────────────────────────────────────────────
    {
      id: "no-json-ld",
      severity: "warning",
      category: "structured-data",
      title: "No structured data (JSON-LD)",
      explanation:
        "The page has no schema.org markup, so it cannot win rich results (stars, FAQ accordions, breadcrumbs, product info).",
      howToFix:
        "Add JSON-LD: Organization + WebSite sitewide; Article/Product/FAQPage/BreadcrumbList per page type.",
    },
    {
      id: "json-ld-invalid",
      severity: "warning",
      category: "structured-data",
      title: "JSON-LD is invalid",
      explanation:
        "A <script type=\"application/ld+json\"> block failed to parse, so its rich-result potential is lost.",
      howToFix: "Fix the JSON syntax (validate at validator.schema.org) and re-test in the Rich Results Test.",
    },
    {
      id: "missing-breadcrumb-schema",
      severity: "info",
      category: "structured-data",
      title: "BreadcrumbList missing",
      explanation:
        "Breadcrumb markup lets Google show your site hierarchy in results instead of a raw URL.",
      howToFix: "Add BreadcrumbList JSON-LD matching the visible breadcrumb trail.",
    },

    // ── mobile ───────────────────────────────────────────────────────────
    {
      id: "missing-viewport",
      severity: "critical",
      category: "mobile",
      title: "Missing viewport meta tag",
      explanation:
        "Without <meta name=viewport>, the page renders desktop-width on phones — an automatic mobile-unfriendly flag from Google.",
      howToFix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    },
    {
      id: "missing-lang",
      severity: "info",
      category: "mobile",
      title: "Missing lang attribute",
      explanation:
        "Without <html lang>, screen readers and search engines cannot confirm the page language.",
      howToFix: "Set the correct language on <html lang=\"…\"> (e.g. en, ur).",
    },
    {
      id: "missing-charset",
      severity: "info",
      category: "mobile",
      title: "Charset not declared early",
      explanation:
        "Without an early <meta charset>, special characters may render as mojibake and shift layout on slow connections.",
      howToFix: "Add <meta charset=\"utf-8\"> as one of the first tags in <head>.",
    },
    {
      id: "mixed-content",
      severity: "critical",
      category: "mobile",
      title: "Mixed content on HTTPS page",
      explanation:
        "The HTTPS page loads assets over http://. Browsers block or warn on these, breaking images/scripts and eroding trust.",
      howToFix: "Serve every asset over https:// (update hardcoded http:// URLs and proxy any third-party scripts).",
    },

    // ── performance ──────────────────────────────────────────────────────
    {
      id: "slow-response",
      severity: "warning",
      category: "performance",
      title: "Slow server response",
      explanation:
        "The server took over 1.5s to respond. Slow TTFB delays everything else and is a Core Web Vitals factor.",
      howToFix:
        "Add edge/server caching, compress responses (brotli/gzip), optimize DB queries, or move to a faster host/CDN.",
    },
    {
      id: "huge-page",
      severity: "warning",
      category: "performance",
      title: "Very large HTML document",
      explanation:
        "The HTML document itself is very large (>500KB), which slows parsing and delays first paint, especially on mobile.",
      howToFix: "Trim inline data/scripts, paginate huge lists, and move styles to external files with caching.",
    },
    {
      id: "dom-too-large",
      severity: "info",
      category: "performance",
      title: "Very large DOM",
      explanation:
        "More than ~1,500 DOM nodes slows style recalculation and interactivity (Lighthouse flags this).",
      howToFix: "Render large lists lazily, flatten needless wrapper elements, and split giant pages.",
    },

    // ── ai-readiness ─────────────────────────────────────────────────────
    {
      id: "no-llms-txt",
      severity: "info",
      category: "ai-readiness",
      title: "llms.txt missing",
      explanation:
        "AI search engines (ChatGPT, Perplexity, Claude) increasingly read llms.txt — a curated guide to your best content — to decide what to cite.",
      howToFix:
        "Publish /llms.txt listing your key pages with one-line descriptions, plus optional /llms-full.txt with details.",
    },
    {
      id: "ai-bot-blocked",
      severity: "warning",
      category: "ai-readiness",
      title: "AI crawlers blocked in robots.txt",
      explanation:
        "robots.txt disallows GPTBot/ClaudeBot/PerplexityBot, so your site can't be cited in AI answers — you're invisible in the fastest-growing search surface.",
      howToFix: "Allow AI crawlers you want citations from (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) in robots.txt.",
    },
    {
      id: "not-https",
      severity: "critical",
      category: "technical",
      title: "Site not served over HTTPS",
      explanation:
        "HTTPS is a confirmed ranking signal and browsers label HTTP sites 'Not secure', killing user trust.",
      howToFix: "Install a TLS certificate (free via Let's Encrypt/Cloudflare) and 301-redirect all HTTP traffic.",
    },
];

export const ISSUE_REGISTRY: Record<string, IssueDescriptor> = Object.fromEntries(
  ISSUE_LIST.map((issue) => [issue.id, issue]),
);

export const CATEGORY_LABELS: Record<string, string> = {
  technical: "Technical SEO",
  content: "Content & On-Page",
  social: "Social / Open Graph",
  "structured-data": "Structured Data",
  mobile: "Mobile & Trust",
  performance: "Performance",
  "ai-readiness": "AI Search Readiness",
};

// Strict, realistic weights (model v2). A single critical failure on a page
// should visibly move the needle — a missing sitemap or noindex page must not
// be drowned out by an otherwise clean template.
export const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 22,
  warning: 9,
  info: 3,
};
