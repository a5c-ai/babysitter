import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const packageRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
  bin?: Record<string, string>;
  exports?: Record<string, { default?: string; types?: string }>;
};

function assertPackagePathExists(relativePath: string): void {
  assert.ok(
    existsSync(path.join(packageRoot, relativePath)),
    `Expected packaged path to exist: ${relativePath}`,
  );
}

for (const [exportName, target] of Object.entries(packageJson.exports ?? {})) {
  assert.ok(target.default, `Expected ${exportName} to declare a default export target`);
  assert.ok(target.types, `Expected ${exportName} to declare a types export target`);
  assertPackagePathExists(target.default);
  assertPackagePathExists(target.types);
}

for (const [binName, binPath] of Object.entries(packageJson.bin ?? {})) {
  assertPackagePathExists(binPath);
  assert.ok(binPath.startsWith("./dist/"), `Expected ${binName} bin to point at dist output`);
}

const rootExports = await import(pathToFileURL(path.join(packageRoot, "dist/index.js")).href);
const mcpExports = await import(pathToFileURL(path.join(packageRoot, "dist/mcp/index.js")).href);

for (const exportName of [
  "TaskSearchParamsSchema",
  "TaskSearchResultSchema",
  "TaskCommentSchema",
  "TaskAssignmentParamsSchema",
  "TaskCloseParamsSchema",
  "TaskEscalationParamsSchema",
  "TaskTemplateSchema",
  "TaskRuleSchema",
  "TaskChangeEventSchema",
]) {
  assert.ok(exportName in rootExports, `Expected root package export: ${exportName}`);
}

for (const exportName of [
  "handleCreateTodo",
  "handleCreateTask",
  "handleAssignTask",
  "handleSearchTasks",
  "handleCancelBreakpoint",
  "handleEscalateBreakpoint",
  "handleAddCommentToBreakpoint",
  "breakpointResourceTemplate",
  "readBreakpointResource",
  "startHttpBreakpointMcpServer",
]) {
  assert.ok(exportName in mcpExports, `Expected MCP package export: ${exportName}`);
}
