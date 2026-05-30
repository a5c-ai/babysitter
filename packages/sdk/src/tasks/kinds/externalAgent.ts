import type {
  AgentTaskDefinitionOptions,
  DefinedTask,
} from "../types";
import { agentTask } from "./index";

export function externalAgentTask<TArgs = unknown, TResult = unknown>(
  id: string,
  options: AgentTaskDefinitionOptions<TArgs>
): DefinedTask<TArgs, TResult> {
  return agentTask<TArgs, TResult>(id, {
    ...options,
    external: true,
    responderType: "agent",
  });
}
