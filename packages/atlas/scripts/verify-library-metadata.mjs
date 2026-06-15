#!/usr/bin/env node
/**
 * verify-library-metadata.mjs
 *
 * Non-blocking verification script that warns about library processes, skills,
 * and agents missing graph metadata (@graph JSDoc or graph: frontmatter).
 *
 * Usage:
 *   node verify-library-metadata.mjs [--quiet] [--strict] [--min-coverage N]
 *
 * Flags:
 *   --quiet           Only print summary, not individual warnings
 *   --strict          Exit with code 1 if overall coverage is below --min-coverage
 *   --min-coverage N  Minimum required coverage percentage (default: 0, implies --strict)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Path resolution ─────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script lives at packages/atlas/scripts/ — library is at ../../library relative to scripts/
const libraryDir = path.resolve(__dirname, "..", "..", "..", "library");

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const strict = args.includes("--strict");

let minCoverage = 0;
const minIdx = args.indexOf("--min-coverage");
if (minIdx !== -1 && args[minIdx + 1] !== undefined) {
  minCoverage = parseFloat(args[minIdx + 1]);
  if (isNaN(minCoverage)) minCoverage = 0;
}

// ── File walking ─────────────────────────────────────────────────────────────

/**
 * Walk a directory recursively, collecting files that match a predicate.
 * Skips node_modules, .git, and __tests__ directories.
 */
function walkDir(dir, predicate, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "__tests__"
      ) {
        continue;
      }
      walkDir(full, predicate, results);
    } else if (predicate(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Return a path relative to libraryDir using forward slashes, prefixed with "library/".
 */
function relPath(filePath) {
  return "library/" + path.relative(libraryDir, filePath).split(path.sep).join("/");
}

// ── Metadata detectors ───────────────────────────────────────────────────────

/**
 * Returns true if the JS file content contains a @graph tag inside a JSDoc comment.
 */
function jsHasGraphAnnotation(content) {
  return /@graph\b/.test(content);
}

/**
 * Returns true if the Markdown file has a YAML frontmatter block containing a
 * top-level "graph:" key.
 */
function mdHasGraphFrontmatter(content) {
  // Must start with ---
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return false;
  const yaml = fmMatch[1];
  // Look for a top-level "graph:" key (at start of line, possibly with spaces, not indented)
  return /^graph\s*:/m.test(yaml);
}

// ── Collection ───────────────────────────────────────────────────────────────

const processFiles = walkDir(
  libraryDir,
  (name) =>
    name.endsWith(".js") &&
    !name.endsWith(".test.js") &&
    !name.endsWith(".spec.js"),
);

const skillFiles = walkDir(libraryDir, (name) => name === "SKILL.md");
const agentFiles = walkDir(libraryDir, (name) => name === "AGENT.md");

// ── Checking ─────────────────────────────────────────────────────────────────

const missingProcesses = [];
const missingSkills = [];
const missingAgents = [];

for (const file of processFiles) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!jsHasGraphAnnotation(content)) {
    missingProcesses.push(file);
  }
}

for (const file of skillFiles) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!mdHasGraphFrontmatter(content)) {
    missingSkills.push(file);
  }
}

for (const file of agentFiles) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!mdHasGraphFrontmatter(content)) {
    missingAgents.push(file);
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

const totalProcesses = processFiles.length;
const totalSkills = skillFiles.length;
const totalAgents = agentFiles.length;

const coveredProcesses = totalProcesses - missingProcesses.length;
const coveredSkills = totalSkills - missingSkills.length;
const coveredAgents = totalAgents - missingAgents.length;

if (!quiet) {
  for (const f of missingProcesses) {
    console.warn(`⚠ Missing @graph: ${relPath(f)}`);
  }
  for (const f of missingSkills) {
    console.warn(`⚠ Missing graph: ${relPath(f)}`);
  }
  for (const f of missingAgents) {
    console.warn(`⚠ Missing graph: ${relPath(f)}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

function pct(covered, total) {
  if (total === 0) return "100.0%";
  return ((covered / total) * 100).toFixed(1) + "%";
}

function pad(label, width) {
  return label.padEnd(width);
}

console.log("");
console.log("=== Library Graph Metadata Coverage ===");
console.log(`${pad("Processes:", 11)} ${coveredProcesses}/${totalProcesses} (${pct(coveredProcesses, totalProcesses)})`);
console.log(`${pad("Skills:", 11)} ${coveredSkills}/${totalSkills} (${pct(coveredSkills, totalSkills)})`);
console.log(`${pad("Agents:", 11)} ${coveredAgents}/${totalAgents} (${pct(coveredAgents, totalAgents)})`);

// ── Exit code ─────────────────────────────────────────────────────────────────

if (strict || minCoverage > 0) {
  const totalAll = totalProcesses + totalSkills + totalAgents;
  const coveredAll = coveredProcesses + coveredSkills + coveredAgents;
  const overallPct = totalAll === 0 ? 100 : (coveredAll / totalAll) * 100;

  if (overallPct < minCoverage) {
    console.error(
      `\n✗ Coverage ${overallPct.toFixed(1)}% is below required minimum ${minCoverage}%`,
    );
    process.exit(1);
  }
}

// Always exit 0 in normal (non-strict) mode
process.exit(0);
