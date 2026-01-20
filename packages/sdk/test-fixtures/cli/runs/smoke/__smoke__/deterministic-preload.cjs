"use strict";
const deterministic = require("c:\\Users\\tmusk\\IdeaProjects\\babysitter\\packages\\sdk\\dist\\testing\\deterministic.js");
const installFixedClock = deterministic.installFixedClock;
const installDeterministicUlids = deterministic.installDeterministicUlids;
const handles = [];

function applyHandle(handle) {
  if (!handle || typeof handle.apply !== "function") {
    return;
  }
  const release = handle.apply();
  if (typeof release === "function") {
    handles.push(release);
  }
}

function restoreHandle(handle) {
  if (handle && typeof handle.restore === "function") {
    try {
      handle.restore();
    } catch {
      // noop
    }
  }
}

try {
  const clock = typeof installFixedClock === "function" ? installFixedClock({ start: "2025-01-01T00:00:00.000Z", stepMs: 250 }) : null;
  const ulids =
    typeof installDeterministicUlids === "function" ? installDeterministicUlids({ randomnessSeed: 42 }) : null;

  applyHandle(clock);
  applyHandle(ulids);

  function cleanup() {
    while (handles.length) {
      const release = handles.pop();
      if (typeof release === "function") {
        try {
          release();
        } catch {
          // noop
        }
      }
    }
    restoreHandle(ulids);
    restoreHandle(clock);
  }

  process.once("exit", cleanup);
  process.once("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[smoke-cli] Failed to install deterministic hooks:", message);
  process.exit(1);
}
