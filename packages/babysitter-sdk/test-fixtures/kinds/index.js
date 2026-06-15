"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleepKindFixtures = exports.orchestratorKindFixtures = exports.breakpointKindFixtures = exports.nodeKindFixtures = void 0;
const sleepIso = "2026-02-15T12:00:00.000Z";
exports.nodeKindFixtures = {
    id: "fixtures.node.example",
    args: { target: "web-app", cacheKey: "demo" },
    helperLabels: ["node-helper"],
    metadata: { subsystem: "build" },
    env: {
        sample: {
            NODE_AUTH_TOKEN: "token-123",
            CI_SECRET: "ci-secret",
            GITHUB_TOKEN: "ghp_example",
            DB_PASSWORD: "hunter2",
            PUBLIC_URL: "https://example.test",
            LOG_LEVEL: "info",
        },
        expectedSafe: {
            PUBLIC_URL: "https://example.test",
            LOG_LEVEL: "info",
        },
        expectedRedacted: ["CI_SECRET", "DB_PASSWORD", "GITHUB_TOKEN", "NODE_AUTH_TOKEN"],
    },
};
exports.breakpointKindFixtures = {
    id: "fixtures.breakpoint.example",
    payload: { reason: "inspect diff", branch: "feature/123" },
    metadata: { severity: "high" },
};
exports.orchestratorKindFixtures = {
    id: "fixtures.orchestrator.example",
    payload: { op: "plan", stage: "compile" },
    metadata: { iteration: 3 },
    resumeCommand: "pnpm babysitter run:continue",
};
exports.sleepKindFixtures = {
    id: "fixtures.sleep.example",
    args: {
        iso: sleepIso,
        targetEpochMs: Date.parse(sleepIso),
    },
    helperLabels: ["sleep-helper"],
};
