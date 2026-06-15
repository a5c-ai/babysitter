import { describe, expect, it } from "vitest";
import { compressGitOutput } from "../compressOutputHelpers";

describe("compressGitOutput", () => {
  it("keeps staged and unstaged status entries in separate buckets", () => {
    const raw = [
      "On branch staging",
      'Changes to be committed:',
      '  (use "git restore --staged <file>..." to unstage)',
      "\tmodified:   staged-file.ts",
      "",
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
      "\tmodified:   unstaged-file-a.ts",
      "\tmodified:   unstaged-file-b.ts",
      "",
      'Untracked files:',
      '  (use "git add <file>..." to include in what will be committed)',
      "\tnew-file.ts",
      "",
    ].join("\n");

    expect(compressGitOutput("status", raw)).toBe(
      "staged(1): modified:   staged-file.ts\n" +
      "unstaged(2): modified:   unstaged-file-a.ts, modified:   unstaged-file-b.ts\n" +
      "untracked(1): new-file.ts"
    );
  });

  it("still recognizes porcelain-style untracked entries", () => {
    expect(compressGitOutput("status", "?? scratch.txt\n")).toBe("untracked(1): scratch.txt");
  });
});
