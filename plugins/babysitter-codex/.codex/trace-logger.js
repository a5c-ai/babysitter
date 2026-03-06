'use strict';

const fs = require('fs');
const path = require('path');

function resolveTracePath(runDir) {
  return path.join(runDir, 'run-trace.jsonl');
}

function appendTrace(runDir, event) {
  if (!runDir) return;
  const tracePath = resolveTracePath(runDir);
  fs.mkdirSync(path.dirname(tracePath), { recursive: true });
  const payload = {
    ts: new Date().toISOString(),
    ...event,
  };
  fs.appendFileSync(tracePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

module.exports = {
  resolveTracePath,
  appendTrace,
};
