export interface AgentCliProgram {
  readonly variant: "agent";
  readonly commandName: "babysitter-agent";
  readonly packageName: "@a5c-ai/babysitter-agent";
}

export const AGENT_PROGRAM: AgentCliProgram = {
  variant: "agent",
  commandName: "babysitter-agent",
  packageName: "@a5c-ai/babysitter-agent",
};
