#!/usr/bin/env node
/**
 * Comment-free view of a workflow file, for the gates that decide coverage by
 * looking for a package name in workflow TEXT.
 *
 * The release-matrix coverage gate credits a package as "published by this
 * workflow" when its name appears in the workflow. Matching raw file text also
 * matches comments, so a line like
 *
 *     # @a5c-ai/hooks-adapter-genty is published by the derived matrix
 *
 * satisfied the gate while nothing published the package — the exact failure
 * mode (docs/release-incident-2026-08-13.md) the gate exists to prevent, now
 * spoofable by a comment.
 *
 * A full YAML parse is the wrong instrument here: the workflows carry `run: |`
 * block scalars whose contents are shell, and a package named only inside a
 * SHELL comment is just as fake as one named inside a YAML comment. Both are
 * stripped by the same rule, which is why this is a comment stripper and not a
 * parser.
 *
 * Rule (YAML's own, applied per line, and identical in shell):
 *   - `#` starts a comment when it is at the start of a line or preceded by
 *     whitespace — so `$#`, `foo#bar` and `#!/usr/bin/env` mid-token are NOT
 *     comment starts;
 *   - a `#` inside a single- or double-quoted scalar is literal;
 *   - quoting state is evaluated per line. A scalar deliberately continued
 *     across lines with an unbalanced quote is not something these workflows
 *     do, and the failure direction is safe: text is kept, never dropped
 *     silently — a wrongly stripped name fails the gate loudly.
 *
 * Line structure is preserved (a commented line becomes empty, never deleted),
 * so line numbers stay usable for any caller that reports positions.
 */
'use strict';

/**
 * @param {string} contents raw workflow file text
 * @returns {string} the same text with every comment body blanked out
 */
function stripYamlComments(contents) {
  const lines = String(contents).split('\n');
  const stripped = lines.map((line) => {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (inDouble) {
        if (char === '\\') {
          i += 1;
          continue;
        }
        if (char === '"') inDouble = false;
        continue;
      }
      if (inSingle) {
        // YAML escapes a single quote inside a single-quoted scalar by doubling it.
        if (char === "'") {
          if (line[i + 1] === "'") i += 1;
          else inSingle = false;
        }
        continue;
      }
      if (char === '"') {
        inDouble = true;
        continue;
      }
      if (char === "'") {
        inSingle = true;
        continue;
      }
      if (char === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
        return line.slice(0, i);
      }
    }
    return line;
  });
  return stripped.join('\n');
}

module.exports = { stripYamlComments };
