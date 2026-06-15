#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function ensureFile(targetPath) {
  if (!targetPath) {
    throw new Error("BABYSITTER_OUTPUT_JSON is required for smoke runner output");
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  return targetPath;
}

function parsePayload() {
  const flagIndex = process.argv.indexOf("--payload");
  if (flagIndex === -1 || flagIndex === process.argv.length - 1) {
    return null;
  }
  const raw = process.argv[flagIndex + 1];
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function writeJson(targetPath, payload) {
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

try {
  const outputPath = ensureFile(process.env.BABYSITTER_OUTPUT_JSON);
  const summary = {
    receivedPayload: parsePayload(),
    cwd: process.cwd(),
    env: {
      PUBLIC_FLAG: process.env.PUBLIC_FLAG ?? null,
      SECRET_TOKEN: process.env.SECRET_TOKEN ? "(redacted)" : null,
      INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ? "(redacted)" : null,
    },
  };

  writeJson(outputPath, summary);
  process.stdout.write(JSON.stringify({ result: outputPath }));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
