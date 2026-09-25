import ZAI from "z-ai-web-dev-sdk";
import type {
  AiContentBrief,
  AiKeywordIdea,
  AiMetaSuggestion,
  AiNextjsFixes,
  AiResponse,
  AiSchemaSuggestion,
  AiSummary,
  SiteAuditResult,
} from "./types";

// All AI features run server-side via z-ai-web-dev-sdk (never client-side).

function extractJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

async function complete(system: string, user: string): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content ?? "";
}

function auditContext(audit: SiteAuditResult, pageCap = 8): string {
  const pages = audit.pages.slice(0, pageCap).map((p) => ({
    url: p.meta.finalUrl,
    title: p.title,
    description: p.metaDescription,
    h1: p.h1Texts[0],
    words: p.wordCount,
    headings: p.headingOutline.slice(0, 8).map((h) => `${" ".repeat(h.level - 1)}${h.text}`),
  }));
  const topIssues = audit.issues.slice(0, 40).map((i) => ({
    severity: i.severity,
    issue: i.title,
    page: i.pageUrl,
    detail: i.detail,
  }));
  return JSON.stringify(
    {
      domain: audit.domain,
      startUrl: audit.startUrl,
      overallScore: audit.scores.overall,
      grade: audit.scores.grade,
      categories: audit.scores.categories,
      pages,
      topIssues,
    },
    null,
    1,
  );
}

export async function aiMeta(audit: SiteAuditResult): Promise<AiResponse> {
  try {
    const raw = await complete(
      "You are an elite SEO copywriter. Given crawled page data, write optimized title tags (50-60 chars) and meta descriptions (120-155 chars) per page. Respond with ONLY valid JSON: [{\"pageUrl\":\"...\",\"title\":\"...\",\"description\":\"...\",\"rationale\":\"one sentence\"}]",
      auditContext(audit),
    );
    const meta = extractJson<AiMetaSuggestion[]>(raw);
    if (!meta || !Array.isArray(meta)) return { action: "meta", modelError: "Unparseable AI output" };
    return { action: "meta", meta: meta.slice(0, 10) };
  } catch (e) {
    return { action: "meta", modelError: String(e).slice(0, 300) };
  }
}

export async function aiKeywords(audit: SiteAuditResult): Promise<AiResponse> {
  try {
    const raw = await complete(
      "You are an expert keyword strategist. Given a website's crawled content, produce 12 realistic keyword opportunities the site should target: a mix of informational, commercial, transactional and navigational intents; include long-tail keywords with realistic difficulty estimates. Respond with ONLY valid JSON: [{\"keyword\":\"...\",\"intent\":\"informational|commercial|transactional|navigational\",\"difficulty\":\"low|medium|high\",\"suggestedPageType\":\"e.g. blog post / landing page / category page\",\"why\":\"one sentence\"}]",
      auditContext(audit),
    );
    const keywords = extractJson<AiKeywordIdea[]>(raw);
    if (!keywords || !Array.isArray(keywords)) return { action: "keywords", modelError: "Unparseable AI output" };
    return { action: "keywords", keywords: keywords.slice(0, 14) };
  } catch (e) {
    return { action: "keywords", modelError: String(e).slice(0, 300) };
  }
}

export async function aiBrief(audit: SiteAuditResult, topic?: string): Promise<AiResponse> {
  try {
    const raw = await complete(
      "You are a senior content strategist. Create one actionable content brief for the website, targeting its best keyword opportunity" +
        (topic ? ` (user-specified topic: ${topic})` : "") +
        '. Respond with ONLY valid JSON: {"targetKeyword":"...","workingTitle":"...","outline":["H2: ...","H3: ..."],"questionsToAnswer":["..."],"entitiesToMention":["..."],"wordCountTarget":1200}',
      auditContext(audit, 6),
    );
    const brief = extractJson<AiContentBrief>(raw);
    if (!brief || !brief.targetKeyword) return { action: "brief", modelError: "Unparseable AI output" };
    return { action: "brief", brief };
  } catch (e) {
    return { action: "brief", modelError: String(e).slice(0, 300) };
  }
}

export async function aiSchema(audit: SiteAuditResult): Promise<AiResponse> {
  try {
    const raw = await complete(
      'You are a structured-data expert. For the site homepage and 1-2 key pages, generate schema.org JSON-LD blocks (Organization + WebSite for the homepage; Article/Product/LocalBusiness/FAQPage where content suggests it). Use "@context":"https://schema.org". Invent plausible placeholder values ONLY from the crawled data; use "..." never. Respond with ONLY valid JSON: [{"pageUrl":"...","schemaType":"Organization|WebSite|Article|...","jsonLd":"<escaped JSON string>","whereToPlace":"e.g. <head> of homepage via <script type=application/ld+json>"}]',
      auditContext(audit, 4),
    );
    const schema = extractJson<AiSchemaSuggestion[]>(raw);
    if (!schema || !Array.isArray(schema)) return { action: "schema", modelError: "Unparseable AI output" };
    return { action: "schema", schema: schema.slice(0, 4) };
  } catch (e) {
    return { action: "schema", modelError: String(e).slice(0, 300) };
  }
}

export async function aiSummary(audit: SiteAuditResult): Promise<AiResponse> {
  try {
    const raw = await complete(
      "You are an SEO consultant presenting to a founder. Write an executive summary of this audit. Respond with ONLY valid JSON: {\"headline\":\"one line verdict\",\"paragraphs\":[\"2-3 short paragraphs\"],\"topActions\":[{\"priority\":1,\"action\":\"specific fix\",\"impact\":\"expected effect\"}]} — topActions: 5 items sorted by priority (1 = do first).",
      auditContext(audit, 8),
    );
    const summary = extractJson<AiSummary>(raw);
    if (!summary || !summary.headline) return { action: "summary", modelError: "Unparseable AI output" };
    return { action: "summary", summary };
  } catch (e) {
    return { action: "summary", modelError: String(e).slice(0, 300) };
  }
}

export async function aiNextjs(audit: SiteAuditResult): Promise<AiResponse> {
  try {
    const raw = await complete(
      "You are a Next.js App Router SEO expert. Generate ready-to-paste code fixes for this website (assume Next.js 14+ App Router): 1) app/layout.tsx or page-level `export const metadata` object with title/description/openGraph/twitter/metadataBase; 2) app/robots.ts; 3) app/sitemap.ts; 4) one JSON-LD <script> component. Use the real domain and best-guess page titles from the crawl. Respond with ONLY valid JSON: [{\"fileName\":\"app/layout.tsx\",\"language\":\"tsx\",\"code\":\"...\",\"explanation\":\"...\"}] — escape newlines properly in code strings.",
      auditContext(audit, 5),
    );
    const nextjs = extractJson<AiNextjsFixes[]>(raw);
    if (!nextjs || !Array.isArray(nextjs)) return { action: "nextjs", modelError: "Unparseable AI output" };
    return { action: "nextjs", nextjs: nextjs.slice(0, 5) };
  } catch (e) {
    return { action: "nextjs", modelError: String(e).slice(0, 300) };
  }
}
