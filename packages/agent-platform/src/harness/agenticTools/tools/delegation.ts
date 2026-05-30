import { Type } from "@sinclair/typebox";
import type { AgenticToolOptions, CustomToolDefinition } from "../types";
import { errorResult, jsonResult, ok } from "../shared/results";

export function createDelegationTools(options: AgenticToolOptions): CustomToolDefinition[] {
  return [
    {
      name: "AskUserQuestion",
      label: "Ask User Question",
      description:
        "Ask the user one or more structured questions. Delegates to the injected askUserQuestionHandler.",
      promptSnippet:
        "Ask the user focused clarification questions when you need missing requirements.",
      parameters: Type.Object({
        mode: Type.Optional(Type.Union([Type.Literal("simple"), Type.Literal("structured")], {
          description: "Interaction mode. Default: structured",
        })),
        question: Type.Optional(Type.String({ description: "Single question text for simple mode" })),
        questions: Type.Optional(Type.Array(
          Type.Object({
            id: Type.String({ description: "Unique question identifier" }),
            question: Type.String({ description: "Question text" }),
            options: Type.Optional(Type.Array(Type.Object({
              label: Type.String({ description: "Option label" }),
            }))),
            multi: Type.Optional(Type.Boolean({ description: "Allow multiple selections" })),
            recommended: Type.Optional(Type.Number({ description: "Index of recommended option" })),
          }),
          { description: "Questions to ask the user" },
        )),
      }),
      execute: async (_toolCallId, params) => {
        if (!options.askUserQuestionHandler) {
          return errorResult("No askUserQuestionHandler provided.");
        }

        const mode = (params.mode as string) ?? "structured";
        if (mode === "simple") {
          const question = params.question as string | undefined;
          if (!question) {
            return errorResult("Error: 'question' param is required when mode='simple'.");
          }
          const response = await options.askUserQuestionHandler({
            questions: [{
              id: "_simple",
              text: question,
              options: undefined,
              allowMultiple: false,
              recommendedIndex: undefined,
            }],
          });
          const answers = (response as { answers?: Array<{ answer?: string }> }).answers;
          return ok(answers?.[0]?.answer ?? "");
        }

        const questions = params.questions as Array<{
          id: string;
          question: string;
          options?: Array<{ label: string }>;
          multi?: boolean;
          recommended?: number;
        }> | undefined;
        if (!questions) {
          return errorResult("Error: 'questions' param is required when mode='structured'.");
        }
        const response = await options.askUserQuestionHandler({
          questions: questions.map((question) => ({
            id: question.id,
            text: question.question,
            options: question.options?.map((option) => ({ value: option.label, label: option.label })),
            allowMultiple: question.multi,
            recommendedIndex: question.recommended,
          })),
        });
        return jsonResult(response);
      },
    },
    {
      name: "task",
      label: "Task",
      description:
        "Delegate a bounded task to a fresh worker context. The host decides whether to use an internal worker session or another harness.",
      promptSnippet: "Use this for substantial delegated work that should run in a fresh context.",
      parameters: createDelegatedTaskSchema("Task prompt for the delegated worker"),
      execute: async (_toolCallId, params) => {
        if (!options.taskHandler) {
          return errorResult("No taskHandler provided.");
        }
        return jsonResult(await options.taskHandler(params));
      },
    },
    createNativeTaskTool(
      options,
      "create_todo",
      "Create Todo",
      "Create a todo through the host task router. Hosts with tasks-mux support should route this through tasks-mux.",
      Type.Object({
        title: Type.String({ description: "Short todo title" }),
        description: Type.Optional(Type.String({ description: "Optional todo details" })),
        ...nativeRoutingProperties(),
      }),
    ),
    createNativeTaskTool(
      options,
      "assign_task",
      "Assign Task",
      "Assign a task through the host task router. Hosts with tasks-mux support should route this through tasks-mux.",
      Type.Object({
        title: Type.String({ description: "Task title" }),
        instructions: Type.Optional(Type.String({ description: "Task instructions or acceptance notes" })),
        assignee: Type.Optional(Type.String({ description: "Responder id to assign to" })),
        ...nativeRoutingProperties(),
      }),
    ),
    createNativeTaskTool(
      options,
      "search_tasks",
      "Search Tasks",
      "Search tasks visible to the host task router.",
      Type.Object({
        query: Type.Optional(Type.String({ description: "Search text" })),
        status: Type.Optional(Type.String({ description: "Task status filter" })),
        responderId: Type.Optional(Type.String({ description: "Responder id filter" })),
        domain: Type.Optional(Type.String({ description: "Domain filter" })),
        tags: Type.Optional(Type.Array(Type.String(), { description: "Required tags" })),
        limit: Type.Optional(Type.Number({ description: "Maximum number of tasks to return" })),
      }),
    ),
    createNativeTaskTool(
      options,
      "escalate",
      "Escalate",
      "Escalate an existing task or create a high-urgency routed intervention.",
      Type.Object({
        taskId: Type.Optional(Type.String({ description: "Existing task id to escalate" })),
        title: Type.Optional(Type.String({ description: "Escalation title" })),
        reason: Type.String({ description: "Why escalation is required" }),
        targetResponderId: Type.Optional(Type.String({ description: "Responder id to receive escalation" })),
        ...nativeRoutingProperties(),
      }),
    ),
    {
      name: "skill",
      label: "Skill",
      description:
        "Load one or more skill instructions into a fresh worker context and execute a bounded task with them.",
      promptSnippet: "Use this when a local skill should guide delegated execution.",
      parameters: Type.Object({
        ...createDelegatedTaskSchema("Task prompt to execute with the loaded skill instructions").properties,
        skills: Type.Array(Type.String(), {
          minItems: 1,
          description: "Skill names or SKILL.md file paths to load",
        }),
      }),
      execute: async (_toolCallId, params) => {
        if (!options.skillHandler) {
          return errorResult("No skillHandler provided.");
        }
        return jsonResult(await options.skillHandler(params));
      },
    },
  ];
}

