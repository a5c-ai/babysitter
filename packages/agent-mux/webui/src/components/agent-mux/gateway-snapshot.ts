export type GatewayBootstrapResponse = {
  agents?: { agents: unknown[]; agentDescriptors?: unknown[] };
  runs?: { runs: Array<Record<string, unknown>> };
  sessions?: { sessions: Array<Record<string, unknown>> };
};

export async function loadGatewayBootstrapSnapshot(fetcher: (pathname: string) => Promise<unknown>): Promise<GatewayBootstrapResponse> {
  const [agents, runs, sessions] = await Promise.allSettled([
    fetcher("/api/v1/agents"),
    fetcher("/api/v1/dispatches"),
    fetcher("/api/v1/sessions"),
  ]);

  return {
    agents: agents.status === "fulfilled"
      ? (agents.value as GatewayBootstrapResponse["agents"])
      : undefined,
    runs: runs.status === "fulfilled"
      ? (runs.value as GatewayBootstrapResponse["runs"])
      : undefined,
    sessions: sessions.status === "fulfilled"
      ? (sessions.value as GatewayBootstrapResponse["sessions"])
      : undefined,
  };
}
