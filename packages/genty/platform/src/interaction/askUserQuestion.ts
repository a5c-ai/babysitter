import * as readline from "node:readline";
import {
  createAskUserQuestionResponse,
  createDefaultAskUserQuestionResponse,
  getQuestionKey,
  parseOptionAnswer,
  resolveOption,
  validateAskUserQuestionRequest,
} from "./askUserQuestion/core";
import {
  BOLD,
  CYAN,
  DIM,
  RESET,
  YELLOW,
  isTTYInput,
  promptArrowKeySelect,
} from "./askUserQuestion/terminal";

import type {
  AskUserQuestionOption,
  AskUserQuestionQuestion,
  AskUserQuestionRequest,
  AskUserQuestionResponse,
  AskUserQuestionUiContext,
} from "./askUserQuestionTypes";
export type {
  AskUserQuestionOption,
  AskUserQuestionQuestion,
  AskUserQuestionRequest,
  AskUserQuestionResponse,
  AskUserQuestionUiContext,
} from "./askUserQuestionTypes";

function askLine(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${CYAN}?${RESET} ${prompt} `, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

export {
  createAskUserQuestionResponse,
  createDefaultAskUserQuestionResponse,
  validateAskUserQuestionRequest,
};

export function createApprovalAskUserQuestion(
  question: string,
  header: string = "Decision",
): AskUserQuestionRequest {
  return {
    questions: [
      {
        header,
        question,
        options: [
          {
            label: "Approve",
            description: "Continue the orchestration loop.",
          },
          {
            label: "Reject",
            description: "Block the breakpoint and return a rejected decision.",
          },
        ],
        allowOther: false,
        required: true,
      },
    ],
  };
}

function formatUiPromptTitle(question: AskUserQuestionQuestion): string {
  const lines = [question.question.trim()];
  if (question.options?.length) {
    lines.push("");
    for (const [index, option] of question.options.entries()) {
      const detailParts = [option.description?.trim(), option.preview?.trim()].filter(Boolean);
      const detail = detailParts.length > 0 ? ` - ${detailParts.join(" | ")}` : "";
      lines.push(`${index + 1}. ${option.label}${detail}`);
    }
  }
  return lines.join("\n");
}

function buildUiTitle(question: AskUserQuestionQuestion): string {
  const header = question.header?.trim();
  const body = formatUiPromptTitle(question);
  return header ? `${header}\n\n${body}` : body;
}

export function createReadlineAskUserQuestionUiContext(
  rl: readline.Interface,
): AskUserQuestionUiContext {
  return {
    async select(title: string, options: string[]): Promise<string | undefined> {
      process.stderr.write(`${title}\n`);

      // Use arrow-key selector when stdin is a TTY
      if (isTTYInput(process.stdin)) {
        const idx = await promptArrowKeySelect(
          process.stdin,
          process.stderr,
          options,
        );
        if (idx == null || typeof idx !== "number") return undefined;
        return options[idx];
      }

      // Fallback: line-based prompt
      for (const [index, option] of options.entries()) {
        process.stderr.write(`  ${index + 1}. ${option}\n`);
      }
      let matched: AskUserQuestionOption | undefined;
      while (!matched) {
        const answer = await askLine(rl, "Choose an option (number or label)");
        if (!answer) {
          return undefined;
        }
        matched = resolveOption(answer, options.map((label) => ({ label })));
        if (matched) {
          return matched.label;
        }
        process.stderr.write(`${YELLOW}Please choose a valid option.${RESET}\n`);
      }
    },
    async input(title: string, placeholder?: string): Promise<string | undefined> {
      process.stderr.write(`${title}\n`);
      const answer = await askLine(rl, placeholder?.trim() || "Answer");
      return answer || undefined;
    },
    async confirm(title: string, message: string): Promise<boolean> {
      process.stderr.write(`${title}\n${message}\n`);
      const answer = await askLine(rl, "Confirm (y/N)");
      return ["y", "yes"].includes(answer.trim().toLowerCase());
    },
  };
}

export async function promptAskUserQuestionWithUiContext(
  ui: AskUserQuestionUiContext,
  request: AskUserQuestionRequest,
): Promise<AskUserQuestionResponse> {
  return runAskUserQuestionPrompt(request, async () => {
    const answers: Record<string, string> = {};

    for (const [index, question] of request.questions.entries()) {
      const key = getQuestionKey(question, index);
      const options = question.options ?? [];

      if (options.length === 0) {
        let resolved = false;
        while (!resolved) {
          const answer = (await ui.input(
            buildUiTitle(question),
            question.required ? "Answer (required)" : "Answer",
          ))?.trim();
          if (answer) {
            answers[key] = answer;
            resolved = true;
            continue;
          }
          if (!question.required) {
            answers[key] = "";
            resolved = true;
          }
        }
        continue;
      }

      if (question.multiSelect) {
        let resolved = false;
        while (!resolved) {
          const rawAnswer = (await ui.input(
            buildUiTitle(question),
            "Enter one or more options (numbers or labels, comma-separated)",
          ))?.trim() ?? "";
          if (!rawAnswer && !question.required) {
            answers[key] = "";
            resolved = true;
            continue;
          }
          const parsed = parseOptionAnswer(rawAnswer, question);
          if (parsed !== undefined) {
            answers[key] = parsed;
            resolved = true;
          }
        }
        continue;
      }

      const allowOther = question.allowOther !== false;
      const optionLabels = options.map((option) => option.label);
      const selectOptions = allowOther
        ? [...optionLabels, "Other (type a custom answer)"]
        : optionLabels;
      let resolved = false;
      while (!resolved) {
        const selection = await ui.select(
          buildUiTitle(question),
          selectOptions,
        );
        if (!selection) {
          if (question.required) {
            continue;
          }
          answers[key] = "";
          resolved = true;
          continue;
        }
        if (allowOther && selection === "Other (type a custom answer)") {
          const other = (await ui.input(
            buildUiTitle(question),
            "Type your answer",
          ))?.trim();
          if (other) {
            answers[key] = other;
            resolved = true;
            continue;
          }
          if (!question.required) {
            answers[key] = "";
            resolved = true;
          }
          continue;
        }
        const parsed = parseOptionAnswer(selection, {
          ...question,
          allowOther: false,
        });
        if (parsed !== undefined) {
          answers[key] = parsed;
          resolved = true;
        }
      }
    }

    return createAskUserQuestionResponse(request, answers);
  });
}

function runAskUserQuestionPrompt(
  request: AskUserQuestionRequest,
  runInteractive: () => Promise<AskUserQuestionResponse>,
): Promise<AskUserQuestionResponse> {
  validateAskUserQuestionRequest(request);

  if (request.timeout == null || request.timeout <= 0) {
    return runInteractive();
  }

  const fallbackResponse = createDefaultAskUserQuestionResponse(request);
  return new Promise<AskUserQuestionResponse>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      process.stderr.write(
        `${YELLOW}Ask timeout reached (${request.timeout}ms). Auto-selecting defaults.${RESET}\n`,
      );
      resolve(fallbackResponse);
    }, request.timeout);

    runInteractive()
      .then((response) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(response);
      })
      .catch(() => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(fallbackResponse);
      });
  });
}

export async function promptAskUserQuestionWithReadline(
  rl: readline.Interface,
  request: AskUserQuestionRequest,
): Promise<AskUserQuestionResponse> {
  return runAskUserQuestionPrompt(
    request,
    () => promptAskUserQuestionInteractive(rl, request),
  );
}

async function promptAskUserQuestionInteractive(
  rl: readline.Interface,
  request: AskUserQuestionRequest,
): Promise<AskUserQuestionResponse> {
  const answers: Record<string, string> = {};

  for (const [index, question] of request.questions.entries()) {
    const key = getQuestionKey(question, index);
    const options = question.options ?? [];

    if (question.header?.trim()) {
      process.stderr.write(`\n${BOLD}${question.header.trim()}${RESET}\n`);
    }
    process.stderr.write(`${question.question}\n`);

    if (options.length > 0 && isTTYInput(process.stdin)) {
      // Arrow-key interactive selection
      const optionLabels = options.map((o) => {
        const desc = o.description ? ` ${DIM}${o.description}${RESET}` : "";
        return `${o.label}${desc}`;
      });

      if (question.multiSelect) {
        const result = await promptArrowKeySelect(
          process.stdin,
          process.stderr,
          optionLabels,
          { multiSelect: true },
        );
        if (Array.isArray(result) && result.length > 0) {
          answers[key] = result.map((i) => options[i].label).join(", ");
        } else if (!question.required) {
          answers[key] = "";
        } else {
          // Required but cancelled — use first option as fallback
          answers[key] = options[0].label;
        }
      } else {
        const result = await promptArrowKeySelect(
          process.stdin,
          process.stderr,
          optionLabels,
        );
        if (typeof result === "number") {
          answers[key] = options[result].label;
        } else if (!question.required) {
          answers[key] = "";
        } else {
          answers[key] = options[0].label;
        }
      }
    } else if (options.length > 0) {
      // Fallback: line-based prompt for non-TTY
      for (const [optionIndex, option] of options.entries()) {
        const description = option.description ? ` ${DIM}${option.description}${RESET}` : "";
        const preview = option.preview ? ` ${YELLOW}[preview]${RESET}` : "";
        process.stderr.write(`  ${optionIndex + 1}. ${option.label}${description}${preview}\n`);
      }

      let answered = false;
      while (!answered) {
        const prompt = question.multiSelect
          ? "Choose one or more options (numbers or labels, comma-separated)"
          : "Choose an option (number or label)";
        const answer = await askLine(rl, prompt);

        const parsed = parseOptionAnswer(answer, question);
        if (parsed !== undefined) {
          answers[key] = parsed;
          answered = true;
          continue;
        }

        process.stderr.write(`${YELLOW}Please choose a valid option.${RESET}\n`);
      }
    } else {
      let answered = false;
      while (!answered) {
        const answer = await askLine(rl, "Answer");

        if (!answer && question.required) {
          process.stderr.write(`${YELLOW}An answer is required.${RESET}\n`);
          continue;
        }
        answers[key] = answer;
        answered = true;
      }
    }
  }

  return createAskUserQuestionResponse(request, answers);
}
