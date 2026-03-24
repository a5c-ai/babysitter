import type * as readline from "node:readline";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createApprovalAskUserQuestion,
  promptAskUserQuestionWithReadline,
  validateAskUserQuestionRequest,
} from "../askUserQuestion";

function createMockReadline(answers: string[]): readline.Interface {
  return {
    question: (_prompt: string, callback: (answer: string) => void) => {
      callback(answers.shift() ?? "");
    },
  } as unknown as readline.Interface;
}

describe("AskUserQuestion", () => {
  beforeEach(() => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns header-keyed answers for batched text questions", async () => {
    const rl = createMockReadline(["repo only", "tests and lint", ""]);
    const response = await promptAskUserQuestionWithReadline(rl, {
      questions: [
        { header: "Scope", question: "What is the scope?" },
        { header: "Quality Gates", question: "What quality gates matter?" },
        { header: "Additional Context", question: "Anything else?" },
      ],
    });

    expect(response.answers).toEqual({
      Scope: "repo only",
      "Quality Gates": "tests and lint",
      "Additional Context": "",
    });
  });

  it("returns canonical labels for single-select approval prompts", async () => {
    const rl = createMockReadline(["2"]);
    const response = await promptAskUserQuestionWithReadline(
      rl,
      createApprovalAskUserQuestion("Continue?"),
    );

    expect(response.answers).toEqual({
      Decision: "Reject",
    });
  });

  it("supports multi-select and preserves option labels", async () => {
    const rl = createMockReadline(["1, backend"]);
    const response = await promptAskUserQuestionWithReadline(rl, {
      questions: [
        {
          header: "Targets",
          question: "Which targets should run?",
          options: [
            { label: "frontend", description: "Run UI checks." },
            { label: "backend", description: "Run API checks." },
            { label: "e2e", description: "Run browser tests." },
          ],
          multiSelect: true,
          allowOther: false,
        },
      ],
    });

    expect(response.answers).toEqual({
      Targets: "frontend, backend",
    });
  });

  it("allows free-text answers when options exist and allowOther is enabled", async () => {
    const rl = createMockReadline(["something custom"]);
    const response = await promptAskUserQuestionWithReadline(rl, {
      questions: [
        {
          header: "Decision",
          question: "Choose or explain.",
          options: [
            { label: "Approve" },
            { label: "Reject" },
          ],
        },
      ],
    });

    expect(response.answers).toEqual({
      Decision: "something custom",
    });
  });

  it("rejects preview on multi-select questions", () => {
    expect(() =>
      validateAskUserQuestionRequest({
        questions: [
          {
            question: "Pick targets",
            multiSelect: true,
            options: [
              { label: "A", preview: "<b>A</b>" },
              { label: "B" },
            ],
          },
        ],
      }),
    ).toThrow("preview is only supported for single-select questions");
  });
});
