import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Node,
  Project,
  type InterfaceDeclaration,
  type PropertySignature,
  type SourceFile,
  type TypeNode,
} from 'ts-morph';

type EnumModel = {
  name: string;
  values: string[];
};

type PropertyModel = {
  name: string;
  type: string;
  optional: boolean;
  literalValue?: string;
};

type InterfaceModel = {
  name: string;
  properties: PropertyModel[];
};

type UnionAliasModel = {
  name: string;
  directRefs: string[];
  members: string[];
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(scriptDir, '..');
const packageRoot = path.resolve(srcRoot, '..');
const repoRoot = path.resolve(packageRoot, '..', '..', '..');
const protocolPath = path.join(srcRoot, 'protocol', 'v1.ts');
const outputPath = path.join(packageRoot, 'build', 'schema', 'kotlin', 'AmuxProtocol.kt');

async function main(): Promise<void> {
  const project = new Project({ tsConfigFilePath: path.join(repoRoot, 'tsconfig.json') });
  const source = project.addSourceFileAtPath(protocolPath);
  const literalEnums = new Map<string, EnumModel>();
  const propertyEnums = new Map<string, EnumModel>();
  for (const model of collectLiteralEnums(source)) {
    literalEnums.set(model.name, model);
  }
  const unionAliases = collectUnionAliases(source);
  const unionAliasNames = new Set(unionAliases.map((alias) => alias.name));
  const unionParents = new Map<string, string[]>();
  const interfaces = source.getInterfaces().map((declaration) =>
    buildInterfaceModel(declaration, literalEnums, propertyEnums),
  );

  const directParents = new Map<string, string[]>();
  for (const alias of unionAliases) {
    for (const ref of alias.directRefs) {
      if (unionAliasNames.has(ref)) {
        const parents = unionParents.get(ref) ?? [];
        parents.push(alias.name);
        unionParents.set(ref, parents);
      }
      if (interfaces.some((entry) => entry.name === ref)) {
        const parents = directParents.get(ref) ?? [];
        parents.push(alias.name);
        directParents.set(ref, parents);
      }
    }
  }

  const content = [
    'package ai.a5c.agentmux',
    '',
    'import kotlinx.serialization.SerialName',
    'import kotlinx.serialization.Serializable',
    'import kotlinx.serialization.json.JsonElement',
    '',
    ...Array.from(literalEnums.values()).map(renderKotlinEnum),
    ...Array.from(propertyEnums.values()).map(renderKotlinEnum),
    ...unionAliases.map((alias) => renderKotlinUnion(alias, unionParents.get(alias.name) ?? [])),
    ...interfaces.map((model) => renderKotlinDataClass(model, directParents.get(model.name) ?? [])),
    '',
  ]
    .filter(Boolean)
    .join('\n\n');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, 'utf8');
}

function collectUnionAliases(source: SourceFile): UnionAliasModel[] {
  const directRefs = new Map<string, string[]>();
  for (const declaration of source.getTypeAliases()) {
    const refs = readTypeReferenceUnion(declaration.getTypeNodeOrThrow());
    if (refs) {
      directRefs.set(declaration.getName(), refs);
    }
  }

  const expand = (name: string, seen = new Set<string>()): string[] => {
    if (seen.has(name)) {
      return [];
    }
    seen.add(name);

    const refs = directRefs.get(name) ?? [];
    const expanded: string[] = [];
    for (const ref of refs) {
      if (directRefs.has(ref)) {
        expanded.push(...expand(ref, seen));
      } else {
        expanded.push(ref);
      }
    }
    return [...new Set(expanded)];
  };

  return Array.from(directRefs.entries()).map(([name, refs]) => ({
    name,
    directRefs: refs,
    members: expand(name),
  }));
}

function collectLiteralEnums(source: SourceFile): EnumModel[] {
  return source.getTypeAliases().flatMap((declaration) => {
    const values = readLiteralEnumValues(declaration.getTypeNodeOrThrow());
    return values ? [{ name: declaration.getName(), values }] : [];
  });
}

function buildInterfaceModel(
  declaration: InterfaceDeclaration,
  literalEnums: Map<string, EnumModel>,
  propertyEnums: Map<string, EnumModel>,
): InterfaceModel {
  return {
    name: declaration.getName(),
    properties: declaration.getProperties().map((property) =>
      buildPropertyModel(declaration.getName(), property, literalEnums, propertyEnums),
    ),
  };
}

function buildPropertyModel(
  interfaceName: string,
  property: PropertySignature,
  literalEnums: Map<string, EnumModel>,
  propertyEnums: Map<string, EnumModel>,
): PropertyModel {
  const typeNode = property.getTypeNodeOrThrow();
  return {
    name: property.getName(),
    type: mapKotlinType(interfaceName, property.getName(), typeNode, literalEnums, propertyEnums),
    optional: property.hasQuestionToken(),
    literalValue: readLiteralValue(typeNode),
  };
}

