import { NextResponse } from "next/server";

import { normalizeError } from "@/lib/error-handler";
import { ensureInitialized } from "@/lib/server-init";
import { AutomationRuleService } from "@/lib/services/automation-rule-service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const service = new AutomationRuleService();

export async function GET(
  _request: Request,
  { params }: { params: { ruleId: string } },
) {
  try {
    await ensureInitialized();
    const payload = await service.getRule(params.ruleId);
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { ruleId: string } },
) {
  try {
    await ensureInitialized();
    const body = (await request.json()) as Record<string, unknown>;
    const payload = await service.updateRule(params.ruleId, body);
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { ruleId: string } },
) {
  try {
    await ensureInitialized();
    const payload = await service.deleteRule(params.ruleId);
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}
