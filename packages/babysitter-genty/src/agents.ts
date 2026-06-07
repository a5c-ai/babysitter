/**
 * BabysitterAgentProvider — implements the ExternalAgentProvider interface
 * using babysitter-sdk's external agent discovery.
 */

import type {
  ExternalAgentProvider,
  AgentInfo,
} from "@a5c-ai/genty-platform/orchestration";
import { discoverExternalAgents } from "@a5c-ai/babysitter-sdk";

export class BabysitterAgentProvider implements ExternalAgentProvider {
  async discoverAgents(workspace: string): Promise<AgentInfo[]> {
    const discovery = await discoverExternalAgents({ cwd: workspace });
    if (!discovery.available) {
      return [];
    }

    return discovery.agents.map((agent) => ({
      name: agent.name,
      path: workspace,
      description: agent.displayName !== agent.name ? agent.displayName : undefined,
    }));
  }
}
