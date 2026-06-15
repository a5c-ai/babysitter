export interface AgentCliProgram {
  readonly variant: "agent";
  readonly commandName: "genty";
  readonly packageName: "@a5c-ai/genty";
}

export const AGENT_PROGRAM: AgentCliProgram = {
  variant: "agent",
  commandName: "genty",
  packageName: "@a5c-ai/genty",
};
