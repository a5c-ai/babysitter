#!/usr/bin/env node

import { createProgram } from "./program.js";

export { createProgram } from "./program.js";
export const CLI_VERSION = "5.0.0";

const program = createProgram();
program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
