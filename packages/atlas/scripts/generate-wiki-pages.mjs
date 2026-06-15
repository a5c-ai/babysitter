/**
 * generate-wiki-pages.mjs
 *
 * Pre-build generator that walks library specialization/methodology README.md
 * files and repository docs markdown files, then produces Atlas wiki pages with
 * proper frontmatter.
 *
 * Outputs:
 *   packages/atlas/graph/wiki/library/<slug>.md
 *   packages/atlas/graph/wiki/docs.md
 *   packages/atlas/graph/wiki/docs/<generated>.md
 *
 * These generated pages are gitignored and rebuilt on every Atlas build.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Path resolution ─────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libraryDir = path.resolve(__dirname, "..", "..", "..", "library");
const docsDir = path.resolve(__dirname, "..", "..", "..", "docs");
const wikiOutputDir = path.resolve(__dirname, "..", "graph", "wiki");
const libraryOutputDir = path.join(wikiOutputDir, "library");
const docsOutputDir = path.join(wikiOutputDir, "docs");
const docsIndexPath = path.join(wikiOutputDir, "docs.md");
const repoRoot = path.resolve(__dirname, "..", "..", "..");

// ── Helpers ─────────────────────────────────────────────────────────────────

function findReadmes(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      findReadmes(full, results);
    } else if (entry.name === "README.md") {
      results.push(full);
    }
  }
  return results;
}

function walkMarkdown(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkMarkdown(full, results);
    } else if (entry.name.toLowerCase().endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function stripLeadingFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/**
 * Extract a human-friendly specialization/methodology/docs page name from the
 * README/content or from the directory/file path.
 *
 * Strategy:
 *   1. Use the first H1 heading if present.
 *   2. Otherwise, title-case the fallback name.
 */
function extractTitle(content, fallbackName) {
  const body = stripLeadingFrontmatter(content);
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  return fallbackName
    .replace(/[-_]+/g, " ")
    .replace(/\.md$/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Derive the specialization slug from a library-relative path.
 *
 * Examples:
 *   specializations/web-development/README.md          -> web-development
 *   specializations/domains/business/finance/README.md  -> finance
 *   methodologies/tdd/README.md                         -> tdd
 *   methodologies/scrum/README.md                       -> scrum
 */
function deriveLibrarySlug(relPath) {
  const parts = relPath.split(/[\\/]/).filter(Boolean);
  if (parts[parts.length - 1] === "README.md") parts.pop();
  const dirName = parts[parts.length - 1];
  if (!dirName) return null;
  return slugify(dirName);
}

function deriveDocsSlug(relPath) {
  const parts = relPath
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .split("/")
    .filter(Boolean);
  const last = parts[parts.length - 1]?.toLowerCase();
  if (last === "readme" || last === "index") parts.pop();
  const slugParts = parts.map(slugify).filter(Boolean);
  return ["docs", ...slugParts].join("/") || "docs";
}

function docsArticlePath(relPath) {
  return `wiki/docs/${relPath.replace(/\\/g, "/")}`;
}

function outputPathForSlug(slug) {
  return path.join(wikiOutputDir, `${slug}.md`);
}

function makeUniqueSlug(slug, usedSlugs, relPath) {
  if (!usedSlugs.has(slug)) {
    usedSlugs.set(slug, relPath);
    return slug;
  }
  const suffix = slugify(relPath.replace(/\.md$/i, ""));
  let candidate = `${slug}-${suffix}`;
  let counter = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${slug}-${suffix}-${counter}`;
    counter += 1;
  }
  usedSlugs.set(candidate, relPath);
  return candidate;
}

/**
 * Determine the category label for a README based on its library path.
 */
function deriveCategory(relPath) {
  if (relPath.startsWith("methodologies")) return "methodology";
  if (relPath.includes("domains/")) return "domain-specialization";
  return "specialization";
}

function relativeFromRoot(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function writePage(filePath, frontmatter, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${yamlString(item)}`);
    } else {
      lines.push(`${key}: ${yamlString(value)}`);
    }
  }
  lines.push("---", "", body.trimStart());
  fs.writeFileSync(filePath, `${lines.join("\n").trimEnd()}\n`);
}

// ── Library pages ───────────────────────────────────────────────────────────