function readLiteralValue(typeNode: TypeNode): string | undefined {
  if (!Node.isLiteralTypeNode(typeNode)) {
    return undefined;
  }
  const literal = typeNode.getLiteral();
  return Node.isStringLiteral(literal) ? literal.getLiteralText() : undefined;
}

function readStringLiteralUnion(typeNode: TypeNode): string[] | null {
  if (!Node.isUnionTypeNode(typeNode)) {
    return null;
  }

  const values = typeNode.getTypeNodes().map((member) => {
    if (!Node.isLiteralTypeNode(member)) {
      return null;
    }
    const literal = member.getLiteral();
    return Node.isStringLiteral(literal) ? literal.getLiteralText() : null;
  });

  return values.every((value): value is string => value !== null) ? values : null;
}

function readLiteralEnumValues(typeNode: TypeNode): string[] | null {
  const unionValues = readStringLiteralUnion(typeNode);
  if (unionValues) {
    return unionValues;
  }
  if (!Node.isLiteralTypeNode(typeNode)) {
    return null;
  }
  const literal = typeNode.getLiteral();
  return Node.isStringLiteral(literal) ? [literal.getLiteralText()] : null;
}

function readTypeReferenceUnion(typeNode: TypeNode): string[] | null {
  if (!Node.isUnionTypeNode(typeNode)) {
    return null;
  }

  const refs = typeNode.getTypeNodes().map((member) => {
    if (!Node.isTypeReference(member)) {
      return null;
    }
    return member.getTypeName().getText();
  });

  return refs.every((value): value is string => value !== null) ? refs : null;
}

function mapKotlinType(
  interfaceName: string,
  propertyName: string,
  typeNode: TypeNode,
  literalEnums: Map<string, EnumModel>,
  propertyEnums: Map<string, EnumModel>,
): string {
  if (Node.isStringKeyword(typeNode)) return 'String';
  if (Node.isNumberKeyword(typeNode)) return 'Double';
  if (Node.isBooleanKeyword(typeNode)) return 'Boolean';
  if (Node.isArrayTypeNode(typeNode)) {
    return `List<${mapKotlinType(interfaceName, propertyName, typeNode.getElementTypeNode(), literalEnums, propertyEnums)}>`;
  }
  if (Node.isTypeReference(typeNode)) {
    const typeText = typeNode.getText();
    if (typeText === 'Record<string, unknown>') {
      return 'Map<String, JsonElement>';
    }
    return typeText;
  }
  if (Node.isTypeLiteral(typeNode)) {
    return 'Map<String, JsonElement>';
  }

  const stringUnion = readStringLiteralUnion(typeNode);
  if (stringUnion) {
    const enumName = `${interfaceName}${toPascalCase(propertyName)}`;
    propertyEnums.set(enumName, { name: enumName, values: stringUnion });
    return enumName;
  }

  if (Node.isLiteralTypeNode(typeNode)) {
    return 'String';
  }

  const typeText = typeNode.getText();
  if (typeText === 'unknown') {
    return 'JsonElement';
  }
  if (literalEnums.has(typeText)) {
    return typeText;
  }
  return 'String';
}

function renderKotlinEnum(model: EnumModel): string {
  const cases = model.values
    .map((value) => `  @SerialName(${JSON.stringify(value)}) ${toKotlinEnumCase(value)}`)
    .join(',\n');
  return `@Serializable\nenum class ${model.name} {\n${cases}\n}`;
}

function renderKotlinUnion(model: UnionAliasModel, parents: string[]): string {
  const parentClause = parents.length > 0 ? ` : ${parents.join(', ')}` : '';
  return `@Serializable\nsealed interface ${model.name}${parentClause}`;
}

function renderKotlinDataClass(model: InterfaceModel, parents: string[]): string {
  const implementsClause = parents.length > 0 ? ` : ${parents.join(', ')}` : '';
  const fields = model.properties
    .map((property) => `  ${renderKotlinProperty(property)}`)
    .join(',\n');
  return `@Serializable\ndata class ${model.name}(\n${fields}\n)${implementsClause}`;
}

function renderKotlinProperty(property: PropertyModel): string {
  if (property.literalValue) {
    return `@SerialName(${JSON.stringify(property.name)}) val ${property.name}: ${property.type} = ${JSON.stringify(property.literalValue)}`;
  }
  if (property.optional) {
    return `val ${property.name}: ${property.type}? = null`;
  }
  return `val ${property.name}: ${property.type}`;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function toKotlinEnumCase(value: string): string {
  const normalized = value
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  if (!normalized) {
    return 'VALUE';
  }
  if (/^\d/.test(normalized)) {
    return `V${normalized}`;
  }
  return normalized;
}

void main();
