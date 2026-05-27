import { describe, expect, it } from "vitest";
import {
  createClaudeCodeCliSetupSnippet,
  createDefaultCliSetupSnippet,
} from "../contextShared";

describe("CLI setup snippets", () => {
  it("validates the installed babysitter command before using it", () => {
    const snippet = createDefaultCliSetupSnippet();

    expect(snippet).toContain("babysitter --version");
    expect(snippet).toContain("command -v babysitter");
    expect(snippet).toContain("CLI=\"babysitter\"");
  });

  it("uses explicit npm exec package/bin fallback instead of ambiguous npx package execution", () => {
    const snippets = [
      createDefaultCliSetupSnippet(),
      createClaudeCodeCliSetupSnippet(),
    ];

    for (const snippet of snippets) {
      expect(snippet).toContain(
        "npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter",
      );
      expect(snippet).not.toContain("CLI=\"npx -y @a5c-ai/babysitter-sdk");
    }
  });

  it("documents stale global shim repair guidance", () => {
    const snippet = createClaudeCodeCliSetupSnippet();

    expect(snippet).toContain("stale or broken global shim");
    expect(snippet).toContain("npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk");
    expect(snippet).toContain("npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION");
  });
});