function generateLibraryPages() {
  console.log("[generate-wiki-pages] scanning library READMEs...");

  if (fs.existsSync(libraryOutputDir)) {
    fs.rmSync(libraryOutputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(libraryOutputDir, { recursive: true });

  if (!fs.existsSync(libraryDir)) {
    console.log("[generate-wiki-pages] library dir not found, skipping library pages");
    return 0;
  }

  const readmes = [];
  const specDir = path.join(libraryDir, "specializations");
  if (fs.existsSync(specDir)) {
    for (const entry of fs.readdirSync(specDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules" || entry.name === "domains") continue;
      const readme = path.join(specDir, entry.name, "README.md");
      if (fs.existsSync(readme)) readmes.push(readme);
    }
  }

  const domainsDir = path.join(specDir, "domains");
  if (fs.existsSync(domainsDir)) {
    for (const cat of fs.readdirSync(domainsDir, { withFileTypes: true })) {
      if (!cat.isDirectory()) continue;
      for (const spec of fs.readdirSync(path.join(domainsDir, cat.name), { withFileTypes: true })) {
        if (!spec.isDirectory()) continue;
        const readme = path.join(domainsDir, cat.name, spec.name, "README.md");
        if (fs.existsSync(readme)) readmes.push(readme);
      }
    }
  }

  const methDir = path.join(libraryDir, "methodologies");
  if (fs.existsSync(methDir)) {
    for (const entry of fs.readdirSync(methDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules" || entry.name === "shared") continue;
      const readme = path.join(methDir, entry.name, "README.md");
      if (fs.existsSync(readme)) readmes.push(readme);
    }
  }

  const usedSlugs = new Map();
  let count = 0;

  for (const readme of readmes) {
    const content = fs.readFileSync(readme, "utf8");
    const relPath = path.relative(libraryDir, readme).split(path.sep).join("/");
    const slug = deriveLibrarySlug(relPath);
    if (!slug) continue;

    const category = deriveCategory(relPath);
    let finalSlug = slug;
    if (usedSlugs.has(slug)) {
      const existing = usedSlugs.get(slug);
      if (existing.category !== category) {
        if (!existing.renamed) {
          const oldPath = path.join(libraryOutputDir, `${slug}.md`);
          const newSlug = `${existing.category}-${slug}`;
          const newPath = path.join(libraryOutputDir, `${newSlug}.md`);
          if (fs.existsSync(oldPath)) {
            const oldContent = fs.readFileSync(oldPath, "utf8");
            fs.writeFileSync(
              newPath,
              oldContent
                .replace(`id: "page:library-${slug}"`, `id: "page:library-${newSlug}"`)
                .replace(`slug: "library/${slug}"`, `slug: "library/${newSlug}"`)
            );
            fs.unlinkSync(oldPath);
          }
          existing.renamed = true;
          existing.finalSlug = newSlug;
        }
        finalSlug = `${category}-${slug}`;
      } else {
        let counter = 2;
        while (usedSlugs.has(`${slug}-${counter}`)) counter++;
        finalSlug = `${slug}-${counter}`;
      }
    }
    usedSlugs.set(finalSlug, { category, renamed: false, finalSlug });

    const relDir = path.dirname(relPath);
    const dirName = relDir.split("/").pop();
    const title = extractTitle(content, dirName);
    const specId = `specialization:${slug}`;

    writePage(
      path.join(libraryOutputDir, `${finalSlug}.md`),
      {
        id: `page:library-${finalSlug}`,
        nodeKind: "Page",
        title: `${title} (Library)`,
        slug: `library/${finalSlug}`,
        articlePath: `wiki/library/${finalSlug}.md`,
        documents: [specId],
      },
      content,
    );
    count++;
  }

  console.log(`[generate-wiki-pages] library: ${count} pages written to graph/wiki/library/`);
  return count;
}

// ── Docs pages ──────────────────────────────────────────────────────────────

function generateDocsPages() {
  console.log("[generate-wiki-pages] scanning docs markdown...");

  if (fs.existsSync(docsOutputDir)) {
    fs.rmSync(docsOutputDir, { recursive: true, force: true });
  }
  if (fs.existsSync(docsIndexPath)) {
    fs.rmSync(docsIndexPath, { force: true });
  }

  if (!fs.existsSync(docsDir)) {
    console.log("[generate-wiki-pages] docs dir not found, skipping docs pages");
    return 0;
  }

  const usedSlugs = new Map([["docs", "docs-index"]]);
  const pages = [];

  for (const file of walkMarkdown(docsDir).sort()) {
    const relPath = path.relative(docsDir, file).split(path.sep).join("/");
    const raw = fs.readFileSync(file, "utf8");
    const body = stripLeadingFrontmatter(raw);
    const slug = makeUniqueSlug(deriveDocsSlug(relPath), usedSlugs, relPath);
    const fallbackName = path.basename(relPath, ".md");
    const title = extractTitle(raw, fallbackName);
    const articlePath = docsArticlePath(relPath);

    writePage(
      outputPathForSlug(slug),
      {
        id: `page:${slug.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        nodeKind: "Page",
        title,
        slug,
        articlePath,
        sourcePath: relativeFromRoot(file),
        sourceKind: "repo-docs",
      },
      body,
    );

    pages.push({ slug, title, articlePath });
  }

  const topLevelPages = pages
    .filter((page) => page.slug.split("/").length === 2)
    .sort((a, b) => a.title.localeCompare(b.title));
  const indexBody = [
    "# Babysitter Docs",
    "",
    "Atlas wiki mirror of the repository docs site. The existing docs site remains unchanged; these pages are generated from `docs` markdown during the Atlas build.",
    "",
    "## Sections",
    "",
    ...topLevelPages.map((page) => `- [${page.title}](${path.posix.relative("wiki", page.articlePath)})`),
    "",
  ].join("\n");

  writePage(
    docsIndexPath,
    {
      id: "page:docs",
      nodeKind: "Page",
      title: "Babysitter Docs",
      slug: "docs",
      articlePath: "wiki/docs.md",
      sourcePath: "docs",
      sourceKind: "repo-docs-index",
    },
    indexBody,
  );

  console.log(`[generate-wiki-pages] docs: ${pages.length + 1} pages written to graph/wiki/docs/`);
  return pages.length + 1;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const libraryCount = generateLibraryPages();
  const docsCount = generateDocsPages();
  console.log(`[generate-wiki-pages] done: ${libraryCount + docsCount} total pages written`);
}

main();
