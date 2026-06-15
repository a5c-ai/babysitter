const fs = require("fs");
const path = require("path");

const { docsRoot, repoRoot, normalizeSlashes, isStagedDoc } = require("./docs-qa-config.cjs");

const STYLE_RULES = [
  { pattern: /\bblacklist\b/i, replacement: "blocklist" },
  { pattern: /\bwhitelist\b/i, replacement: "allowlist" },
  { pattern: /\bmaster\b/, replacement: "main, primary, or leader" },
  { pattern: /\bslave\b/, replacement: "replica, follower, or secondary" },
  { pattern: /\bguys\b/i, replacement: "folks, team, or everyone" },
  { pattern: /\bsanity check\b/i, replacement: "quick check or validation" },
  { pattern: /\bdummy value\b/i, replacement: "placeholder value" },
];

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

function shouldSkipLine(line) {
  return line.includes("http://") || line.includes("https://");
}

function main() {
  const failures = [];
  const markdownFiles = listMarkdownFiles(docsRoot).filter((filePath) =>
    isStagedDoc(normalizeSlashes(path.relative(repoRoot, filePath))),
  );

  for (const filePath of markdownFiles) {
    const relativePath = normalizeSlashes(path.relative(repoRoot, filePath));
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (shouldSkipLine(line)) {
        continue;
      }
      const styleText = line.replace(/`[^`]*`/g, "");

      for (const rule of STYLE_RULES) {
        if (rule.pattern.test(styleText)) {
          failures.push(
            `${relativePath}:${lineIndex + 1} matched ${rule.pattern} -> prefer ${rule.replacement}`,
          );
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error("[docs:lint:style] technical-writing issues detected:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        checkedFiles: markdownFiles.length,
        ruleCount: STYLE_RULES.length,
        issueCount: failures.length,
      },
      null,
      2,
    ),
  );
}

main();
