import { NextResponse } from "next/server";

import type { AutomationRuleLifecycleState } from "../../../../../agent-mux/core/src/automation.js";

import { AppError, normalizeError } from "@/lib/error-handler";
import { ensureInitialized } from "@/lib/server-init";
import {
  AutomationRuleService,
  isAutomationRuleState,
  isAutomationTriggerType,
  type AutomationRuleQuery,
  type AutomationTriggerType,
} from "@/lib/services/automation-rule-service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const service = new AutomationRuleService();

function readQueryValues(searchParams: URLSearchParams, name: string): string[] {
  return Array.from(
    new Set(
      searchParams
        .getAll(name)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function parseQuery(request: Request): AutomationRuleQuery {
  const { searchParams } = new URL(request.url);

  const states = readQueryValues(searchParams, "state");
  for (const state of states) {
    if (!isAutomationRuleState(state)) {
      throw new AppError(`Invalid state query value: ${state}`, "BAD_REQUEST", 400);
    }
  }

  const triggerTypes = readQueryValues(searchParams, "triggerType");
  for (const triggerType of triggerTypes) {
    if (!isAutomationTriggerType(triggerType)) {
      throw new AppError(`Invalid triggerType query value: ${triggerType}`, "BAD_REQUEST", 400);
    }
  }

  return {
    state: states as AutomationRuleLifecycleState[],
    triggerType: triggerTypes as AutomationTriggerType[],
    projectId: searchParams.get("projectId")?.trim() || undefined,
    boardProjectId: searchParams.get("boardProjectId")?.trim() || undefined,
    search: searchParams.get("search")?.trim() || undefined,
    includeArchived: searchParams.get("includeArchived") === "true",
  };
}

export async function GET(request: Request) {
  try {
    await ensureInitialized();
    const payload = await service.listRules(parseQuery(request));
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureInitialized();
    const body = (await request.json()) as Record<string, unknown>;
    const payload = await service.createRule(body);
    return NextResponse.json(payload, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}
