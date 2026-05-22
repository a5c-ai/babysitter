import type {
  AskUserQuestionOption,
  AskUserQuestionQuestion,
  AskUserQuestionRequest,
  AskUserQuestionResponse,
} from "../askUserQuestion";

const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 4;
const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 4;

export function getQuestionKey(question: AskUserQuestionQuestion, index: number): string {
  const header = question.header?.trim();
  if (header) {
    return header;
  }
  return `Question ${index + 1}`;
}

export function resolveOption(
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

export function parseOptionAnswer(
  rawAnswer: string,
  question: AskUserQuestionQuestion,
): string | undefined {
  const trimmed = rawAnswer.trim();
  if (!trimmed) {
    return undefined;
  }

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

    if (!question.options) {
      continue;
    }

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

export function createDefaultAskUserQuestionResponse(
  request: AskUserQuestionRequest,
): AskUserQuestionResponse {
  return createAskUserQuestionResponse(request, buildDefaultAnswers(request));
}
