/**
 * Type definitions for askUserQuestion.
 * Extracted from askUserQuestion.ts for max-lines compliance.
 */

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
