function getDefineTaskBlocks(source: string): Array<{ id: string; body: string }> {
  const normalized = source.replace(/\r\n/g, "\n");
  const pattern =
    /defineTask\(\s*(['"`])([^'"`]+)\1\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\(\{([\s\S]*?)\}\)\s*(?:,\s*\{[\s\S]*?\}\s*)?\)/g;
  const blocks: Array<{ id: string; body: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalized)) !== null) {
    blocks.push({
      id: match[2],
      body: match[3] ?? "",
    });
  }
  return blocks;
}

export function hasDefineTaskBlocks(source: string): boolean {
  return getDefineTaskBlocks(source).length > 0;
}

function getTopLevelTaskProperties(body: string): Map<string, string> {
  const normalized = body.replace(/\r\n/g, "\n");
  const properties = new Map<string, string>();
  let index = 0;

  while (index < normalized.length) {
    index = skipWhitespaceAndComments(normalized, index);
    if (index >= normalized.length) {
      break;
    }
    if (normalized[index] === ",") {
      index += 1;
      continue;
    }
    if (normalized.startsWith("...", index)) {
      index = scanTopLevelValueEnd(normalized, index + 3);
      continue;
    }

    const key = readTopLevelPropertyKey(normalized, index);
    if (!key) {
      index = scanTopLevelValueEnd(normalized, index);
      if (normalized[index] === ",") {
        index += 1;
      }
      continue;
    }

    index = key.nextIndex;
    index = skipWhitespaceAndComments(normalized, index);
    if (normalized[index] !== ":") {
      index = scanTopLevelValueEnd(normalized, index);
      if (normalized[index] === ",") {
        index += 1;
      }
      continue;
    }

    const valueStart = index + 1;
    const valueEnd = scanTopLevelValueEnd(normalized, valueStart);
    properties.set(key.name, normalized.slice(valueStart, valueEnd).trim());
    index = valueEnd;
    if (normalized[index] === ",") {
      index += 1;
    }
  }

  return properties;
}

function readTopLevelPropertyKey(
  source: string,
  index: number,
): { name: string; nextIndex: number } | null {
  const ch = source[index] ?? "";
  if (/[A-Za-z_$]/.test(ch)) {
    let nextIndex = index + 1;
    while (/[\w$]/.test(source[nextIndex] ?? "")) {
      nextIndex += 1;
    }
    return {
      name: source.slice(index, nextIndex),
      nextIndex,
    };
  }

  if (ch === "\"" || ch === "'" || ch === "`") {
    let nextIndex = index + 1;
    let name = "";
    while (nextIndex < source.length) {
      const current = source[nextIndex] ?? "";
      if (current === "\\") {
        name += current;
        nextIndex += 1;
        if (nextIndex < source.length) {
          name += source[nextIndex] ?? "";
          nextIndex += 1;
        }
        continue;
      }
      if (current === ch) {
        return { name, nextIndex: nextIndex + 1 };
      }
      name += current;
      nextIndex += 1;
    }
  }

  return null;
}

function skipWhitespaceAndComments(source: string, start: number): number {
  let index = start;
  while (index < source.length) {
    const ch = source[index] ?? "";
    const next = source[index + 1] ?? "";
    if (/\s/.test(ch)) {
      index += 1;
      continue;
    }
    if (ch === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index = Math.min(index + 2, source.length);
      continue;
    }
    break;
  }
  return index;
}

function scanTopLevelValueEnd(source: string, start: number): number {
  let index = start;
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let state:
    | "normal"
    | "single"
    | "double"
    | "template"
    | "line-comment"
    | "block-comment" = "normal";
  const templateExpressionBraceStack: number[] = [];

  while (index < source.length) {
    const ch = source[index] ?? "";
    const next = source[index + 1] ?? "";

    if (state === "line-comment") {
      if (ch === "\n") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (state === "block-comment") {
      if (ch === "*" && next === "/") {
        index += 2;
        state = "normal";
        continue;
      }
      index += 1;
      continue;
    }

    if (state === "single") {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === "'") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (state === "double") {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === "\"") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (state === "template") {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === "$" && next === "{") {
        templateExpressionBraceStack.push(0);
        index += 2;
        state = "normal";
        continue;
      }
      if (ch === "`") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      index += 2;
      state = "line-comment";
      continue;
    }
    if (ch === "/" && next === "*") {
      index += 2;
      state = "block-comment";
      continue;
    }
    if (ch === "'") {
      index += 1;
      state = "single";
      continue;
    }
    if (ch === "\"") {
      index += 1;
      state = "double";
      continue;
    }
    if (ch === "`") {
      index += 1;
      state = "template";
      continue;
    }

    if (ch === "," && depthParen === 0 && depthBracket === 0 && depthBrace === 0 && templateExpressionBraceStack.length === 0) {
      return index;
    }

    if (ch === "(") {
      depthParen += 1;
    } else if (ch === ")") {
      depthParen = Math.max(0, depthParen - 1);
    } else if (ch === "[") {
      depthBracket += 1;
    } else if (ch === "]") {
      depthBracket = Math.max(0, depthBracket - 1);
    } else if (ch === "{") {
      depthBrace += 1;
      if (templateExpressionBraceStack.length > 0) {
        templateExpressionBraceStack[templateExpressionBraceStack.length - 1] += 1;
      }
    } else if (ch === "}") {
      if (templateExpressionBraceStack.length > 0) {
        const templateDepthIndex = templateExpressionBraceStack.length - 1;
        if (templateExpressionBraceStack[templateDepthIndex] === 0) {
          templateExpressionBraceStack.pop();
          state = "template";
          index += 1;
          continue;
        }
        templateExpressionBraceStack[templateDepthIndex] -= 1;
        depthBrace = Math.max(0, depthBrace - 1);
      } else {
        depthBrace = Math.max(0, depthBrace - 1);
      }
    }

    index += 1;
  }

  return index;
}

export function getDefineTaskIdsMissingKind(source: string): string[] {
  return getDefineTaskBlocks(source)
    .filter((block) => !getTopLevelTaskProperties(block.body).has("kind"))
    .map((block) => block.id);
}

export function getDefineTaskKindShapeMismatches(source: string): Array<{ id: string; expectedKind: string }> {
  const mismatches: Array<{ id: string; expectedKind: string }> = [];
  for (const block of getDefineTaskBlocks(source)) {
    const properties = getTopLevelTaskProperties(block.body);
    const kindValue = properties.get("kind")?.trim();
    if (properties.has("agent") && kindValue !== "\"agent\"" && kindValue !== "'agent'" && kindValue !== "`agent`") {
      mismatches.push({ id: block.id, expectedKind: "agent" });
    }
    if (properties.has("shell") && kindValue !== "\"shell\"" && kindValue !== "'shell'" && kindValue !== "`shell`") {
      mismatches.push({ id: block.id, expectedKind: "shell" });
    }
    if (properties.has("node") && kindValue !== "\"node\"" && kindValue !== "'node'" && kindValue !== "`node`") {
      mismatches.push({ id: block.id, expectedKind: "node" });
    }
  }
  return mismatches;
}

function isAgentResponderTaskBody(body: string): boolean {
  return /\bresponderType\s*:\s*["'`]agent["'`]/.test(body)
    || /\bexternal\s*:\s*true\b/.test(body);
}

function hasNonEmptyAdapterLiteral(body: string): boolean {
  return /\badapter\s*:\s*["'`][^"'`\s][^"'`]*["'`]/.test(body);
}

export function getAgentResponderTasksMissingAdapter(source: string): string[] {
  return getDefineTaskBlocks(source)
    .filter((block) => isAgentResponderTaskBody(block.body) && !hasNonEmptyAdapterLiteral(block.body))
    .map((block) => block.id);
}

export function hasAgentResponderTasks(source: string): boolean {
  return getDefineTaskBlocks(source).some((block) => isAgentResponderTaskBody(block.body));
}

export function getInvalidCtxTaskTargets(source: string): string[] {
  const normalized = source.replace(/\r\n/g, "\n");
  const definedTaskBindings = new Set<string>();
  const defineTaskBindingPattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*defineTask\s*\(/g;
  let defineTaskBindingMatch: RegExpExecArray | null;
  while ((defineTaskBindingMatch = defineTaskBindingPattern.exec(normalized)) !== null) {
    definedTaskBindings.add(defineTaskBindingMatch[1]);
  }

  const invalidTargets = new Set<string>();
  const ctxTaskPattern = /\bctx\.task\s*\(\s*([^,\n]+?)\s*,/g;
  let ctxTaskMatch: RegExpExecArray | null;
  while ((ctxTaskMatch = ctxTaskPattern.exec(normalized)) !== null) {
    const target = (ctxTaskMatch[1] ?? "").trim();
    if (!target) {
      continue;
    }
    if (/^[A-Za-z_$][\w$]*$/.test(target) && definedTaskBindings.has(target)) {
      continue;
    }
    invalidTargets.add(target.replace(/\s+/g, " ").slice(0, 80));
  }

  return Array.from(invalidTargets);
}

export function hasCtxTaskInvocation(source: string): boolean {
  return /\bctx\.task\s*\(/.test(source.replace(/\r\n/g, "\n"));
}

export function getUnresolvedTemplatePlaceholders(source: string): string[] {
  const normalized = source.replace(/\r\n/g, "\n");
  const matches = normalized.match(/\{\{\s*[A-Za-z_$][\w$.]*\s*\}\}/g) ?? [];
  const unique = new Set<string>();
  for (const match of matches) {
    unique.add(match.replace(/\s+/g, ""));
  }
  return Array.from(unique).slice(0, 8);
}

export function getDefineTaskIdsByKind(source: string, kind: "agent" | "shell" | "node"): string[] {
  return getDefineTaskBlocks(source)
    .filter((block) => {
      const kindValue = getTopLevelTaskProperties(block.body).get("kind")?.trim();
      return kindValue === `"${kind}"` || kindValue === `'${kind}'` || kindValue === `\`${kind}\``;
    })
    .map((block) => block.id);
}
