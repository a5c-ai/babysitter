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
};

type InterfaceModel = {
  name: string;
  discriminator: string | null;
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
const outputPath = path.join(packageRoot, 'build', 'schema', 'swift', 'AmuxProtocol.swift');

async function main(): Promise<void> {
  const project = new Project({ tsConfigFilePath: path.join(repoRoot, 'tsconfig.json') });
  const source = project.addSourceFileAtPath(protocolPath);
  const literalEnums = new Map<string, EnumModel>();
  const propertyEnums = new Map<string, EnumModel>();
  for (const model of collectLiteralEnums(source)) {
    literalEnums.set(model.name, model);
  }
  const unionAliases = collectUnionAliases(source);
  const interfaces = source.getInterfaces().map((declaration) =>
    buildInterfaceModel(declaration, literalEnums, propertyEnums),
  );

  const content = [
    'import Foundation',
    '',
    swiftJsonValue(),
    '',
    ...Array.from(literalEnums.values()).map(renderSwiftEnum),
    ...Array.from(propertyEnums.values()).map(renderSwiftEnum),
    ...interfaces.map(renderSwiftStruct),
    ...unionAliases.map((alias) => renderSwiftUnion(alias, interfaces)),
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

  return Array.from(directRefs.entries())
    .filter(([, refs]) => refs.length > 0)
    .map(([name, refs]) => ({
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
    discriminator: readDiscriminator(declaration),
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
  return {
    name: property.getName(),
    type: mapSwiftType(interfaceName, property.getName(), property.getTypeNodeOrThrow(), literalEnums, propertyEnums),
    optional: property.hasQuestionToken(),
  };
}

function readDiscriminator(declaration: InterfaceDeclaration): string | null {
  const typeProperty = declaration.getProperty('type');
  const typeNode = typeProperty?.getTypeNode();
  if (!typeNode || !Node.isLiteralTypeNode(typeNode)) {
    return null;
  }

  const literal = typeNode.getLiteral();
  return Node.isStringLiteral(literal) ? literal.getLiteralText() : null;
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

function mapSwiftType(
  interfaceName: string,
  propertyName: string,
  typeNode: TypeNode,
  literalEnums: Map<string, EnumModel>,
  propertyEnums: Map<string, EnumModel>,
): string {
  if (Node.isStringKeyword(typeNode)) return 'String';
  if (Node.isNumberKeyword(typeNode)) return 'Double';
  if (Node.isBooleanKeyword(typeNode)) return 'Bool';
  if (Node.isArrayTypeNode(typeNode)) {
    return `[${mapSwiftType(interfaceName, propertyName, typeNode.getElementTypeNode(), literalEnums, propertyEnums)}]`;
  }
  if (Node.isTypeReference(typeNode)) {
    const typeText = typeNode.getText();
    if (typeText === 'Record<string, unknown>') {
      return '[String: JSONValue]';
    }
    return typeText;
  }
  if (Node.isTypeLiteral(typeNode)) {
    return '[String: JSONValue]';
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
    return 'JSONValue';
  }
  if (literalEnums.has(typeText)) {
    return typeText;
  }
  return 'String';
}

function renderSwiftEnum(model: EnumModel): string {
  const cases = model.values
    .map((value) => `  case ${toSwiftIdentifier(value)} = ${JSON.stringify(value)}`)
    .join('\n');
  return `public enum ${model.name}: String, Codable {\n${cases}\n}`;
}

function renderSwiftStruct(model: InterfaceModel): string {
  const fields = model.properties
    .map((property) => `  public let ${property.name}: ${property.type}${property.optional ? '?' : ''}`)
    .join('\n');
  return `public struct ${model.name}: Codable {\n${fields}\n}`;
}

function renderSwiftUnion(model: UnionAliasModel, interfaces: InterfaceModel[]): string {
  const members = model.members.map((memberName) => {
    const declaration = interfaces.find((entry) => entry.name === memberName);
    if (!declaration?.discriminator) {
      throw new Error(`Union ${model.name} contains ${memberName} without a string literal type discriminator.`);
    }
    return {
      caseName: toSwiftIdentifier(declaration.discriminator),
      discriminator: declaration.discriminator,
      name: memberName,
    };
  });

  const cases = members.map((member) => `  case ${member.caseName}(${member.name})`).join('\n');
  const decodeCases = members
    .map(
      (member) =>
        `    case ${JSON.stringify(member.discriminator)}:\n      self = .${member.caseName}(try ${member.name}(from: decoder))`,
    )
    .join('\n');
  const encodeCases = members
    .map((member) => `    case .${member.caseName}(let value):\n      try value.encode(to: encoder)`)
    .join('\n');

  return [
    `public enum ${model.name}: Codable {`,
    cases,
    '',
    '  private enum CodingKeys: String, CodingKey {',
    '    case type',
    '  }',
    '',
    '  public init(from decoder: Decoder) throws {',
    '    let container = try decoder.container(keyedBy: CodingKeys.self)',
    '    switch try container.decode(String.self, forKey: .type) {',
    decodeCases,
    '    default:',
    `      throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown ${model.name} frame type.")`,
    '    }',
    '  }',
    '',
    '  public func encode(to encoder: Encoder) throws {',
    '    switch self {',
    encodeCases,
    '    }',
    '  }',
    '}',
  ].join('\n');
}

function swiftJsonValue(): string {
  return [
    'public enum JSONValue: Codable {',
    '  case string(String)',
    '  case number(Double)',
    '  case bool(Bool)',
    '  case object([String: JSONValue])',
    '  case array([JSONValue])',
    '  case null',
    '',
    '  public init(from decoder: Decoder) throws {',
    '    let container = try decoder.singleValueContainer()',
    '    if container.decodeNil() {',
    '      self = .null',
    '    } else if let value = try? container.decode(Bool.self) {',
    '      self = .bool(value)',
    '    } else if let value = try? container.decode(Double.self) {',
    '      self = .number(value)',
    '    } else if let value = try? container.decode(String.self) {',
    '      self = .string(value)',
    '    } else if let value = try? container.decode([String: JSONValue].self) {',
    '      self = .object(value)',
    '    } else if let value = try? container.decode([JSONValue].self) {',
    '      self = .array(value)',
    '    } else {',
    '      throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value.")',
    '    }',
    '  }',
    '',
    '  public func encode(to encoder: Encoder) throws {',
    '    var container = encoder.singleValueContainer()',
    '    switch self {',
    '    case .string(let value):',
    '      try container.encode(value)',
    '    case .number(let value):',
    '      try container.encode(value)',
    '    case .bool(let value):',
    '      try container.encode(value)',
    '    case .object(let value):',
    '      try container.encode(value)',
    '    case .array(let value):',
    '      try container.encode(value)',
    '    case .null:',
    '      try container.encodeNil()',
    '    }',
    '  }',
    '}',
  ].join('\n');
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function toSwiftIdentifier(value: string): string {
  const normalized = value
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
  if (!normalized) {
    return 'value';
  }
  if (/^\d/.test(normalized)) {
    return `v${normalized}`;
  }
  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

void main();
