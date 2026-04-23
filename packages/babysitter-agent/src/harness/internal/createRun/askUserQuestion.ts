import * as readline from "node:readline";
import {
  createAskUserQuestionResponse,
  createDefaultAskUserQuestionResponse,
  promptAskUserQuestionWithUiContext,
  promptAskUserQuestionWithReadline,
  validateAskUserQuestionRequest,
  type AskUserQuestionRequest,
  type AskUserQuestionResponse,
} from "../../../interaction";
import {
  BOLD,
  CYAN,
  DIM,
  RESET,
} from "./output";
import type {
  AskUserQuestionToolContext,
  OutputMode,
  ToolResultShape,
} from "./utils";

export const DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS = 600_000;

export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });
}

export function askLine(
  rl: readline.Interface,
  promptText: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    rl.question(`${promptText} `, (answer) => {
      resolve(answer);
    });
    rl.once("close", () => resolve(null));
  });
}

export async function readInteractivePrompt(
  rl: readline.Interface,
  outputMode?: OutputMode,
): Promise<string | null> {
  if (outputMode === "tui") return null;

  process.stderr.write("\n");
  process.stderr.write(
    `${BOLD}${CYAN}babysitter-agent create-run${RESET}\n`,
  );
  process.stderr.write(
    `${DIM}Enter your request below. Press Enter to submit.${RESET}\n`,
  );
  process.stderr.write(
    `${DIM}(Use \\ at end of line for multi-line input, Ctrl+C to cancel)${RESET}\n\n`,
  );

  const lines: string[] = [];
  for (;;) {
    const line = await askLine(rl, lines.length === 0 ? ">" : "...");
    if (line === null) return null;
    if (line.endsWith("\\")) {
      lines.push(line.slice(0, -1));
      continue;
    }
    lines.push(line);
    const combined = lines.join("\n").trim();
    if (combined) return combined;
    lines.length = 0;
  }
}

export function formatToolResult(data: unknown, message?: string): ToolResultShape {
  if (typeof data === "string") {
    return {
      content: [{
        type: "text",
        text: message ? `${message}\n${data}` : data,
      }],
      details: data,
    };
  }
  const content = message
    ? `${message}\n${JSON.stringify(data, null, 2)}`
    : JSON.stringify(data, null, 2);
  return {
    content: [{
      type: "text",
      text: content,
    }],
    details: data,
  };
}

export function isApprovalAskRequest(request: AskUserQuestionRequest): boolean {
  const question = request.questions[0];
  if (!question || request.questions.length !== 1 || !question.options) {
    return false;
  }
  const labels = question.options.map((option) => option.label);
  return labels.length === 2 &&
    labels[0] === "Approve" &&
    labels[1] === "Reject" &&
    question.allowOther === false;
}

export async function askUserQuestionViaTool(
  request: AskUserQuestionRequest,
  interactive: boolean,
  rl: readline.Interface | null,
  toolContext?: AskUserQuestionToolContext,
): Promise<AskUserQuestionResponse> {
  const effectiveRequest = interactive && request.timeout == null
    ? {
      ...request,
      timeout: DEFAULT_INTERACTIVE_ASK_TIMEOUT_MS,
    }
    : request;

  validateAskUserQuestionRequest(effectiveRequest);

  if (interactive) {
    try {
      if (toolContext?.hasUI && toolContext.ui) {
        return await promptAskUserQuestionWithUiContext(toolContext.ui, effectiveRequest);
      }
      if (rl) {
        return await promptAskUserQuestionWithReadline(rl, effectiveRequest);
      }
    } catch {
      return createDefaultAskUserQuestionResponse(effectiveRequest);
    }
  }

  const answers: Record<string, string> = {};
  for (const [index, question] of effectiveRequest.questions.entries()) {
    const key = question.header?.trim() || `Question ${index + 1}`;
    if (
      question.recommended != null &&
      question.options &&
      question.options[question.recommended]
    ) {
      answers[key] = question.options[question.recommended].label;
    } else {
      answers[key] = "";
    }
  }
  if (isApprovalAskRequest(effectiveRequest)) {
    const key = effectiveRequest.questions[0]?.header?.trim() || "Decision";
    const rec = effectiveRequest.questions[0]?.recommended;
    const opts = effectiveRequest.questions[0]?.options;
    if (rec != null && opts && opts[rec]) {
      answers[key] = opts[rec].label;
    } else {
      answers[key] = "Approve";
    }
  }
  return createAskUserQuestionResponse(effectiveRequest, answers);
}
