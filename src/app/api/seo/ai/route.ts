import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  aiBrief,
  aiKeywords,
  aiMeta,
  aiNextjs,
  aiSchema,
  aiSummary,
} from "@/lib/seo/ai";
import type { AiAction, AiResponse, SiteAuditResult } from "@/lib/seo/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VALID_ACTIONS: AiAction[] = ["meta", "keywords", "brief", "schema", "summary", "nextjs"];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { auditId?: string; action?: AiAction; topic?: string };
    const action = body.action;
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!body.auditId) {
      return NextResponse.json({ error: "auditId is required" }, { status: 400 });
    }
    const row = await db.seoAudit.findUnique({ where: { id: body.auditId } });
    if (!row) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    const audit = JSON.parse(row.result) as SiteAuditResult;

    let response: AiResponse;
    switch (action) {
      case "meta":
        response = await aiMeta(audit);
        break;
      case "keywords":
        response = await aiKeywords(audit);
        break;
      case "brief":
        response = await aiBrief(audit, body.topic);
        break;
      case "schema":
        response = await aiSchema(audit);
        break;
      case "summary":
        response = await aiSummary(audit);
        break;
      case "nextjs":
        response = await aiNextjs(audit);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error("AI action failed:", err);
    return NextResponse.json(
      { error: `AI action failed: ${String(err).slice(0, 300)}` },
      { status: 500 },
    );
  }
}
