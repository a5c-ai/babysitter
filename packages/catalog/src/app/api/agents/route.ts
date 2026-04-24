/**
 * Agents API Route
 * GET /api/agents - List graph-backed agent ontology entries
 */

import { getUiAgentOntologyList } from "@a5c-ai/agent-catalog";
import { NextRequest } from "next/server";
import {
  createPaginatedResponse,
  internalErrorResponse,
  parseListQueryParams,
} from "@/lib/api/utils";
import type { AgentListItem } from "@/lib/api/types";

function sortValue(agent: AgentListItem, sort: string | undefined): string {
  switch (sort) {
    case "versionRange":
      return agent.versionRange;
    case "provider":
      return agent.providers[0]?.displayName ?? "";
    case "capability":
      return agent.capabilities[0]?.label ?? "";
    default:
      return agent.name;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { limit = 20, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const provider = searchParams.get("provider");
    const transport = searchParams.get("transport");
    const modality = searchParams.get("modality");
    const capability = searchParams.get("capability");

    let agents = getUiAgentOntologyList();

    if (provider) {
      agents = agents.filter((agent) =>
        agent.providers.some(
          (entry) => entry.providerId === provider || entry.displayName === provider,
        ),
      );
    }

    if (transport) {
      agents = agents.filter((agent) =>
        agent.transports.some(
          (entry) => entry.transportId === transport || entry.label === transport,
        ),
      );
    }

    if (modality) {
      agents = agents.filter((agent) =>
        agent.modalities.some(
          (entry) => entry.modalityId === modality || entry.label === modality,
        ),
      );
    }

    if (capability) {
      agents = agents.filter((agent) =>
        agent.capabilities.some(
          (entry) => entry.capabilityId === capability || entry.label === capability,
        ),
      );
    }

    agents.sort((left, right) => {
      const direction = order === "desc" ? -1 : 1;
      return sortValue(left, sort).localeCompare(sortValue(right, sort), undefined, {
        sensitivity: "base",
      }) * direction;
    });

    const total = agents.length;
    return createPaginatedResponse(agents.slice(offset, offset + limit), total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
