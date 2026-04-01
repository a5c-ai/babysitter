import * as readline from "node:readline";
import type { Readable, Writable } from "node:stream";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[33m";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE = "\x1b[2K";
const CURSOR_COL1 = "\x1b[G";
const CURSOR_UP = "\x1b[A";

// ---------------------------------------------------------------------------
// Arrow-key interactive selector (single & multi-select)
// ---------------------------------------------------------------------------

interface ArrowSelectOptions {
  multiSelect?: boolean;
}

function isTTYInput(stream: Readable): stream is NodeJS.ReadStream & { setRawMode: (mode: boolean) => void } {
  return "isTTY" in stream && (stream as NodeJS.ReadStream).isTTY === true && typeof (stream as NodeJS.ReadStream).setRawMode === "function";
}

/**
 * Render the option list to `output`. Returns the number of lines written.
 */
function renderOptions(
  output: Writable,
  options: string[],
  cursor: number,
  selected: Set<number>,
  multiSelect: boolean,
): number {
  let lines = 0;
  for (const [i, label] of options.entries()) {
    const isCurrent = i === cursor;
    const prefix = multiSelect
      ? selected.has(i)
        ? isCurrent
          ? `${CYAN}${BOLD}> [x]${RESET} `
          : `  [x] `
        : isCurrent
          ? `${CYAN}${BOLD}> [ ]${RESET} `
          : `  [ ] `
      : isCurrent
        ? `${CYAN}${BOLD}> ${RESET}`
        : `  `;
    const text = isCurrent ? `${CYAN}${BOLD}${label}${RESET}` : label;
    output.write(`${CLEAR_LINE}${CURSOR_COL1}${prefix}${text}\n`);
    lines++;
  }
  if (multiSelect) {
    output.write(`${CLEAR_LINE}${CURSOR_COL1}${DIM}(Space to toggle, Enter to confirm, Esc to cancel)${RESET}\n`);
    lines++;
  } else {
    output.write(`${CLEAR_LINE}${CURSOR_COL1}${DIM}(Up/Down to move, Enter to select, 1-9 shortcut, Esc to cancel)${RESET}\n`);
    lines++;
  }
  return lines;
}

/**
 * Move the terminal cursor up `n` lines so we can re-render in place.
 */
function moveUp(output: Writable, n: number): void {
  if (n > 0) {
    output.write(`${CURSOR_UP}`.repeat(n));
  }
}

/**
 * Arrow-key interactive selector.
 *
 * Returns the selected index (single) or array of indices (multi).
 * Returns `undefined` if cancelled (Escape / Ctrl-C).
 */
function promptArrowKeySelect(
  input: NodeJS.ReadStream,
  output: Writable,
  options: string[],
  opts?: ArrowSelectOptions,
): Promise<number | number[] | undefined> {
  const multiSelect = opts?.multiSelect ?? false;

  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set<number>();
    let renderedLines = 0;
    let resolved = false;

    const cleanup = (): void => {
      if (resolved) return;
      resolved = true;
      input.removeListener("data", onData);
      try { input.setRawMode(false); } catch { /* ignore */ }
      output.write(SHOW_CURSOR);
    };

    const finish = (value: number | number[] | undefined): void => {
      cleanup();
      resolve(value);
    };

    const redraw = (): void => {
      moveUp(output, renderedLines);
      renderedLines = renderOptions(output, options, cursor, selected, multiSelect);
    };

    const onData = (data: Buffer): void => {
      if (resolved) return;
      const key = data.toString("utf8");

      // Ctrl-C
      if (key === "\x03") {
        finish(undefined);
        return;
      }

      // Escape
      if (key === "\x1b" || key === "\x1b\x1b") {
        finish(undefined);
        return;
      }

      // Enter
      if (key === "\r" || key === "\n") {
        if (multiSelect) {
          finish([...selected].sort((a, b) => a - b));
        } else {
          finish(cursor);
        }
        return;
      }

      // Space (multi-select toggle)
      if (key === " " && multiSelect) {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        redraw();
        return;
      }

      // Arrow up
      if (key === "\x1b[A") {
        cursor = cursor > 0 ? cursor - 1 : options.length - 1;
        redraw();
        return;
      }

      // Arrow down
      if (key === "\x1b[B") {
        cursor = cursor < options.length - 1 ? cursor + 1 : 0;
        redraw();
        return;
      }

      // Number shortcuts 1-9 (single select only)
      if (!multiSelect && /^[1-9]$/.test(key)) {
        const idx = Number(key) - 1;
        if (idx < options.length) {
          finish(idx);
        }
        return;
      }
    };

    output.write(HIDE_CURSOR);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
    renderedLines = renderOptions(output, options, cursor, selected, multiSelect);
  });
}

const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 4;
const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 4;

