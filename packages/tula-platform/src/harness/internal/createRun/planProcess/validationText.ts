function sanitizeJavaScriptForStructuralChecks(source: string): string {
  const normalized = source.replace(/\r\n/g, "\n");
  let result = "";
  let i = 0;
  let state:
    | "normal"
    | "single"
    | "double"
    | "template"
    | "line-comment"
    | "block-comment" = "normal";
  const templateExpressionBraceStack: number[] = [];

  const mask = (ch: string): string => (ch === "\n" ? "\n" : " ");

  while (i < normalized.length) {
    const ch = normalized[i] ?? "";
    const next = normalized[i + 1] ?? "";

    if (state === "line-comment") {
      result += mask(ch);
      if (ch === "\n") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (state === "block-comment") {
      result += mask(ch);
      if (ch === "*" && next === "/") {
        result += " ";
        i += 2;
        state = "normal";
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "single") {
      result += mask(ch);
      if (ch === "\\") {
        result += mask(next);
        i += 2;
        continue;
      }
      if (ch === "'") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (state === "double") {
      result += mask(ch);
      if (ch === "\\") {
        result += mask(next);
        i += 2;
        continue;
      }
      if (ch === "\"") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (state === "template") {
      if (ch === "$" && next === "{") {
        result += "${";
        templateExpressionBraceStack.push(0);
        i += 2;
        state = "normal";
        continue;
      }
      result += mask(ch);
      if (ch === "\\") {
        result += mask(next);
        i += 2;
        continue;
      }
      if (ch === "`") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      result += "  ";
      i += 2;
      state = "line-comment";
      continue;
    }

    if (ch === "/" && next === "*") {
      result += "  ";
      i += 2;
      state = "block-comment";
      continue;
    }

    if (ch === "'") {
      result += " ";
      i += 1;
      state = "single";
      continue;
    }

    if (ch === "\"") {
      result += " ";
      i += 1;
      state = "double";
      continue;
    }

    if (ch === "`") {
      result += " ";
      i += 1;
      state = "template";
      continue;
    }

    result += ch;

    if (templateExpressionBraceStack.length > 0) {
      const topIndex = templateExpressionBraceStack.length - 1;
      if (ch === "{") {
        templateExpressionBraceStack[topIndex] += 1;
      } else if (ch === "}") {
        if (templateExpressionBraceStack[topIndex] === 0) {
          templateExpressionBraceStack.pop();
          state = "template";
        } else {
          templateExpressionBraceStack[topIndex] -= 1;
        }
      }
    }

    i += 1;
  }

  return result;
}

export function hasNamedProcessGlobalReferenceConflict(source: string): boolean {
  const normalized = sanitizeJavaScriptForStructuralChecks(source).replace(/\r\n/g, "\n");
  if (!/export\s+async\s+function\s+process\s*\(/.test(normalized)) {
    return false;
  }
  return /(^|[^.\w$])process\./m.test(normalized);
}

export function assumesRuntimeWorkspacePathWithoutModuleFallback(source: string): boolean {
  const normalized = sanitizeJavaScriptForStructuralChecks(source).replace(/\r\n/g, "\n");
  const usesContextWorkspacePath =
    /\bctx\??\.workspaceDir\b/.test(normalized) ||
    /\bctx\??\.cwd\b/.test(normalized);
  if (!usesContextWorkspacePath) {
    return false;
  }
  return !/\bimport\.meta\.url\b/.test(normalized);
}
