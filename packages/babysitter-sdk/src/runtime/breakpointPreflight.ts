import { promises as fs } from "node:fs";
import { parse } from "acorn";

type AstNode = { type: string; [key: string]: unknown };

/** Inspect the exported process function without executing module code. */
export async function findProtectedBreakpointInSource(
  processPath: string,
  exportName = "process",
): Promise<string | undefined> {
  const source = await fs.readFile(processPath, "utf8");
  let program: AstNode;
  try {
    program = parse(source, { ecmaVersion: "latest", sourceType: "module" }) as unknown as AstNode;
  } catch {
    return "unparseable process entrypoint";
  }
  const processFunction = findExportedFunction(program, exportName);
  if (!processFunction) return "uninspectable process entrypoint";
  const params = processFunction.params as AstNode[];
  const context = params[1];
  if (!context) return undefined;
  if (context.type !== "Identifier") return "uninspectable process context";
  let blocked: string | undefined;
  const scopes: Map<string, boolean>[] = [new Map([[context.name as string, true]])];
  const resolvesToContext = (name: string): boolean => {
    for (let index = scopes.length - 1; index >= 0; index--) {
      if (scopes[index].has(name)) return scopes[index].get(name) ?? false;
    }
    return false;
  };
  const inspect = (node: AstNode): void => {
    if (blocked) return;
    if (node.type === "BlockStatement") {
      const scope = new Map<string, boolean>();
      for (const statement of node.body as AstNode[]) {
        const declaration = statement.type === "ExportNamedDeclaration"
          ? statement.declaration as AstNode | null : statement;
        if (declaration?.type === "VariableDeclaration") {
          for (const item of declaration.declarations as AstNode[]) {
            for (const name of boundNames(item.id as AstNode)) scope.set(name, false);
          }
        } else if (declaration?.type === "FunctionDeclaration") {
          const name = (declaration.id as AstNode | null)?.name as string | undefined;
          if (name) scope.set(name, false);
        }
      }
      scopes.push(scope);
      for (const statement of node.body as AstNode[]) inspect(statement);
      scopes.pop();
      return;
    }
    if (isFunction(node)) {
      const scope = new Map<string, boolean>();
      const name = (node.id as AstNode | null)?.name as string | undefined;
      if (name) scope.set(name, false);
      for (const param of node.params as AstNode[]) {
        for (const boundName of boundNames(param)) scope.set(boundName, false);
      }
      scopes.push(scope);
      inspect(node.body as AstNode);
      scopes.pop();
      return;
    }
    if (node.type === "CatchClause") {
      const scope = new Map<string, boolean>();
      const param = node.param as AstNode | null;
      if (param) for (const name of boundNames(param)) scope.set(name, false);
      scopes.push(scope);
      inspect(node.body as AstNode);
      scopes.pop();
      return;
    }
    if (node.type === "VariableDeclarator") {
      const id = node.id as AstNode;
      const init = node.init as AstNode | null;
      if (id.type === "Identifier") {
        scopes[scopes.length - 1].set(id.name as string,
          init?.type === "Identifier" && resolvesToContext(init.name as string));
      }
      if (init) inspect(init);
      return;
    }
    if (node.type === "CallExpression") {
      const callee = unwrapChain(node.callee as AstNode);
      if (callee.type === "MemberExpression") {
        const object = callee.object as AstNode;
        if (object.type === "Identifier" && resolvesToContext(object.name as string)
          && memberName(callee) === "breakpoint") {
          blocked = inspectBreakpointOptions((node.arguments as AstNode[])[1]);
        }
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === "object" && "type" in child) inspect(child as AstNode);
      } else if (value && typeof value === "object" && "type" in value) {
        inspect(value as AstNode);
      }
    }
  };
  inspect(processFunction.body as AstNode);
  return blocked;
}

