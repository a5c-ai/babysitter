const fs = require('node:fs');
const path = require('node:path');

const defaultRoots = ['graph'];
const roots = process.argv.slice(2).filter(Boolean);
const scanRoots = roots.length ? roots : defaultRoots;
const allowedExtensions = new Set(['.yaml', '.yml', '.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsonc', '.md']);
const ignoredDirectories = new Set(['.git', 'node_modules', '.a5c/runs']);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isIgnored(filePath) {
  const posix = toPosix(filePath);
  return [...ignoredDirectories].some((dir) => posix === dir || posix.startsWith(`${dir}/`) || posix.includes(`/${dir}/`));
}

function collectFiles(root) {
  if (!fs.existsSync(root)) return [];
  const stat = fs.statSync(root);
  if (stat.isFile()) return allowedExtensions.has(path.extname(root)) ? [root] : [];
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (isIgnored(fullPath)) continue;
    if (entry.isDirectory()) out.push(...collectFiles(fullPath));
    if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) out.push(fullPath);
  }
  return out;
}

function firstHashComment(line) {
  let single = false;
  let double = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const prev = index > 0 ? line[index - 1] : '';
    if (char === "'" && !double) single = !single;
    if (char === '"' && !single && prev !== '\\') double = !double;
    if (char === '#' && !single && !double) return index;
  }
  return -1;
}

function scanHashComments(filePath, text) {
  return text.split(/\r?\n/).flatMap((line, lineIndex) => {
    const column = firstHashComment(line);
    if (column < 0) return [];
    return [{ file: toPosix(filePath), line: lineIndex + 1, column: column + 1, kind: 'hash', text: line.slice(column).trim() }];
  });
}

function scanSlashComments(filePath, text) {
  const comments = [];
  let line = 1;
  let column = 1;
  let state = 'code';
  let quote = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] || '';
    if (state === 'code') {
      if (char === '"' || char === "'" || char === '`') {
        state = 'string';
        quote = char;
      } else if (char === '/' && next === '/') {
        const end = text.indexOf('\n', index);
        const stop = end < 0 ? text.length : end;
        comments.push({ file: toPosix(filePath), line, column, kind: 'line', text: text.slice(index, stop).trim() });
        index = stop - 1;
        column += stop - index;
        continue;
      } else if (char === '/' && next === '*') {
        comments.push({ file: toPosix(filePath), line, column, kind: 'block', text: '/*' });
        state = 'block';
        index += 1;
        column += 1;
      }
    } else if (state === 'string') {
      if (char === '\\') {
        index += 1;
        column += 1;
      } else if (char === quote) {
        state = 'code';
        quote = '';
      }
    } else if (state === 'block' && char === '*' && next === '/') {
      state = 'code';
      index += 1;
      column += 1;
    }
    if (char === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return comments;
}

function scanFile(filePath) {
  const ext = path.extname(filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  if (ext === '.yaml' || ext === '.yml') return scanHashComments(filePath, text);
  if (['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsonc'].includes(ext)) return scanSlashComments(filePath, text);
  if (ext === '.md') return scanHashComments(filePath, text).filter((item) => !/^#{1,6}\s+/.test(item.text));
  return [];
}

const files = scanRoots.flatMap(collectFiles);
const comments = files.flatMap(scanFile);
const result = { ok: comments.length === 0, count: comments.length, comments };
console.log(JSON.stringify(result, null, 2));
if (comments.length > 0) process.exitCode = 1;
