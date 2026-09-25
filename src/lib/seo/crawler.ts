import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import type { PageAudit, SiteExtras } from "./types";

const USER_AGENT =
  "SEOAutopilot-Bot/1.0 (+https://github.com/faisukhan01/seo SEO audit bot)";
const FETCH_TIMEOUT_MS = 12_000;
const BROKEN_LINK_CHECK_CAP = 20;

export interface RawPage {
  url: string; // requested
  finalUrl: string; // after redirects
  status: number;
  redirectChain: string[];
  responseTimeMs: number;
  bytes: number;
  contentType: string;
  html?: string;
  depth: number; // BFS link distance from start URL
  blocked: boolean;
}

function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const u = new URL(raw, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    // strip common tracking params
    ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].forEach((p) =>
      u.searchParams.delete(p),
    );
    let s = u.toString();
    if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
    return s;
  } catch {
    return null;
  }
}

function sameHost(a: string, b: string): boolean {
  try {
    const ha = new URL(a).hostname.replace(/^www\./, "");
    const hb = new URL(b).hostname.replace(/^www\./, "");
    return ha === hb;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Follows redirect chain manually (up to 6 hops). */
async function fetchFollowingRedirects(
  url: string,
): Promise<{ res: Response; chain: string[]; finalUrl: string }> {
  const chain: string[] = [];
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetchWithTimeout(current);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { res, chain, finalUrl: current };
      const next = normalizeUrl(loc, current);
      if (!next || chain.includes(next) || next === url) {
        chain.push(next ?? loc);
        return { res, chain, finalUrl: next ?? current };
      }
      chain.push(current);
      current = next;
      continue;
    }
    return { res, chain, finalUrl: current };
  }
  const res = await fetchWithTimeout(current);
  return { res, chain, finalUrl: current };
}

export async function fetchPage(url: string, depth: number): Promise<RawPage> {
  const started = Date.now();
  try {
    const { res, chain, finalUrl } = await fetchFollowingRedirects(url);
    const responseTimeMs = Date.now() - started;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "";
    const blocked =
      res.status === 403 ||
      res.status === 503 ||
      /cloudflare|challenge|captcha|access denied/i.test(
        buf.subarray(0, 2048).toString("utf8"),
      );
    return {
      url,
      finalUrl,
      status: res.status,
      redirectChain: chain,
      responseTimeMs,
      bytes: buf.length,
      contentType,
      html:
        contentType.includes("html") && !blocked
          ? buf.subarray(0, 1_500_000).toString("utf8")
          : undefined,
      depth,
      blocked,
    };
  } catch (err) {
    return {
      url,
      finalUrl: url,
      status: 0,
      redirectChain: [],
      responseTimeMs: Date.now() - started,
      bytes: 0,
      contentType: "",
      depth,
      blocked: /abort/i.test(String(err)),
    };
  }
}

/** Lightweight status-only check (HEAD, fallback GET). */
async function checkLink(url: string): Promise<number> {
  try {
    const res = await fetchWithTimeout(url, { method: "HEAD" });
    if (res.status === 405 || res.status === 501) {
      const res2 = await fetchWithTimeout(url);
      // drain small body
      try {
        await res2.arrayBuffer();
      } catch {
        /* ignore */
      }
      return res2.status;
    }
    return res.status;
  } catch {
    return 0;
  }
}

