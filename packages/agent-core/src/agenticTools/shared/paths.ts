import * as fs from "node:fs";
import * as path from "node:path";

export function assertInsideWorkspace(target: string, workspace: string): void {
  const resolved = path.resolve(workspace, target);
  const normalizedWorkspace = path.resolve(workspace) + path.sep;
  const normalizedTarget = path.resolve(resolved);
  if (
    normalizedTarget !== path.resolve(workspace)
    && !normalizedTarget.startsWith(normalizedWorkspace)
  ) {
    throw new Error(`Path "${target}" resolves outside the workspace boundary.`);
  }
}

export function resolveSafe(workspace: string, filePath: string): string {
  const resolved = path.resolve(workspace, filePath);
  assertInsideWorkspace(resolved, workspace);
  return resolved;
}

export function globToRegex(pattern: string): RegExp {
  let regexString = "^";
  let index = 0;
  while (index < pattern.length) {
    const char = pattern[index];
    if (char === "*" && pattern[index + 1] === "*") {
      regexString += ".*";
      index += 2;
      if (pattern[index] === "/" || pattern[index] === "\\") {
        index += 1;
      }
    } else if (char === "*") {
      regexString += "[^/\\\\]*";
      index += 1;
    } else if (char === "?") {
      regexString += "[^/\\\\]";
      index += 1;
    } else if (".+^${}()|[]\\".includes(char)) {
      regexString += "\\" + char;
      index += 1;
    } else {
      regexString += char;
      index += 1;
    }
  }
  regexString += "$";
  return new RegExp(regexString, "i");
}

export function walkDir(
  directory: string,
  includeHidden: boolean,
  limit: number,
  results: string[],
): void {
  if (results.length >= limit) {
    return;
  }
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (e) {
    process.stderr.write(`[agent-core] walkDir: cannot read ${directory}: ${e instanceof Error ? e.message : String(e)}\n`);
    return;
  }
  for (const entry of entries) {
    if (results.length >= limit) {
      return;
    }
    if (!includeHidden && entry.name.startsWith(".")) {
      continue;
    }
    if (entry.name === "node_modules") {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, includeHidden, limit, results);
      continue;
    }
    results.push(fullPath);
  }
}
