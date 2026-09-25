import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMarkdownReport } from "@/lib/seo/report";
import type { SiteAuditResult } from "@/lib/seo/types";

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
    const audit = JSON.parse(row.result) as SiteAuditResult;
    const markdown = generateMarkdownReport(audit);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="seo-audit-${row.domain}.md"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Report generation failed: ${String(err).slice(0, 200)}` },
      { status: 500 },
    );
  }
}
