// ─── SEO Autopilot Engine — shared contract ─────────────────────────────
// Used by the crawler, audit engine, AI services, API routes and the UI.

export type IssueSeverity = "critical" | "warning" | "info";

export type IssueCategory =
  | "technical"
  | "content"
  | "social"
  | "structured-data"
  | "mobile"
  | "performance"
  | "ai-readiness";

export interface IssueDescriptor {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  explanation: string;
  howToFix: string;
}

export interface AuditIssueInstance {
  issueId: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  pageUrl?: string; // undefined = site-level issue
  detail?: string; // concrete finding (e.g. the actual URL/value)
}

// ─── Per-page audit ──────────────────────────────────────────────────────

export interface PageMeta {
  url: string;
  finalUrl: string;
  status: number;
  redirectChain: string[];
  responseTimeMs: number;
  bytes: number;
  contentType: string;
  xRobotsTag?: string; // value of the X-Robots-Tag response header
}

export interface PageAudit {
  meta: PageMeta;
  title?: string;
  titleLength: number;
  metaDescription?: string;
  metaDescriptionLength: number;
  canonical?: string;
  robotsMeta?: string;
  h1Count: number;
  h1Texts: string[];
  headingOutline: { level: number; text: string }[];
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  imagesTotal: number;
  imagesMissingAlt: number;
  hasOpenGraph: boolean;
  hasOgImage: boolean;
  ogUrl?: string; // absolute og:url value
  ogImageUrl?: string; // absolute og:image value
  twitterImageUrl?: string; // absolute twitter:image value
  hasTwitterCard: boolean;
  hasFaviconLink: boolean; // <link rel="icon"> present in head
  scriptCount: number; // number of <script> tags (JS-only detection)
  hasViewport: boolean;
  lang?: string;
  charset?: string;
  jsonLdTypes: string[];
  textRatio: number; // 0..1 visible text vs HTML
  domNodeCount: number;
  hasHttps: boolean;
}

// ─── Site-level findings ─────────────────────────────────────────────────

export interface SiteExtras {
  hasRobotsTxt: boolean;
  robotsTxtBytes: number;
  robotsHasSitemap: boolean;
  robotsAiBotsBlocked: boolean;
  hasSitemap: boolean;
  sitemapUrlCount: number;
  hasFavicon: boolean;
  hasLlmsTxt: boolean; // AI-crawler guidance file
  hasManifest: boolean;
  mixedContentCount: number;
  brokenInternalLinks: string[]; // URLs that returned 4xx/5xx
  checkedInternalLinks: number;
  allTitles: { url: string; title: string }[];
  allMetaDescriptions: { url: string; description: string }[];
  allCanonicals: { url: string; canonical: string | null; self: boolean }[];
  contentFingerprints: { url: string; hash: string }[];
  protocol: "https" | "http";
}

// ─── Scores & result ─────────────────────────────────────────────────────

export type ScoreKey =
  | "technical"
  | "content"
  | "social"
  | "structured"
  | "mobile"
  | "performance"
  | "aiReadiness";

export interface CategoryScore {
  key: ScoreKey;
  label: string;
  score: number; // 0..100
}

export interface ScoreSummary {
  overall: number; // 0..100
  grade: string; // A+ .. F
  categories: CategoryScore[];
  critical: number;
  warning: number;
  info: number;
}

export interface SiteAuditResult {
  version: 2; // v2 = strict scoring model (hard caps, realistic weights)
  startUrl: string;
  domain: string;
  crawledAt: string; // ISO
  durationMs: number;
  pages: PageAudit[];
  site: SiteExtras;
  issues: AuditIssueInstance[];
  scores: ScoreSummary;
}

// ─── AI payload shapes ───────────────────────────────────────────────────

export interface AiMetaSuggestion {
  pageUrl: string;
  title: string;
  description: string;
  rationale: string;
}

export interface AiKeywordIdea {
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  difficulty: "low" | "medium" | "high";
  suggestedPageType: string;
  why: string;
}

export interface AiContentBrief {
  targetKeyword: string;
  workingTitle: string;
  outline: string[];
  questionsToAnswer: string[];
  entitiesToMention: string[];
  wordCountTarget: number;
}

export interface AiSchemaSuggestion {
  pageUrl: string;
  schemaType: string;
  jsonLd: string; // formatted JSON
  whereToPlace: string;
}

export interface AiSummary {
  headline: string;
  paragraphs: string[];
  topActions: { priority: 1 | 2 | 3; action: string; impact: string }[];
}

export interface AiNextjsFixes {
  fileName: string;
  language: string;
  code: string;
  explanation: string;
}

export type AiAction =
  | "meta"
  | "keywords"
  | "brief"
  | "schema"
  | "summary"
  | "nextjs";

export interface AiResponse {
  action: AiAction;
  meta?: AiMetaSuggestion[];
  keywords?: AiKeywordIdea[];
  brief?: AiContentBrief;
  schema?: AiSchemaSuggestion[];
  summary?: AiSummary;
  nextjs?: AiNextjsFixes[];
  modelError?: string;
}

// ─── API request/response shapes ─────────────────────────────────────────

export interface AuditRequest {
  url: string;
  maxPages?: number; // default 8, clamp 1..25
}

export interface AuditRecordSummary {
  id: string;
  domain: string;
  startUrl: string;
  overallScore: number;
  grade: string;
  pagesAudited: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  durationMs: number;
  createdAt: string;
}

export interface AuditHistoryPoint {
  id: string;
  overallScore: number;
  grade: string;
  technicalScore: number;
  contentScore: number;
  socialScore: number;
  structuredScore: number;
  mobileScore: number;
  performanceScore: number;
  aiReadinessScore: number;
  createdAt: string;
}

export interface ReportMeta {
  id: string;
  domain: string;
  createdAt: string;
}
