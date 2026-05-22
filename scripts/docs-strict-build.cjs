const { spawnSync } = require("child_process");

const env = {
  ...process.env,
  DOCS_STRICT_LINKS: "1",
  DOCS_STRICT_SCOPE: "1",
};

const npmExecPath = process.env.npm_execpath;
const result = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, "run", "docs:build"], {
      env,
      stdio: "inherit",
    })
  : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "docs:build"], {
      env,
      stdio: "inherit",
    });

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
