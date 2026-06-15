const fs = require("fs");
const path = require("path");
const { parseAllDocuments } = require("yaml");

const {
  docsRoot,
  repoRoot,
  normalizeSlashes,
  isRepoCommandSurface,
  isStagedDoc,
} = require("./docs-qa-config.cjs");

const FENCE_START_RE = /^```([A-Za-z0-9_-]+)?(?:\s+.*)?$/;
const FENCE_END_RE = /^```$/;
const INLINE_SCRIPT_RE = /(?:npm run ([A-Za-z0-9:_-]+)(?:\s+--workspace=([^\s`]+))?(?:\s+--prefix\s+([^\s`]+))?)|(?:pnpm --filter ([^\s`]+) run ([A-Za-z0-9:_-]+))/g;
const DEFERRED_SCRIPTS = new Set(["test:contracts"]);

function listMarkdownFiles(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return targetPath.endsWith(".md") || targetPath.endsWith(".mdx") ? [targetPath] : [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.name === "node_modules" || entry.name === ".git") {
        return [];
      }
      return listMarkdownFiles(path.join(targetPath, entry.name));
    })
    .sort((left, right) => left.localeCompare(right));
}

function listPackageJsonFiles(targetPath) {
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === ".next"
    ) {
      continue;
    }

    const entryPath = path.join(targetPath, entry.name);
    if (entry.isFile() && entry.name === "package.json") {
      results.push(entryPath);
      continue;
    }

    if (entry.isDirectory()) {
      results.push(...listPackageJsonFiles(entryPath));
    }
  }

  return results.sort((left, right) => left.localeCompare(right));
}

function loadPackageMap() {
  const byName = new Map();
  const byPath = new Map();

  for (const packageJsonPath of listPackageJsonFiles(repoRoot)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const packageDirectory = path.dirname(packageJsonPath);
    if (typeof packageJson.name === "string") {
      byName.set(packageJson.name, {
        packageDirectory,
        packageJson,
      });
    }
    byPath.set(normalizeSlashes(path.relative(repoRoot, packageDirectory)), {
      packageDirectory,
      packageJson,
    });
  }

  return { byName, byPath };
}

function parseCodeFences(filePath) {
  const blocks = [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  let currentBlock = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!currentBlock) {
      const startMatch = line.match(FENCE_START_RE);
      if (!startMatch) {
        continue;
      }

      currentBlock = {
        language: (startMatch[1] || "").toLowerCase(),
        startLine: lineIndex + 1,
        content: [],
      };
      continue;
    }

    if (FENCE_END_RE.test(line)) {
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    currentBlock.content.push(line);
  }

  return blocks;
}

function collectScriptReferences(filePath) {
  const relativePath = normalizeSlashes(path.relative(repoRoot, filePath));
  if (!isRepoCommandSurface(relativePath)) {
    return [];
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const results = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    let match;
    while ((match = INLINE_SCRIPT_RE.exec(line)) !== null) {
      const npmScript = match[1];
      const npmWorkspace = match[2];
      const npmPrefix = match[3];
      const pnpmWorkspace = match[4];
      const pnpmScript = match[5];
      const script = npmScript || pnpmScript;
      const workspace = npmWorkspace || pnpmWorkspace || null;
      const prefix = npmPrefix || null;

      if (!workspace && !prefix && !script.includes(":")) {
        continue;
      }

      if (/\b(deferred|not implemented|optional)\b/i.test(line)) {
        continue;
      }

      results.push({
        file: relativePath,
        line: lineIndex + 1,
        script,
        workspace,
        prefix,
      });
    }
    INLINE_SCRIPT_RE.lastIndex = 0;
  }

  return results;
}

function validateJsonBlock(block) {
  const content = block.content.join("\n").trim();
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);

  if (lines.length > 1 && lines.every((line) => line.startsWith("{"))) {
    for (const line of lines) {
      JSON.parse(line);
    }
    return;
  }

  JSON.parse(content);
}

function validateYamlBlock(block) {
  const documents = parseAllDocuments(block.content.join("\n"));
  for (const document of documents) {
    if (document.errors.length > 0) {
      throw document.errors[0];
    }
  }
}

function shouldValidateJsonBlock(block) {
  const content = block.content.join("\n");
  return !/\/\/|\/\*|^\s*\.\.\.$|<[^>\n]+>|\[\s*\.\.\.\s*]|\{\s*\.\.\.\s*}|\|/m.test(content);
}

function shouldValidateYamlBlock(block) {
  const content = block.content.join("\n");
  const nonCommentLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (nonCommentLines.filter((line) => line.startsWith("model:")).length > 1) {
    return false;
  }

  const secondFrontmatterFence = content.indexOf("\n---\n");
  if (secondFrontmatterFence >= 0) {
    const trailingContent = content.slice(secondFrontmatterFence + 5).trim();
    if (
      trailingContent.length > 0 &&
      trailingContent
        .split("\n")
        .some((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !/^[A-Za-z0-9_-]+\s*:/.test(trimmed);
        })
    ) {
      return false;
    }
  }

  return true;
}

function validateScriptReference(reference, packageMap) {
  if (!reference.script || reference.script.includes("<")) {
    return null;
  }

  if (DEFERRED_SCRIPTS.has(reference.script)) {
    return null;
  }

  let packageInfo;
  if (reference.prefix) {
    if (reference.prefix.includes("<")) {
      return null;
    }
    const normalizedPrefix = normalizeSlashes(reference.prefix.replace(/^\.\/+/, "").replace(/\/$/, ""));
    packageInfo = packageMap.byPath.get(normalizedPrefix);
    if (!packageInfo) {
      return `prefix ${reference.prefix} does not resolve to a package.json`;
    }
  } else if (reference.workspace) {
    if (reference.workspace.includes("<")) {
      return null;
    }
    packageInfo = packageMap.byName.get(reference.workspace);
    if (!packageInfo) {
      return `workspace ${reference.workspace} not found`;
    }
  } else {
    packageInfo = packageMap.byPath.get("");
  }

  if (!packageInfo || !packageInfo.packageJson.scripts || !(reference.script in packageInfo.packageJson.scripts)) {
    return `${reference.script} is not defined in ${reference.workspace || reference.prefix || "root package.json"}`;
  }

  return null;
}

function main() {
  const markdownFiles = listMarkdownFiles(docsRoot).filter((filePath) =>
    isStagedDoc(normalizeSlashes(path.relative(repoRoot, filePath))),
  );
  const packageMap = loadPackageMap();
  const failures = [];
  let checkedBlocks = 0;
  let checkedReferences = 0;

  for (const filePath of markdownFiles) {
    const relativePath = normalizeSlashes(path.relative(repoRoot, filePath));

    for (const block of parseCodeFences(filePath)) {
      if (!block.language) {
        continue;
      }

      try {
        switch (block.language) {
          case "json":
            if (shouldValidateJsonBlock(block)) {
              validateJsonBlock(block);
              checkedBlocks += 1;
            }
            break;
          case "yaml":
          case "yml":
            if (shouldValidateYamlBlock(block)) {
              validateYamlBlock(block);
              checkedBlocks += 1;
            }
            break;
          default:
            break;
        }
      } catch (error) {
        failures.push(`${relativePath}:${block.startLine} ${block.language} snippet is invalid: ${error.message}`);
      }
    }

    for (const reference of collectScriptReferences(filePath)) {
      checkedReferences += 1;
      const failure = validateScriptReference(reference, packageMap);
      if (failure) {
        failures.push(`${reference.file}:${reference.line} ${failure}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("[docs:snippets] documentation sample drift detected:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        checkedFiles: markdownFiles.length,
        checkedBlocks,
        checkedCommandReferences: checkedReferences,
      },
      null,
      2,
    ),
  );
}

main();
