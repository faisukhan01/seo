// Client-side copy of the issue knowledge base.
// The audit API only returns { issueId, severity, category, title, pageUrl, detail } —
// explanations and fixes live here so the UI can expand each row with context.

export interface IssueHelp {
  explanation: string;
  howToFix: string;
}

export const ISSUE_HELP: Record<string, IssueHelp> = {
  // ── technical ────────────────────────────────────────────────────────
  "server-error": {
    explanation:
      "This URL returned a 5xx server error. Search engines that keep hitting server errors reduce crawl rate and may eventually drop the page from the index.",
    howToFix:
      "Check your server/error logs for this URL and fix the underlying fault. If the page is intentionally gone, return 404/410 or 301-redirect it to the closest live page.",
  },
  "broken-page": {
    explanation:
      "The page returned a 4xx client error (e.g. 404). Pages linked from your sitemap, navigation or content waste crawl budget and leak link equity.",
    howToFix:
      "Restore the page if it should exist. Otherwise remove or update every link pointing to it and add a 301 redirect to the nearest relevant live page.",
  },
  "blocked-page": {
    explanation:
      "The crawler received an access denial or bot challenge (403/503) instead of page content. Search engine bots often face the same wall, so the page may not be indexed at all.",
    howToFix:
      "Allowlist the audit user agent (and Googlebot/Bingbot) in your WAF, CDN or bot-protection rules, then re-run the audit to confirm the page is reachable.",
  },
  "broken-internal-link": {
    explanation:
      "An internal link points to a URL that returns a 4xx/5xx status. Broken links burn crawl budget, dilute link equity and erode user trust.",
    howToFix:
      "Update the link to point at the correct live URL or remove it. Link directly to the new destination rather than routing through a redirect.",
  },
  "redirect-chain": {
    explanation:
      "Reaching the final content takes two or more consecutive redirects. Every hop adds latency, loses link equity and consumes extra crawl budget.",
    howToFix:
      "Point the original URL and all internal links straight at the final destination so the chain contains at most one redirect.",
  },
  "redirect-loop": {
    explanation:
      "The redirect path eventually points back at itself, so the URL never resolves to real content. Browsers and crawlers abort with an error.",
    howToFix:
      "Find the cycle in your redirect rules (CMS plugins and http→https→www rules are common culprits) and make the chain terminate at a 200 OK page.",
  },
  "noindex-page": {
    explanation:
      "The page carries a noindex directive (meta tag or X-Robots-Tag header), which forbids search engines from indexing it entirely.",
    howToFix:
      "Remove the noindex directive if the page should rank. If exclusion is intentional (admin, thank-you, internal search pages), also keep it out of the sitemap.",
  },
  "canonical-conflict": {
    explanation:
      "The page declares a canonical URL different from itself, so most ranking signals are consolidated onto the other page and this one is treated as a duplicate.",
    howToFix:
      "If this page should rank, change its canonical to be self-referencing. Otherwise stop linking to it internally and remove it from the sitemap.",
  },
  "missing-canonical": {
    explanation:
      "Without a rel=canonical tag, URL variants (query strings, trailing slashes, http/https, www) can be crawled as separate pages and split ranking signals.",
    howToFix:
      "Add a self-referencing <link rel=\"canonical\"> to every indexable page and keep canonical URLs consistent across internal links and the sitemap.",
  },
  "missing-robots-txt": {
    explanation:
      "There is no robots.txt at the domain root, so crawlers get no crawl guidance and you lose the standard place to declare your sitemap.",
    howToFix:
      "Serve a robots.txt at https://yourdomain.com/robots.txt with sensible crawl rules and at least one `Sitemap:` line pointing at your XML sitemap.",
  },
  "robots-sitemap-missing": {
    explanation:
      "robots.txt exists but does not declare a sitemap, so crawlers have to discover it through other means.",
    howToFix:
      "Add a line like `Sitemap: https://yourdomain.com/sitemap.xml` to robots.txt so search engines find and recheck your sitemap automatically.",
  },
  "missing-sitemap": {
    explanation:
      "No XML sitemap was found. A sitemap is the fastest way for search engines to discover all canonical, indexable pages and to report coverage problems in Search Console.",
    howToFix:
      "Publish an XML sitemap at /sitemap.xml listing all canonical, indexable URLs (generate one automatically on most frameworks/CMSs) and reference it from robots.txt.",
  },
  "sitemap-not-parseable": {
    explanation:
      "A sitemap was found at a standard location but could not be parsed as valid XML, so search engines will likely ignore it.",
    howToFix:
      "Fix the XML validity of the sitemap: correct xmlns namespace, escaped URLs, valid lastmod dates (W3C format) and no HTML error pages served in its place.",
  },
  "missing-favicon": {
    explanation:
      "No favicon was detected. Favicons appear next to your site in browser tabs and in mobile search snippets, so a missing one costs a little brand recognition and trust.",
    howToFix:
      "Add /favicon.ico plus PNG/SVG icons with <link rel=\"icon\"> tags and include icons in your web manifest for Android/Chrome surfaces.",
  },
  "duplicate-title": {
    explanation:
      "Two or more crawled pages share the exact same <title>. Identical titles make pages compete with each other and render indistinguishable headlines in search results.",
    howToFix:
      "Write a unique, descriptive title per page. For templated pages, work the distinguishing value (product name, category, location, date) into the title.",
  },
  "duplicate-meta-description": {
    explanation:
      "Multiple pages share the same meta description, so search snippets look identical, which depresses click-through rate.",
    howToFix:
      "Give each page a unique 70-160 character description summarizing its specific value — or drop the tag and let search engines pick a snippet.",
  },
  "duplicate-content": {
    explanation:
      "Two or more URLs serve identical visible content. Search engines pick one version and treat the rest as duplicates, splitting signals and indexing the wrong URL.",
    howToFix:
      "Choose one canonical version, canonical the others to it, 301-redirect where possible, and check for trailing slashes, query params, http/https and www variants.",
  },
  "url-uppercase": {
    explanation:
      "The URL contains uppercase letters. URLs are case-sensitive on many servers, so mixed-case addresses invite duplicate-content variants.",
    howToFix:
      "Standardize on lowercase URLs and 301-redirect any uppercase variant to the lowercase version.",
  },
  "url-underscores": {
    explanation:
      "The URL uses underscores instead of hyphens. Google treats hyphens as word separators but reads underscores as joiners, so my_page reads as one word.",
    howToFix:
      "Use hyphens in URL slugs; 301-redirect old underscore URLs to the new hyphenated versions.",
  },
  "url-too-long": {
    explanation:
      "The URL is extremely long. Long URLs get truncated in search results, are harder to share or paste, and often signal parameter bloat.",
    howToFix:
      "Keep URLs under ~100 characters with 3-5 meaningful hyphenated slugs; strip tracking parameters server-side where you can.",
  },
  "orphan-page": {
    explanation:
      "No other crawled page links to this URL. Orphan pages depend entirely on the sitemap for discovery and accumulate almost no internal link equity.",
    howToFix:
      "Add contextual internal links to the page from relevant hub or category pages (and keep it in the sitemap).",
  },
  "deep-page": {
    explanation:
      "The page sits 4+ clicks from the homepage in internal-link distance. Important pages should be reachable within about three clicks.",
    howToFix:
      "Shorten the click path: link to the page from the homepage, a hub page, key category pages, or the main navigation.",
  },
  // ── content ──────────────────────────────────────────────────────────
  "missing-title": {
    explanation:
      "The page has no <title> tag — the single strongest on-page relevance signal and the headline users see in search results.",
    howToFix:
      "Add a unique 50-60 character title containing the page's primary keyword near the front, followed by the brand name.",
  },
  "title-too-long": {
    explanation:
      "The title exceeds ~60 characters, so search engines truncate it with an ellipsis and your key message may be cut off.",
    howToFix:
      "Shorten the title to 60 characters or fewer while keeping the primary keyword at the start; drop boilerplate like \"Welcome to\".",
  },
  "title-too-short": {
    explanation:
      "The title is under ~20 characters, wasting the most valuable relevance real estate and looking thin in search results.",
    howToFix:
      "Use the full 50-60 character budget: primary keyword plus a qualifier or benefit, then the brand.",
  },
  "missing-meta-description": {
    explanation:
      "There is no meta description, so search engines assemble a snippet from arbitrary page text — usually less compelling, which hurts click-through rate.",
    howToFix:
      "Write a 70-160 character description that summarizes the page and gives searchers a concrete reason to click.",
  },
  "meta-description-too-long": {
    explanation:
      "The meta description exceeds ~160 characters and will be truncated with an ellipsis in results.",
    howToFix:
      "Trim it to 160 characters or fewer, front-loading the key benefit and call to action.",
  },
  "meta-description-too-short": {
    explanation:
      "The meta description is under ~70 characters, leaving most of the snippet space unused.",
    howToFix:
      "Expand it toward 120-155 characters with a benefit statement and a call to action.",
  },
  "missing-h1": {
    explanation:
      "The page has no H1 heading, which weakens topical clarity for both users and search engines.",
    howToFix:
      "Add a single H1 that states the page's main topic, aligned with the title tag.",
  },
  "multiple-h1": {
    explanation:
      "The page contains more than one H1, which dilutes the main-topic signal and usually points to a templating mistake.",
    howToFix:
      "Keep exactly one H1 for the page topic and demote the others to H2/H3, restyling with CSS if needed.",
  },
  "heading-order-skip": {
    explanation:
      "Heading levels jump (e.g. H2 straight to H4), which makes the document outline harder to parse for assistive technology and search engines.",
    howToFix:
      "Use sequential heading levels that mirror the content structure; change visual size with CSS instead of skipping levels.",
  },
  "thin-content": {
    explanation:
      "The page has very little visible text. Thin pages struggle to rank and can drag down the perceived quality of the whole domain.",
    howToFix:
      "Expand the page to 300+ words of genuinely useful content, or consolidate it into a stronger page and redirect.",
  },
  "no-outgoing-links": {
    explanation:
      "The page contains no links at all — a dead end for crawlers and users, and a missed opportunity to build topical context.",
    howToFix:
      "Add a few relevant internal links to related pages and, where appropriate, cite one or two authoritative external sources.",
  },
  "low-text-ratio": {
    explanation:
      "Most of the HTML is markup and scripts rather than readable text, which often indicates a bloated template and gives crawlers little content to work with.",
    howToFix:
      "Cut boilerplate markup, inline scripts and hidden text so that real content dominates the HTML payload.",
  },
  "images-missing-alt": {
    explanation:
      "One or more images are missing alt text. Alt text is required for accessibility, is how image search understands pictures, and is a lost ranking surface when absent.",
    howToFix:
      "Describe each meaningful image concisely in its alt attribute; use alt=\"\" only for purely decorative images.",
  },
  // ── social ───────────────────────────────────────────────────────────
  "missing-og-tags": {
    explanation:
      "Open Graph tags are missing, so shares on WhatsApp, LinkedIn, Slack and iMessage render as bare links with no title, description or preview image.",
    howToFix:
      "Add og:title, og:description, og:type, og:url and a 1200×630 og:image to every page (framework metadata APIs make this easy).",
  },
  "og-image-missing": {
    explanation:
      "There is no og:image, so social shares render as plain text cards — which typically get far fewer clicks than image previews.",
    howToFix:
      "Add an absolute og:image URL pointing to a 1200×630 image under 8MB, ideally unique per page.",
  },
  "missing-twitter-card": {
    explanation:
      "twitter:card tags are missing, so X/Twitter shows a small plain link instead of a large summary card.",
    howToFix:
      "Add twitter:card=summary_large_image plus twitter:title, twitter:description and twitter:image tags.",
  },
  "og-url-mismatch": {
    explanation:
      "og:url points to a different domain than this page. Social platforms consolidate previews and share counts onto that foreign URL, so this page loses attribution and preview control.",
    howToFix:
      "Set og:url to the absolute URL of the current page (same origin). In Next.js, set metadataBase in the metadata config and let og:url be generated from the real canonical URL.",
  },
  "og-image-broken": {
    explanation:
      "The og:image URL is present but did not return a valid image (error status or wrong content type), so social platforms render a blank or text-only card.",
    howToFix:
      "Make sure the og:image URL is absolute and publicly reachable, returns HTTP 200 with an image/* content type, and is roughly 1200×630px.",
  },
  "twitter-image-missing": {
    explanation:
      "There is a twitter:card but no twitter:image and no og:image fallback, so X/Twitter shows a plain text preview.",
    howToFix:
      'Add <meta name="twitter:image" content="absolute image URL"> (or a valid og:image, which X falls back to).',
  },
  "canonical-cross-domain": {
    explanation:
      "The rel=canonical of this page resolves to a different domain — effectively telling search engines to index the other site instead of yours. This alone can make a page invisible in search.",
    howToFix:
      "Point canonical at the same-origin absolute URL of the page. Look for leftover template placeholders or a wrong metadataBase in your framework config.",
  },
  "x-robots-noindex": {
    explanation:
      "The HTTP response includes an X-Robots-Tag: noindex header, which forbids indexing no matter how good the page content is.",
    howToFix:
      "Remove the noindex directive from your middleware, hosting/CDN header rules or platform settings for pages that should rank.",
  },
  "favicon-link-missing": {
    explanation:
      "The HTML head does not declare a favicon via <link rel=\"icon\">. Browsers and mobile search results may show a generic icon instead of your brand.",
    howToFix:
      'Add <link rel="icon" href="/favicon.ico" sizes="any"> plus apple-touch-icon and a manifest icon in the <head>.',
  },
  "js-only-content": {
    explanation:
      "Almost no readable text is present in the raw HTML (< 60 words) while the page ships many scripts. Crawlers that don't execute JavaScript — and most AI answer engines — see an empty page. This is the most common reason a modern site has 'zero SEO' despite looking fine in a browser.",
    howToFix:
      "Server-render the primary content (Next.js SSR/SSG, prerendering, or static HTML) so title, headings and body text exist in the initial HTML response.",
  },
  // ── structured data ──────────────────────────────────────────────────
  "no-json-ld": {
    explanation:
      "The page has no schema.org JSON-LD, so it cannot win rich results such as stars, FAQ accordions, breadcrumbs or product details.",
    howToFix:
      "Add Organization and WebSite JSON-LD sitewide, plus page-type markup (Article, Product, FAQPage, BreadcrumbList, etc.).",
  },
  "json-ld-invalid": {
    explanation:
      "A <script type=\"application/ld+json\"> block failed to parse as valid JSON, so none of its rich-result potential counts.",
    howToFix:
      "Fix the JSON syntax (validate at validator.schema.org) and re-test the URL in Google's Rich Results Test.",
  },
  "missing-breadcrumb-schema": {
    explanation:
      "BreadcrumbList markup is missing, so Google may show a raw URL in results instead of your site hierarchy.",
    howToFix:
      "Add BreadcrumbList JSON-LD that matches the visible breadcrumb trail on the page.",
  },
  // ── mobile ───────────────────────────────────────────────────────────
  "missing-viewport": {
    explanation:
      "There is no <meta name=\"viewport\"> tag, so the page renders desktop-width on phones — an automatic mobile-unfriendly signal for Google.",
    howToFix:
      "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> in the <head>.",
  },
  "missing-lang": {
    explanation:
      "The <html> element has no lang attribute, so screen readers and search engines cannot confirm the page's language.",
    howToFix:
      "Set the correct language on <html lang=\"...\"> (e.g. en, de, ur) and use hreflang for multi-language variants.",
  },
  "missing-charset": {
    explanation:
      "No early <meta charset> declaration was found, so special characters can render as mojibake and shift layout on slow connections.",
    howToFix:
      "Add <meta charset=\"utf-8\"> as one of the first tags inside <head>, before any visible text.",
  },
  "mixed-content": {
    explanation:
      "An HTTPS page loads assets (scripts, images, iframes) over http://. Browsers block or warn on mixed content, breaking functionality and eroding trust.",
    howToFix:
      "Serve every asset over https:// — update hardcoded http:// URLs and proxy or replace third-party resources that are HTTP-only.",
  },
  // ── performance ──────────────────────────────────────────────────────
  "slow-response": {
    explanation:
      "The server took over 1.5s to start responding. Slow TTFB delays rendering of everything else and is part of Core Web Vitals.",
    howToFix:
      "Add edge/server caching, compress responses (brotli/gzip), optimize slow database queries, or move to a faster host or CDN.",
  },
  "huge-page": {
    explanation:
      "The HTML document itself is very large (500KB+), which slows parsing and delays first paint, especially on mobile networks.",
    howToFix:
      "Trim inline data and scripts, paginate very long lists, and move CSS to cached external files.",
  },
  "dom-too-large": {
    explanation:
      "The page has more than ~1,500 DOM nodes, which slows style recalculation and interactivity (Lighthouse flags this directly).",
    howToFix:
      "Render large lists lazily, flatten unnecessary wrapper elements and split giant pages into smaller ones.",
  },
  // ── ai-readiness ─────────────────────────────────────────────────────
  "no-llms-txt": {
    explanation:
      "No /llms.txt file was found. AI search engines (ChatGPT, Perplexity, Claude) increasingly read llms.txt — a curated guide to your best content — when deciding what to cite.",
    howToFix:
      "Publish /llms.txt listing your key pages with one-line descriptions, and optionally /llms-full.txt with more detail.",
  },
  "ai-bot-blocked": {
    explanation:
      "robots.txt disallows major AI crawlers (GPTBot, ClaudeBot, PerplexityBot), so your content cannot be cited in AI answers — invisibility in the fastest-growing search surface.",
    howToFix:
      "Allow the AI crawlers you want citations from in robots.txt, and make sure your best pages are reachable without a challenge.",
  },
  "not-https": {
    explanation:
      "The site is served over plain HTTP. HTTPS is a confirmed ranking signal, and browsers label HTTP sites \"Not secure\", which kills user trust.",
    howToFix:
      "Install a TLS certificate (free via Let's Encrypt or Cloudflare), serve everything over https:// and 301-redirect all HTTP traffic.",
  },
};

const GENERIC_HELP: IssueHelp = {
  explanation:
    "The audit flagged this page against one of its 48 SEO checkpoints. See the issue title and detail for the exact finding.",
  howToFix:
    "Review the flagged page for this pattern, correct it, and re-run the audit to confirm the issue is resolved.",
};

export function getIssueHelp(issueId: string): IssueHelp {
  return ISSUE_HELP[issueId] ?? GENERIC_HELP;
}