export function parsePageHtml(page: RawPage): PageAudit {
  const html = page.html ?? "";
  const $ = cheerio.load(html);
  const baseUrl = page.finalUrl;

  const title = $("head title").first().text().trim() || undefined;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || undefined;
  const canonical = $('link[rel="canonical"]').attr("href");
  const canonicalAbs = canonical ? normalizeUrl(canonical, baseUrl) ?? canonical : undefined;
  const robotsMeta = $('meta[name="robots"]').attr("content")?.toLowerCase();

  const h1Texts = $("h1")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean);

  const headingOutline = $("h1, h2, h3, h4, h5, h6")
    .map((_, el) => ({
      level: parseInt(el.tagName.substring(1), 10),
      text: $(el).text().replace(/\s+/g, " ").trim().slice(0, 120),
    }))
    .get()
    .slice(0, 60);

  $("script, style, noscript, template").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
  const htmlLen = Math.max(html.length, 1);
  const textRatio = Math.min(1, (bodyText.length * 1.6) / htmlLen);

  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;
    const abs = normalizeUrl(href, baseUrl);
    if (!abs) return;
    if (sameHost(abs, baseUrl)) internalLinks++;
    else externalLinks++;
  });

  const imagesTotal = $("img").length;
  const imagesMissingAlt = $("img").filter((_, el) => {
    const alt = $(el).attr("alt");
    return alt === undefined || alt.trim() === "";
  }).length;

  const ogProps = ["og:title", "og:description", "og:image", "og:url"];
  const ogFound = ogProps.filter((p) =>
    $(`meta[property="${p}"]`).length > 0,
  ).length;
  const hasOpenGraph = ogFound >= 2;
  const hasOgImage = $('meta[property="og:image"]').length > 0;
  const hasTwitterCard = $('meta[name^="twitter:"]').length > 0;
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const lang = $("html").attr("lang") || undefined;
  const charset =
    $("meta[charset]").attr("charset") ||
    ($('meta[http-equiv="Content-Type"]').attr("content")?.match(/charset=([\w-]+)/i)?.[1]) ||
    undefined;

  const jsonLdTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const root = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] ?? [])];
      for (const node of root) {
        const t = node?.["@type"];
        if (typeof t === "string") jsonLdTypes.push(t);
        else if (Array.isArray(t)) jsonLdTypes.push(...t.map(String));
      }
    } catch {
      jsonLdTypes.push("__invalid__");
    }
  });

  const domNodeCount = $("*").length;
  const hasHttps = baseUrl.startsWith("https://");

  return {
    meta: {
      url: page.url,
      finalUrl: page.finalUrl,
      status: page.status,
      redirectChain: page.redirectChain,
      responseTimeMs: page.responseTimeMs,
      bytes: page.bytes,
      contentType: page.contentType,
    },
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical: canonicalAbs,
    robotsMeta,
    h1Count: h1Texts.length,
    h1Texts,
    headingOutline,
    wordCount,
    internalLinks,
    externalLinks,
    imagesTotal,
    imagesMissingAlt,
    hasOpenGraph,
    hasOgImage,
    hasTwitterCard,
    hasViewport,
    lang,
    charset,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    textRatio: Math.round(textRatio * 100) / 100,
    domNodeCount,
    hasHttps,
  };
}

/** Extract URLs + mixed-content assets from the ORIGINAL html (before script removal). */
export function extractLinks(page: RawPage): {
  internal: string[];
  mixedContent: string[];
} {
  const $ = cheerio.load(page.html ?? "");
  const baseUrl = page.finalUrl;
  const internal = new Set<string>();
  $("a[href]").each((_, el) => {
    const abs = normalizeUrl($(el).attr("href") ?? "", baseUrl);
    if (abs && sameHost(abs, baseUrl)) internal.add(abs);
  });
  const mixedContent: string[] = [];
  if (baseUrl.startsWith("https://")) {
    $("script[src], img[src], link[href], iframe[src], source[src]").each(
      (_, el) => {
        const u = $(el).attr("src") ?? $(el).attr("href") ?? "";
        if (u.startsWith("http://")) mixedContent.push(u.slice(0, 200));
      },
    );
  }
  return { internal: [...internal], mixedContent };
}

export function fingerprint(text: string): string {
  return createHash("sha1")
    .update(text.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 20_000))
    .digest("hex");
}

// ─── Site-level extras ───────────────────────────────────────────────────

async function fetchText(url: string): Promise<{ ok: boolean; body: string; status: number }> {
  try {
    const { res } = await fetchFollowingRedirects(url);
    if (!res.ok) return { ok: false, body: "", status: res.status };
    const body = (await res.text()).slice(0, 300_000);
    return { ok: true, body, status: res.status };
  } catch {
    return { ok: false, body: "", status: 0 };
  }
}

