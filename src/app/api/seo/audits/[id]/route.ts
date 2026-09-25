import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { AuditHistoryPoint, SiteAuditResult } from "@/lib/seo/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const row = await db.seoAudit.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    // history for the same domain (last 20 runs, oldest first)
    const historyRows = await db.seoAudit.findMany({
      where: { domain: row.domain },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const history: AuditHistoryPoint[] = historyRows
      .slice()
      .reverse()
      .map((r) => ({
        id: r.id,
        overallScore: r.overallScore,
        grade: r.grade,
        technicalScore: r.technicalScore,
        contentScore: r.contentScore,
        socialScore: r.socialScore,
        structuredScore: r.structuredScore,
        mobileScore: r.mobileScore,
        performanceScore: r.performanceScore,
        aiReadinessScore: r.aiReadinessScore,
        createdAt: r.createdAt.toISOString(),
      }));

    const result = JSON.parse(row.result) as SiteAuditResult;
    return NextResponse.json({
      id: row.id,
      domain: row.domain,
      startUrl: row.startUrl,
      createdAt: row.createdAt.toISOString(),
      result,
      history,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to load audit: ${String(err).slice(0, 200)}` },
      { status: 500 },
    );
  }
}
