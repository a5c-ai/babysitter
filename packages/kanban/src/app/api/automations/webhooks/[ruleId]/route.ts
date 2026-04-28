import { NextResponse } from "next/server";

import { normalizeError } from "@/lib/error-handler";
import { ensureInitialized } from "@/lib/server-init";
import { AutomationWebhookService } from "@/lib/services/automation-webhook-service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const service = new AutomationWebhookService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  try {
    const { ruleId } = await params;
    await ensureInitialized();
    const payload = await service.deliver({
      ruleId,
      requestPath: new URL(request.url).pathname,
      requestMethod: request.method,
      headers: request.headers,
      rawBody: await request.text(),
    });

    const status =
      payload.outcome === "created"
        ? 201
        : payload.code === "AUTOMATION_WEBHOOK_UNAUTHORIZED"
          ? 401
          : payload.code === "AUTOMATION_RULE_NOT_ACTIVE"
            ? 409
            : payload.outcome === "rejected"
              ? 400
              : 200;

    return NextResponse.json(payload, { status, headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}