export interface AskUserQuestionOption {
  label: string;
  description?: string;
  preview?: string;
}

export interface AskUserQuestionQuestion {
  question: string;
  header?: string;
  options?: AskUserQuestionOption[];
  multiSelect?: boolean;
  allowOther?: boolean;
  required?: boolean;
  recommended?: number;
}

export interface AskUserQuestionRequest {
  questions: AskUserQuestionQuestion[];
  timeout?: number;
}

export interface AskUserQuestionResponse {
  answers: Record<string, string>;
}

export interface AskUserQuestionUiContext {
  select(title: string, options: string[]): Promise<string | undefined>;
  input(title: string, placeholder?: string): Promise<string | undefined>;
  confirm(title: string, message: string): Promise<boolean>;
}

function askLine(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${CYAN}?${RESET} ${prompt} `, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function getQuestionKey(question: AskUserQuestionQuestion, index: number): string {
  const header = question.header?.trim();
  if (header) return header;
  return `Question ${index + 1}`;
}

function resolveOption(
  token: string,
  options: AskUserQuestionOption[],
): AskUserQuestionOption | undefined {
  if (/^\d+$/.test(token)) {
    const index = Number(token) - 1;
    return index >= 0 && index < options.length ? options[index] : undefined;
  }

  const normalized = token.trim().toLowerCase();
  return options.find((option) => option.label.trim().toLowerCase() === normalized);
}

function parseOptionAnswer(
  rawAnswer: string,
  question: AskUserQuestionQuestion,
): string | undefined {
  const trimmed = rawAnswer.trim();
  if (!trimmed) return undefined;

  const options = question.options ?? [];
  const parts = question.multiSelect
    ? trimmed.split(",").map((part) => part.trim()).filter(Boolean)
    : [trimmed];

  const selectedLabels: string[] = [];
  for (const part of parts) {
    const option = resolveOption(part, options);
    if (!option) {
      return question.allowOther === false ? undefined : trimmed;
    }
    if (!selectedLabels.includes(option.label)) {
      selectedLabels.push(option.label);
    }
  }

  if (!question.multiSelect && selectedLabels.length > 1) {
    return undefined;
  }

  return question.multiSelect ? selectedLabels.join(", ") : selectedLabels[0];
}

export function validateAskUserQuestionRequest(
  request: AskUserQuestionRequest,
): void {
  if (!Array.isArray(request.questions)) {
    throw new Error("AskUserQuestion requires a questions array.");
  }
  if (
    request.questions.length < MIN_QUESTION_COUNT ||
    request.questions.length > MAX_QUESTION_COUNT
  ) {
    throw new Error(
      `AskUserQuestion requires ${MIN_QUESTION_COUNT}-${MAX_QUESTION_COUNT} questions.`,
    );
  }

  for (const question of request.questions) {
    if (!question.question?.trim()) {
      throw new Error("AskUserQuestion questions must include non-empty question text.");
    }

    if (question.options) {
      if (
        question.options.length < MIN_OPTION_COUNT ||
        question.options.length > MAX_OPTION_COUNT
      ) {
        throw new Error(
          `AskUserQuestion option-based questions require ${MIN_OPTION_COUNT}-${MAX_OPTION_COUNT} options.`,
        );
      }

      if (question.multiSelect && question.options.some((option) => option.preview?.trim())) {
        throw new Error("AskUserQuestion preview is only supported for single-select questions.");
      }

      for (const option of question.options) {
        if (!option.label?.trim()) {
          throw new Error("AskUserQuestion options must include a non-empty label.");
        }
      }
    }
  }
}

export function createAskUserQuestionResponse(
  request: AskUserQuestionRequest,
  answers: Record<string, string>,
): AskUserQuestionResponse {
  validateAskUserQuestionRequest(request);

  const normalizedAnswers: Record<string, string> = {};
  for (const [index, question] of request.questions.entries()) {
    const key = getQuestionKey(question, index);
    normalizedAnswers[key] = answers[key] ?? "";
  }

  return { answers: normalizedAnswers };
}

export function createDefaultAskUserQuestionResponse(
  request: AskUserQuestionRequest,
): AskUserQuestionResponse {
  return createAskUserQuestionResponse(request, buildDefaultAnswers(request));
}

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

function getDefaultAnswerForQuestion(question: AskUserQuestionQuestion): string {
  const options = question.options ?? [];
  if (
    question.recommended != null &&
    options.length > 0 &&
    options[question.recommended]
  ) {
    return options[question.recommended].label;
  }
  if (options.length > 0) {
    return options[0].label;
  }
  return "";
}

function buildDefaultAnswers(request: AskUserQuestionRequest): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const [index, question] of request.questions.entries()) {
    const key = getQuestionKey(question, index);
    answers[key] = getDefaultAnswerForQuestion(question);
  }
  return answers;
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
