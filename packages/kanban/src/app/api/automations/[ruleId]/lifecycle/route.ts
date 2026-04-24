import { NextResponse } from "next/server";

import { AppError, normalizeError } from "@/lib/error-handler";
import { ensureInitialized } from "@/lib/server-init";
import { AutomationRuleService, type AutomationRuleAction } from "@/lib/services/automation-rule-service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const service = new AutomationRuleService();

function readAction(value: unknown): Exclude<AutomationRuleAction, "delete"> {
  if (value === "enable" || value === "pause" || value === "resume" || value === "disable") {
    return value;
  }
  throw new AppError("action must be enable, pause, resume, or disable.", "BAD_REQUEST", 400);
}

export async function POST(
  request: Request,
  { params }: { params: { ruleId: string } },
) {
  try {
    await ensureInitialized();
    const body = (await request.json()) as Record<string, unknown>;
    const payload = await service.transitionRule(
      params.ruleId,
      readAction(body.action),
      typeof body.updatedBy === "string" ? body.updatedBy : undefined,
    );
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}
