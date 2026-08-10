#!/usr/bin/env node
/**
 * Relative-link + anchor checker for the kip-sdk doc set (docs D-13/D-14 mitigation).
 *
 * Scans packages/kip-sdk/SPEC.md and packages/kip-sdk/docs/*.md; for every markdown link with a
 * relative target it verifies (a) the target file exists and (b) when the link carries a #fragment,
 * the fragment resolves to either an explicit <a id="..."> tag or a GitHub-slugified heading in the
 * target file. External (http/https/mailto) links and links escaping packages/kip-sdk are ignored
 * (existence-checked only when inside the repo).
 *
 * Exit code 1 on any dangling link/anchor — wired as a CI gate by
 * .github/workflows/kip-docs-link-check.yml.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  join(pkgRoot, "SPEC.md"),
  ...readdirSync(join(pkgRoot, "docs"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(pkgRoot, "docs", f)),
];

/** GitHub-style heading slug (close-enough approximation for this doc set). */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // inline links → text
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}

const anchorsByFile = new Map();
function anchorsOf(file) {
  if (anchorsByFile.has(file)) return anchorsByFile.get(file);
  const set = new Set();
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/<a\s+id="([^"]+)"/g)) set.add(m[1]);
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      // strip any leading <a id> tag from the heading text before slugifying
      set.add(slugify(h[1].replace(/<a\s[^>]*><\/a>/g, "")));
    }
  }
  anchorsByFile.set(file, set);
  return set;
}

let failures = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  let inFence = false;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) return;
    for (const m of line.matchAll(/\]\(([^()\s]+)\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:|#)/.test(target)) {
        if (target.startsWith("#")) {
          const frag = decodeURIComponent(target.slice(1));
          if (!anchorsOf(file).has(frag) && !anchorsOf(file).has(frag.toLowerCase())) {
            console.error(`${file}:${i + 1} dangling in-page anchor ${target}`);
            failures++;
          }
        }
        continue;
      }
      const [pathPart, frag] = target.split("#");
      const resolved = resolve(dirname(file), pathPart);
      if (!resolved.startsWith(pkgRoot)) {
        // escapes packages/kip-sdk — existence check only, skip anchors
        if (!existsSync(resolved)) {
          console.error(`${file}:${i + 1} dangling external-relative link ${target}`);
          failures++;
        }
        continue;
      }
      if (!existsSync(resolved) || !statSync(resolved).isFile()) {
        console.error(`${file}:${i + 1} dangling link ${target}`);
        failures++;
        continue;
      }
      if (frag && resolved.endsWith(".md")) {
        const f = decodeURIComponent(frag);
        if (!anchorsOf(resolved).has(f) && !anchorsOf(resolved).has(f.toLowerCase())) {
          console.error(`${file}:${i + 1} missing anchor #${frag} in ${pathPart}`);
          failures++;
        }
      }
    }
  });
}

if (failures) {
  console.error(`\n${failures} dangling link(s)/anchor(s).`);
  process.exit(1);
}
console.log(`OK — ${files.length} files, all relative links and anchors resolve.`);
