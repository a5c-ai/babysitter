export function slug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPath(value, pathExpression) {
  if (!pathExpression || pathExpression === "." || pathExpression === "this") return value;
  return String(pathExpression)
    .split(".")
    .filter(Boolean)
    .reduce((current, segment) => {
      if (current === undefined || current === null) return undefined;
      if (/^\d+$/.test(segment) && Array.isArray(current)) return current[Number(segment)];
      return current[segment];
    }, value);
}

function isTruthy(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function renderValue(expression, context, root) {
  const [name, ...args] = expression.trim().split(/\s+/);
  if (name === "json") return JSON.stringify(getPath(context, args[0]) ?? getPath(root, args[0]), null, 2);
  if (name === "slug") return slug(getPath(context, args[0]) ?? getPath(root, args[0]) ?? args[0]);
  const value = getPath(context, expression) ?? getPath(root, expression);
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function renderBlocks(template, context, root) {
  let output = template;

  output = output.replace(/{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g, (_match, expression, inner) => {
    const collection = getPath(context, expression.trim()) ?? getPath(root, expression.trim());
    if (!Array.isArray(collection)) return "";
    return collection
      .map((item, index) => renderBlocks(inner, { ...item, this: item, "@index": index }, root))
      .join("");
  });

  output = output.replace(/{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g, (_match, expression, inner) => {
    const value = getPath(context, expression.trim()) ?? getPath(root, expression.trim());
    return isTruthy(value) ? renderBlocks(inner, context, root) : "";
  });

  return output.replace(/{{\s*([^#/][^}]*)\s*}}/g, (_match, expression) => renderValue(expression, context, root));
}

export function renderTemplate(template, context = {}) {
  return renderBlocks(template, context, context).replace(/\r\n/g, "\n");
}