function createDelegatedTaskSchema(taskDescription: string) {
  return Type.Object({
    task: Type.String({ description: taskDescription }),
    harness: Type.Optional(Type.String({ description: "Preferred harness name" })),
    model: Type.Optional(Type.String({ description: "Preferred model" })),
    timeout: Type.Optional(Type.Number({ description: "Timeout in ms for the delegated task" })),
    toolsMode: Type.Optional(Type.Union([
      Type.Literal("default"),
      Type.Literal("coding"),
      Type.Literal("readonly"),
    ])),
    thinkingLevel: Type.Optional(Type.Union([
      Type.Literal("none"),
      Type.Literal("low"),
      Type.Literal("medium"),
      Type.Literal("high"),
    ])),
    bashSandbox: Type.Optional(Type.Union([
      Type.Literal("auto"),
      Type.Literal("secure"),
      Type.Literal("local"),
    ])),
    skills: Type.Optional(Type.Array(Type.String(), {
      description: "Skill names or skill file paths to load into the delegated worker context",
    })),
    subagentName: Type.Optional(Type.String({ description: "Preferred subagent/agent directory name" })),
  });
}

function createNativeTaskTool(
  options: AgenticToolOptions,
  name: "create_todo" | "assign_task" | "search_tasks" | "escalate",
  label: string,
  description: string,
  parameters: CustomToolDefinition["parameters"],
): CustomToolDefinition {
  return {
    name,
    label,
    description,
    promptSnippet: `Use ${name} when work should be visible to the host task router.`,
    parameters,
    execute: async (_toolCallId, params) => {
      if (!options.taskHandler) {
        return errorResult("No taskHandler provided.");
      }
      return jsonResult(await options.taskHandler({
        ...params,
        tool: name,
        action: name,
      }));
    },
  };
}

function nativeRoutingProperties() {
  return {
    responderId: Type.Optional(Type.String({ description: "Preferred responder id" })),
    responderType: Type.Optional(Type.Union([
      Type.Literal("human"),
      Type.Literal("agent"),
      Type.Literal("tracker"),
      Type.Literal("internal"),
      Type.Literal("auto"),
    ], { description: "Preferred responder type" })),
    adapter: Type.Optional(Type.String({ description: "Agent adapter hint" })),
    model: Type.Optional(Type.String({ description: "Model hint" })),
    provider: Type.Optional(Type.String({ description: "Provider hint" })),
    trackerBackend: Type.Optional(Type.String({ description: "External tracker backend hint" })),
    fallbackType: Type.Optional(Type.Union([
      Type.Literal("human"),
      Type.Literal("agent"),
      Type.Literal("tracker"),
      Type.Literal("internal"),
      Type.Literal("auto"),
    ], { description: "Fallback responder type" })),
    tags: Type.Optional(Type.Array(Type.String(), { description: "Task tags" })),
    domain: Type.Optional(Type.String({ description: "Task domain" })),
    urgency: Type.Optional(Type.Union([
      Type.Literal("low"),
      Type.Literal("medium"),
      Type.Literal("high"),
    ], { description: "Task urgency" })),
    sourceUrl: Type.Optional(Type.String({ description: "Source URL" })),
  };
}
