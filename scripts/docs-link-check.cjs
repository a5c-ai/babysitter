const fs = require("fs");
const path = require("path");

const {
  docsRoot,
  repoRoot,
  normalizeSlashes,
  isStagedDoc,
  externalLinkRetries,
  externalLinkTimeoutMs,
} = require("./docs-qa-config.cjs");

const LINK_PATTERN = /!?\[[^\]]*]\(([^)\n]+)\)/g;
const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const EXTERNAL_PROTOCOL_RE = /^(?:[a-z]+:)?\/\//i;
const SKIPPED_PREFIXES = ["mailto:", "tel:", "data:", "javascript:"];

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

function readLines(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function slugifyHeading(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/&amp;/g, "and")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function collectAnchors(filePath) {
  const headings = new Set();
  const lines = readLines(filePath);
  for (const line of lines) {
    const match = line.match(HEADING_PATTERN);
    if (!match) {
      continue;
    }
    const headingText = match[2].trim();
    if (headingText.length === 0) {
      continue;
    }
    headings.add(slugifyHeading(headingText));
  }
  return headings;
}

function stripOptionalTitle(rawDestination) {
  const trimmed = rawDestination.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }

  let inQuote = false;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (char === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && /\s/.test(char)) {
      return trimmed.slice(0, index);
    }
  }

  return trimmed;
}

function isExternalLink(destination) {
  return EXTERNAL_PROTOCOL_RE.test(destination);
}

function isSkippedLink(destination) {
  return SKIPPED_PREFIXES.some((prefix) => destination.startsWith(prefix));
}

function shouldSkipDestination(destination) {
  return (
    destination.length === 0 ||
    destination.includes("<") ||
    destination.includes("{") ||
    isSkippedLink(destination)
  );
}

function resolveMarkdownTarget(sourceFilePath, rawPath) {
  const relativeDirectory = path.dirname(sourceFilePath);
  const candidatePath = path.resolve(relativeDirectory, rawPath);
  const candidates = [candidatePath];

  if (!path.extname(candidatePath)) {
    candidates.push(`${candidatePath}.md`);
    candidates.push(`${candidatePath}.mdx`);
    candidates.push(path.join(candidatePath, "README.md"));
    candidates.push(path.join(candidatePath, "index.md"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function extractLinks(filePath) {
  const issues = [];
  const lines = readLines(filePath);
  const relativeSource = normalizeSlashes(path.relative(repoRoot, filePath));

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    let match;
    while ((match = LINK_PATTERN.exec(line)) !== null) {
      const destination = stripOptionalTitle(match[1]);
      if (shouldSkipDestination(destination) || destination.startsWith("/")) {
        continue;
      }
      issues.push({
        source: relativeSource,
        line: lineIndex + 1,
        destination,
      });
    }
    LINK_PATTERN.lastIndex = 0;
  }

  return issues;
}

function validateLocalLink(link, anchorCache) {
  const [rawTargetPath, rawFragment = ""] = link.destination.split("#");

  if (isExternalLink(link.destination)) {
    return null;
  }

  const targetFilePath =
    rawTargetPath.length === 0
      ? path.join(repoRoot, link.source)
      : resolveMarkdownTarget(path.join(repoRoot, link.source), rawTargetPath);

  if (!targetFilePath) {
    return `${link.destination} -> target file not found`;
  }

  if (rawFragment.length > 0) {
    const cacheKey = normalizeSlashes(path.relative(repoRoot, targetFilePath));
    if (!anchorCache.has(cacheKey)) {
      anchorCache.set(cacheKey, collectAnchors(targetFilePath));
    }

    if (!anchorCache.get(cacheKey).has(rawFragment)) {
      return `${link.destination} -> missing heading #${rawFragment}`;
    }
  }

  return null;
}

async function fetchExternal(destination) {
  for (let attempt = 0; attempt <= externalLinkRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), externalLinkTimeoutMs);
    try {
      let response = await fetch(destination, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });

      if (response.status === 405 || response.status === 501) {
        response = await fetch(destination, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
      }

      return {
        ok: response.ok,
        status: response.status,
        finalUrl: response.url,
      };
    } catch (error) {
      if (attempt === externalLinkRetries) {
        return {
          ok: false,
          error: error.message,
        };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: false,
    error: "unreachable",
  };
}

async function main() {
  const checkExternal = process.env.DOCS_LINK_CHECK_EXTERNAL === "1";
  const failOnExternal = process.env.DOCS_LINK_CHECK_EXTERNAL_FAIL === "1";
  const markdownFiles = listMarkdownFiles(docsRoot).filter((filePath) =>
    isStagedDoc(normalizeSlashes(path.relative(repoRoot, filePath))),
  );

  const links = markdownFiles.flatMap((filePath) => extractLinks(filePath));
  const anchorCache = new Map();
  const localFailures = [];
  const externalFailures = [];
  let externalChecked = 0;

  for (const link of links) {
    if (isExternalLink(link.destination)) {
      if (!checkExternal) {
        continue;
      }

      externalChecked += 1;
      const result = await fetchExternal(link.destination);
      if (!result.ok) {
        externalFailures.push({
          ...link,
          reason: result.error || `HTTP ${result.status}`,
        });
      }
      continue;
    }

    const failure = validateLocalLink(link, anchorCache);
    if (failure) {
      localFailures.push({
        ...link,
        reason: failure,
      });
    }
  }

  const allFailures = failOnExternal ? [...localFailures, ...externalFailures] : localFailures;

  if (allFailures.length > 0) {
    console.error("[docs:links] broken documentation links detected:");
    for (const failure of allFailures) {
      console.error(`- ${failure.source}:${failure.line} ${failure.reason}`);
    }
    process.exit(1);
  }

  if (externalFailures.length > 0) {
    console.warn("[docs:links] external link issues detected (report-only mode):");
    for (const failure of externalFailures) {
      console.warn(`- ${failure.source}:${failure.line} ${failure.reason}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        checkedFiles: markdownFiles.length,
        checkedLinks: links.length,
        externalChecked,
        localFailureCount: localFailures.length,
        externalFailureCount: externalFailures.length,
        externalFailuresAreFatal: failOnExternal,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
