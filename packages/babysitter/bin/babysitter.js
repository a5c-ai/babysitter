#!/usr/bin/env node
"use strict";

// Alias to @a5c-ai/babysitter-sdk CLI
// This metapackage re-exports the babysitter CLI from the SDK package
let createBabysitterCli;
try {
  ({ createBabysitterCli } = require("@a5c-ai/babysitter-sdk/dist/cli/main.js"));
} catch (error) {
  const missingSdkCli = error
    && error.code === "MODULE_NOT_FOUND"
    && String(error.message || "").includes("@a5c-ai/babysitter-sdk/dist/cli/main.js");
  if (missingSdkCli) {
    const version = process.env.BABYSITTER_SDK_VERSION || "latest";
    console.error("Unable to load @a5c-ai/babysitter-sdk CLI.");
    console.error("");
    console.error("The global `babysitter` shim is installed, but its SDK CLI target is missing.");
    console.error("Repair the global install, then validate it:");
    console.error(`  npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk`);
    console.error(`  npm i -g @a5c-ai/babysitter-sdk@${version}`);
    console.error("  babysitter --version");
    console.error("");
    console.error("Or bypass the global shim with the explicit SDK bin:");
    console.error(`  npm exec --yes --package @a5c-ai/babysitter-sdk@${version} -- babysitter --version`);
    process.exit(1);
  }
  throw error;
}

// Mirror the SDK executable (packages/babysitter-sdk/src/cli/main.ts): the CLI
// resolves the process exit code, so it must be awaited and assigned, and a
// rejection must surface as one handled error with exit code 1. Discarding the
// promise (`void run()`) silently turned every nonzero CLI result into a
// success and crashed on rejection with an unhandled-rejection dump.
createBabysitterCli()
  .run()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error("The @a5c-ai/babysitter-sdk CLI failed:", error);
    process.exitCode = 1;
  });
