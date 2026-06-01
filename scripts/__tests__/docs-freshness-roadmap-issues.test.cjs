const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const freshness = require("../docs-freshness-report.cjs");

test("exports roadmap issue freshness helpers for deterministic tests", () => {
  assert.equal(typeof freshness.parseRoadmapIssueLinks, "function");
  assert.equal(typeof freshness.classifyRoadmapIssueState, "function");
  assert.equal(typeof freshness.collectRoadmapIssueWarnings, "function");
});

test("parses configured roadmap issue_link metadata and markdown issue URLs", () => {
  const text = [
    "- id: forward-fix-strike-budget",
    "  status: in-progress",
    "  issue_link: a5c-ai/babysitter#478",
    "- [hypotheses-falsifying-required](https://github.com/a5c-ai/babysitter/issues/479) is in progress",
    "- duplicate reference https://github.com/a5c-ai/babysitter/issues/479",
  ].join("\n");

  const links = freshness.parseRoadmapIssueLinks({
    file: "docs/harness-features-backlog/roadmap.md",
    text,
  });

  assert.deepEqual(
    links.map((link) => ({
      file: link.file,
      line: link.line,
      issue: link.issue,
      item: link.item,
    })),
    [
      {
        file: "docs/harness-features-backlog/roadmap.md",
        line: 3,
        issue: "a5c-ai/babysitter#478",
        item: "forward-fix-strike-budget",
      },
      {
        file: "docs/harness-features-backlog/roadmap.md",
        line: 4,
        issue: "a5c-ai/babysitter#479",
        item: "hypotheses-falsifying-required",
      },
    ],
  );
});

test("classifies only CLOSED NOT_PLANNED issues as stale roadmap warnings", () => {
  assert.equal(
    freshness.classifyRoadmapIssueState({ state: "CLOSED", stateReason: "NOT_PLANNED" }),
    "not_planned",
  );
  assert.equal(
    freshness.classifyRoadmapIssueState({ state: "CLOSED", stateReason: "COMPLETED" }),
    "not_stale",
  );
  assert.equal(freshness.classifyRoadmapIssueState({ state: "OPEN" }), "not_stale");
  assert.equal(freshness.classifyRoadmapIssueState({ state: "CLOSED", closedAt: "2026-05-28T00:00:00Z" }), "unknown");
});

test("collects warning-only roadmap issue findings with deduped lookups", async () => {
  const lookupCalls = [];
  const warnings = await freshness.collectRoadmapIssueWarnings({
    roadmapSources: [
      {
        file: "docs/harness-features-backlog/roadmap.md",
        text: [
          "- id: forward-fix-strike-budget",
          "  issue_link: a5c-ai/babysitter#478",
          "- duplicate https://github.com/a5c-ai/babysitter/issues/478",
        ].join("\n"),
      },
    ],
    lookupIssue: async (issue) => {
      lookupCalls.push(issue);
      return {
        state: "CLOSED",
        stateReason: "NOT_PLANNED",
        title: "Won't implement upstream",
        url: "https://github.com/a5c-ai/babysitter/issues/478",
      };
    },
  });

  assert.deepEqual(lookupCalls, ["a5c-ai/babysitter#478"]);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].issue, "a5c-ai/babysitter#478");
  assert.equal(warnings[0].severity, "warning");
  assert.match(warnings[0].message, /consider dropping/i);
});

test("builds docs freshness report fields for warning-only roadmap findings", async () => {
  const report = await freshness.collectRoadmapIssueReport({
    roadmapSources: [
      {
        file: "docs/harness-features-backlog/roadmap.md",
        text: [
          "- id: forward-fix-strike-budget",
          "  issue_link: a5c-ai/babysitter#478",
        ].join("\n"),
      },
    ],
    lookupIssue: async () => ({
      state: "CLOSED",
      stateReason: "NOT_PLANNED",
      title: "won't implement",
      url: "https://github.com/a5c-ai/babysitter/issues/478",
    }),
  });

  assert.equal(report.exitCode, 0);
  assert.equal(report.roadmapIssueWarnings.length, 1);
  assert.equal(report.roadmapIssueWarnings[0].severity, "warning");
});

test("documents roadmap issue_link warning-only operator contract", () => {
  const roadmap = fs.readFileSync("docs/harness-features-backlog/roadmap.md", "utf8");

  assert.match(roadmap, /issue_link/);
  assert.match(roadmap, /NOT_PLANNED/);
  assert.match(roadmap, /warning-only/i);
  assert.match(roadmap, /does not auto-drop/i);
});
