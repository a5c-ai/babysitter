/**
 * Agent Detail API Route
 * GET /api/agents/[slug] - Get a single version-scoped ontology entry
 */

import { getUiAgentOntologyEntry } from "@a5c-ai/agent-catalog";
import { NextRequest } from "next/server";
import {
  createSuccessResponse,
  internalErrorResponse,
  notFoundResponse,
  validateSlug,
} from "@/lib/api/utils";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const validation = validateSlug(params.slug);
    if (!validation.valid) {
      return validation.error;
    }

    const agent = getUiAgentOntologyEntry(validation.slug);
    if (!agent) {
      return notFoundResponse("Agent", validation.slug);
    }

    return createSuccessResponse(agent);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
