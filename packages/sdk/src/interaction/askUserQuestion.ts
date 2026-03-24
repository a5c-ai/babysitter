import * as readline from "node:readline";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[33m";

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
}

export interface AskUserQuestionRequest {
  questions: AskUserQuestionQuestion[];
}

export interface AskUserQuestionResponse {
  answers: Record<string, string>;
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

export async function promptAskUserQuestionWithReadline(
  rl: readline.Interface,
  request: AskUserQuestionRequest,
): Promise<AskUserQuestionResponse> {
  validateAskUserQuestionRequest(request);

  const answers: Record<string, string> = {};

  for (const [index, question] of request.questions.entries()) {
    const key = getQuestionKey(question, index);
    const options = question.options ?? [];

    if (question.header?.trim()) {
      process.stderr.write(`\n${BOLD}${question.header.trim()}${RESET}\n`);
    }
    process.stderr.write(`${question.question}\n`);

    if (options.length > 0) {
      for (const [optionIndex, option] of options.entries()) {
        const description = option.description ? ` ${DIM}${option.description}${RESET}` : "";
        const preview = option.preview ? ` ${YELLOW}[preview]${RESET}` : "";
        process.stderr.write(`  ${optionIndex + 1}. ${option.label}${description}${preview}\n`);
      }
    }

    let answered = false;
    while (!answered) {
      const prompt =
        options.length > 0
          ? question.multiSelect
            ? "Choose one or more options (numbers or labels, comma-separated)"
            : "Choose an option (number or label)"
          : "Answer";
      const answer = await askLine(rl, prompt);

      if (!options.length) {
        if (!answer && question.required) {
          process.stderr.write(`${YELLOW}An answer is required.${RESET}\n`);
          continue;
        }
        answers[key] = answer;
        answered = true;
        continue;
      }

      const parsed = parseOptionAnswer(answer, question);
      if (parsed !== undefined) {
        answers[key] = parsed;
        answered = true;
        continue;
      }

      process.stderr.write(`${YELLOW}Please choose a valid option.${RESET}\n`);
    }
  }

  return createAskUserQuestionResponse(request, answers);
}
