import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { AuditRecordSummary } from "@/lib/seo/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.seoAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const audits: AuditRecordSummary[] = rows.map((r) => ({
      id: r.id,
      domain: r.domain,
      startUrl: r.startUrl,
      overallScore: r.overallScore,
      grade: r.grade,
      pagesAudited: r.pagesAudited,
      criticalCount: r.criticalCount,
      warningCount: r.warningCount,
      infoCount: r.infoCount,
      durationMs: r.durationMs,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({ audits });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to list audits: ${String(err).slice(0, 200)}` },
      { status: 500 },
    );
  }
}
