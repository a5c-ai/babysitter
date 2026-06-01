export interface AgentCliProgram {
  readonly variant: "agent";
  readonly commandName: "tula";
  readonly packageName: "@a5c-ai/tula";
}

export const AGENT_PROGRAM: AgentCliProgram = {
  variant: "agent",
  commandName: "tula",
  packageName: "@a5c-ai/tula",
};
