const assert = require("node:assert/strict");
const test = require("node:test");

const { parseRoadmapIssueLinks } = require("../docs-freshness-report.cjs");

test("parses quoted issue_link metadata with trailing punctuation", () => {
  const links = parseRoadmapIssueLinks({
    file: "docs/harness-features-backlog/roadmap.md",
    text: [
      "- id: forbidden-marker-chunkgrep-upstream",
      "  issue_link: \"https://github.com/a5c-ai/babysitter/issues/477\",",
    ].join("\n"),
  });

  assert.deepEqual(links, [
    {
      file: "docs/harness-features-backlog/roadmap.md",
      line: 2,
      issue: "a5c-ai/babysitter#477",
      item: "forbidden-marker-chunkgrep-upstream",
    },
  ]);
});

test("parses markdown table issue links with row title as item", () => {
  const links = parseRoadmapIssueLinks({
    file: "docs/harness-features-backlog/roadmap.md",
    text: [
      "| Item | Upstream |",
      "| --- | --- |",
      "| forward-fix-strike-budget | https://github.com/a5c-ai/babysitter/issues/478 |",
    ].join("\n"),
  });

  assert.deepEqual(links, [
    {
      file: "docs/harness-features-backlog/roadmap.md",
      line: 3,
      issue: "a5c-ai/babysitter#478",
      item: "forward-fix-strike-budget",
    },
  ]);
});
