#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

async function main() {
  const outputPath = process.env.BABYSITTER_OUTPUT_JSON;
  if (!outputPath) {
    console.error("Missing BABYSITTER_OUTPUT_JSON");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const payload = {
    secret: process.env.SECRET_TOKEN || null,
    publicFlag: process.env.PUBLIC_FLAG || null,
    cwd: process.cwd(),
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload), "utf8");
  process.stdout.write(JSON.stringify({ wrote: outputPath }));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
