import { Type } from "@sinclair/typebox";
import type { AgenticToolOptions, CustomToolDefinition } from "../types";
import { errorResult, jsonResult } from "../shared/results";
import { getBackgroundRegistry } from "./state";

export function createBackgroundTools(options: AgenticToolOptions): CustomToolDefinition[] {
  return [
    {
      name: "background_status",
      label: "Background Task Status",
      description:
        "Query the status of a background task by its backgroundTaskId. Returns the task record including status, stdout, stderr, and exit code.",
      parameters: Type.Object({
        backgroundTaskId: Type.String({
          description: "The backgroundTaskId returned when launching a background task",
        }),
      }),
      execute: (_toolCallId, params) => {
        const backgroundTaskId = String(params.backgroundTaskId);
        const record = getBackgroundRegistry(options).get(backgroundTaskId);
        if (!record) {
          return errorResult(`Background task not found: ${backgroundTaskId}`);
        }
        return jsonResult(record);
      },
    },
    {
      name: "background_list",
      label: "List Background Tasks",
      description: "List all tracked background tasks with their current status.",
      parameters: Type.Object({}),
      execute: () => jsonResult({
        tasks: getBackgroundRegistry(options).list(),
      }),
    },
  ];
}