function findExportedFunction(program: AstNode, exportName: string): AstNode | undefined {
  const statements = program.body as AstNode[];
  let localName: string | undefined;
  for (const statement of statements) {
    if (exportName === "default" && statement.type === "ExportDefaultDeclaration") {
      const declaration = statement.declaration as AstNode;
      if (isFunction(declaration)) return declaration;
      if (declaration.type === "Identifier") localName = declaration.name as string;
    }
    if (statement.type !== "ExportNamedDeclaration") continue;
    const declaration = statement.declaration as AstNode | null;
    if (declaration) {
      const found = functionNamedInDeclaration(declaration, exportName);
      if (found) return found;
    }
    for (const specifier of statement.specifiers as AstNode[]) {
      if (propertyName(specifier.exported as AstNode) === exportName) {
        localName = propertyName(specifier.local as AstNode);
      }
    }
  }
  if (!localName) return undefined;
  for (const statement of statements) {
    const found = functionNamedInDeclaration(statement, localName);
    if (found) return found;
  }
  return undefined;
}

function functionNamedInDeclaration(node: AstNode, name: string): AstNode | undefined {
  if (node.type === "FunctionDeclaration" && (node.id as AstNode)?.name === name) return node;
  if (node.type === "VariableDeclaration") {
    const declarations = node.declarations as AstNode[];
    const declaration = declarations.find((item) => (item.id as AstNode)?.name === name);
    const init = declaration?.init as AstNode | undefined;
    if (init && isFunction(init)) return init;
  }
  return undefined;
}

function isFunction(node: AstNode): boolean {
  return node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression";
}

function boundNames(pattern: AstNode): string[] {
  if (pattern.type === "Identifier") return [pattern.name as string];
  if (pattern.type === "RestElement") return boundNames(pattern.argument as AstNode);
  if (pattern.type === "AssignmentPattern") return boundNames(pattern.left as AstNode);
  if (pattern.type === "ArrayPattern") {
    return (pattern.elements as Array<AstNode | null>).flatMap((element) => element ? boundNames(element) : []);
  }
  if (pattern.type === "ObjectPattern") {
    return (pattern.properties as AstNode[]).flatMap((property) =>
      boundNames((property.type === "RestElement" ? property.argument : property.value) as AstNode));
  }
  return [];
}

function inspectBreakpointOptions(options?: AstNode): string | undefined {
  if (!options) return undefined;
  if (options.type !== "ObjectExpression") return "dynamic breakpoint options";
  const properties = options.properties as AstNode[];
  const id = properties.find((property) => property.type === "Property"
    && propertyName(property.key as AstNode) === "breakpointId");
  const idValue = id?.value as AstNode | undefined;
  const label = idValue?.type === "Literal" && typeof idValue.value === "string"
    ? idValue.value : "protected breakpoint";
  for (const property of properties) {
    if (property.type !== "Property") return label;
    if (property.computed && (property.key as AstNode).type !== "Literal") return label;
    const key = propertyName(property.key as AstNode);
    if (!key) return label;
    if (key === "expert") {
      const value = property.value as AstNode;
      if (value.type === "Literal" && typeof value.value === "string") {
        if (value.value.trim()) return label;
      } else if (value.type === "ArrayExpression") {
        const experts = value.elements as Array<AstNode | null>;
        if (experts.some((expert) => expert?.type !== "Literal"
          || typeof expert.value !== "string" || expert.value.trim().length > 0)) return label;
      } else if (value.type !== "Literal" || Boolean(value.value)) return label;
    }
    if (key !== "tags") continue;
    const tags = property.value as AstNode;
    if (tags.type !== "ArrayExpression") return label;
    for (const tag of tags.elements as Array<AstNode | null>) {
      if (!tag || tag.type !== "Literal" || typeof tag.value !== "string") return label;
      if (["destructive", "destroy", "approval-gate"].includes(tag.value.toLowerCase())) return label;
    }
  }
  return undefined;
}

function propertyName(node: AstNode): string | undefined {
  if (node.type === "Identifier") return node.name as string;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return undefined;
}

function memberName(node: AstNode): string | undefined {
  const property = node.property as AstNode;
  if (!node.computed) return property.type === "Identifier" ? property.name as string : undefined;
  if (property.type === "Literal" && typeof property.value === "string") return property.value;
  if (property.type === "TemplateLiteral" && (property.expressions as AstNode[]).length === 0) {
    return ((property.quasis as AstNode[])[0].value as { cooked?: string }).cooked;
  }
  return undefined;
}

function unwrapChain(node: AstNode): AstNode {
  return node.type === "ChainExpression" ? node.expression as AstNode : node;
}
