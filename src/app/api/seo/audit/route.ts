import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAudit } from "@/lib/seo/audit-engine";
import type { AuditRequest, SiteAuditResult } from "@/lib/seo/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 120;

function normalizeStartUrl(raw: string): string | null {
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    if (u.hostname === "localhost" || /^127\.|^10\.|^192\.168\.|^0\./.test(u.hostname))
      return null; // no internal targets
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AuditRequest;
    const startUrl = normalizeStartUrl(body.url ?? "");
    if (!startUrl) {
      return NextResponse.json(
        { error: "Please provide a valid public website URL (e.g. example.com)." },
        { status: 400 },
      );
    }
    const maxPages = Math.min(Math.max(body.maxPages ?? 8, 1), 25);

    const result: SiteAuditResult = await runAudit(startUrl, maxPages);

    const record = await db.seoAudit.create({
      data: {
        domain: result.domain,
        startUrl: result.startUrl,
        overallScore: result.scores.overall,
        grade: result.scores.grade,
        technicalScore: result.scores.categories.find((c) => c.key === "technical")?.score ?? 0,
        contentScore: result.scores.categories.find((c) => c.key === "content")?.score ?? 0,
        socialScore: result.scores.categories.find((c) => c.key === "social")?.score ?? 0,
        structuredScore: result.scores.categories.find((c) => c.key === "structured")?.score ?? 0,
        mobileScore: result.scores.categories.find((c) => c.key === "mobile")?.score ?? 0,
        performanceScore: result.scores.categories.find((c) => c.key === "performance")?.score ?? 0,
        aiReadinessScore: result.scores.categories.find((c) => c.key === "aiReadiness")?.score ?? 0,
        pagesAudited: result.pages.length,
        criticalCount: result.scores.critical,
        warningCount: result.scores.warning,
        infoCount: result.scores.info,
        durationMs: result.durationMs,
        result: JSON.stringify(result),
      },
    });

    return NextResponse.json(
      { id: record.id, result },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    console.error("audit failed:", err);
    return NextResponse.json(
      { error: `Audit failed: ${String(err).slice(0, 300)}` },
      { status: 500 },
    );
  }
}