export async function collectSiteExtras(
  startUrl: string,
  rawPages: RawPage[],
  parsedPages: PageAudit[],
  internalLinksSeen: Set<string>,
): Promise<SiteExtras> {
  const origin = new URL(startUrl).origin;
  const [robots, sitemap, favicon, llms] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
    checkLink(`${origin}/favicon.ico`),
    fetchText(`${origin}/llms.txt`),
  ]);

  let robotsHasSitemap = false;
  let aiBotsBlocked = false;
  if (robots.ok) {
    const lines = robots.body.split("\n");
    robotsHasSitemap = lines.some((l) => /^sitemap:\s*\S+/i.test(l));
    // detect AI crawler blocks
    let currentAgents: string[] = [];
    const AI_AGENTS = ["gptbot", "claudebot", "perplexitybot", "google-extended", "ccbot", "anthropic-ai", "bytespider", "chatgpt-user"];
    for (const rawLine of lines) {
      const line = rawLine.split("#")[0].trim();
      if (/^user-agent:\s*(.+)$/i.test(line)) {
        const agent = line.match(/^user-agent:\s*(.+)$/i)![1].trim().toLowerCase();
        if (agent !== "*") currentAgents.push(agent);
      } else if (/^disallow:\s*\/\s*$/i.test(line)) {
        if (currentAgents.some((a) => AI_AGENTS.includes(a))) aiBotsBlocked = true;
      } else if (line === "") {
        currentAgents = [];
      }
    }
  }

  let sitemapUrlCount = 0;
  let hasSitemap = sitemap.ok && sitemap.body.includes("<");
  if (hasSitemap) {
    const locs = sitemap.body.match(/<loc>[\s\S]*?<\/loc>/gi) ?? [];
    sitemapUrlCount = locs.length;
  }

  const manifestLink = rawPages[0]?.html?.match(
    /<link[^>]+rel=["']manifest["'][^>]+>/i,
  );

  // broken internal link check: unique links not successfully crawled
  const crawledOk = new Set(
    rawPages.filter((p) => p.status >= 200 && p.status < 300).map((p) => p.finalUrl),
  );
  const candidates = [...internalLinksSeen].filter((u) => !crawledOk.has(u)).slice(0, BROKEN_LINK_CHECK_CAP);
  const broken: string[] = [];
  const statuses = await Promise.all(candidates.map((u) => checkLink(u)));
  candidates.forEach((u, i) => {
    const st = statuses[i];
    if (st === 0 || st >= 400) broken.push(`${st === 0 ? "ERR" : st} ${u}`);
  });

  const allTitles = parsedPages.map((p) => ({ url: p.meta.finalUrl, title: p.title ?? "" }));
  const allMetaDescriptions = parsedPages.map((p) => ({
    url: p.meta.finalUrl,
    description: p.metaDescription ?? "",
  }));
  const allCanonicals = parsedPages.map((p) => ({
    url: p.meta.finalUrl,
    canonical: p.canonical ?? null,
    self: p.canonical ? normalizeUrl(p.canonical, p.meta.finalUrl) === p.meta.finalUrl : false,
  }));
  const contentFingerprints = rawPages.map((p) => ({
    url: p.finalUrl,
    hash: fingerprint(cheerio.load(p.html ?? "")("body").text()),
  }));

  return {
    hasRobotsTxt: robots.ok,
    robotsTxtBytes: robots.ok ? robots.body.length : 0,
    robotsHasSitemap,
    robotsAiBotsBlocked: aiBotsBlocked,
    hasSitemap,
    sitemapUrlCount,
    hasFavicon: favicon >= 200 && favicon < 400,
    hasLlmsTxt: llms.ok && llms.body.trim().length > 0,
    hasManifest: Boolean(manifestLink),
    mixedContentCount: rawPages.reduce((acc, p) => acc + extractLinks(p).mixedContent.length, 0),
    brokenInternalLinks: broken,
    checkedInternalLinks: candidates.length,
    allTitles,
    allMetaDescriptions,
    allCanonicals,
    contentFingerprints,
    protocol: startUrl.startsWith("https") ? "https" : "http",
  } as SiteExtras;
}
