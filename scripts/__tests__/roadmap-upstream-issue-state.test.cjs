const assert = require("node:assert/strict");
const test = require("node:test");

const {
  classifyRoadmapIssueState,
  collectRoadmapIssueWarnings,
  lookupIssueWithGh,
} = require("../docs-freshness-report.cjs");

test("classifies mocked gh states without false NOT_PLANNED positives", () => {
  assert.equal(classifyRoadmapIssueState({ state: "OPEN" }), "not_stale");
  assert.equal(classifyRoadmapIssueState({ state: "CLOSED", stateReason: "COMPLETED" }), "not_stale");
  assert.equal(classifyRoadmapIssueState({ state: "CLOSED", stateReason: "NOT_PLANNED" }), "not_planned");
  assert.equal(classifyRoadmapIssueState({ state: "CLOSED" }), "unknown");
});

test("dedupes lookups and suppresses command failures", async () => {
  const calls = [];
  const warnings = await collectRoadmapIssueWarnings({
    roadmapSources: [
      {
        file: "docs/harness-features-backlog/roadmap.md",
        text: [
          "- id: duplicate",
          "  issue_link: a5c-ai/babysitter#478",
          "- duplicate https://github.com/a5c-ai/babysitter/issues/478",
          "- id: unavailable",
          "  issue_link: a5c-ai/babysitter#999",
        ].join("\n"),
      },
    ],
    lookupIssue: async (issue) => {
      calls.push(issue);
      if (issue.endsWith("#999")) {
        throw new Error("gh unavailable");
      }
      return { state: "CLOSED", stateReason: "NOT_PLANNED" };
    },
  });

  assert.deepEqual(calls, ["a5c-ai/babysitter#478", "a5c-ai/babysitter#999"]);
  assert.deepEqual(
    warnings.map((warning) => warning.issue),
    ["a5c-ai/babysitter#478"],
  );
});

test("gh lookup adapter is injectable for timeout and process mocking", async () => {
  const calls = [];
  const result = await lookupIssueWithGh("a5c-ai/babysitter#478", {
    timeoutMs: 25,
    execFileImpl: (binary, args, options, callback) => {
      calls.push({ binary, args, timeout: options.timeout });
      callback(null, JSON.stringify({ state: "CLOSED", stateReason: "NOT_PLANNED" }));
    },
  });

  assert.deepEqual(result, { state: "CLOSED", stateReason: "NOT_PLANNED" });
  assert.equal(calls[0].binary, "gh");
  assert.deepEqual(calls[0].args, [
    "issue",
    "view",
    "a5c-ai/babysitter#478",
    "--json",
    "state,stateReason,closedAt,url,title",
  ]);
  assert.equal(calls[0].timeout, 25);
});
