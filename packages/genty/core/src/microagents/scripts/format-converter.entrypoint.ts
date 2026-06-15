#!/usr/bin/env node

/**
 * Entrypoint script for the format-converter microagent.
 *
 * Performs pure-logic format conversion (JSON <-> YAML <-> TOML <-> CSV <-> XML)
 * without delegating to the babysitter process. Reads JSON input from stdin,
 * writes JSON output to stdout.
 */

import * as fs from 'node:fs';

interface ConvertInput {
  source: string;
  sourceFormat: 'json' | 'yaml' | 'toml' | 'csv' | 'xml';
  targetFormat: 'json' | 'yaml' | 'toml' | 'csv' | 'xml';
}

interface ConvertOutput {
  result: string;
  targetFormat: string;
}

function main(): void {
  const raw = fs.readFileSync(0, 'utf-8');
  const input: ConvertInput = JSON.parse(raw);

  // Parse source into an intermediate JS value
  const parsed = parseSource(input.source, input.sourceFormat);

  // Serialize to the target format
  const result = serializeTarget(parsed, input.targetFormat);

  const output: ConvertOutput = { result, targetFormat: input.targetFormat };
  process.stdout.write(JSON.stringify(output));
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseSource(source: string, format: string): unknown {
  switch (format) {
    case 'json':
      return JSON.parse(source);

    case 'yaml':
      return parseSimpleYaml(source);

    case 'toml':
      return parseSimpleToml(source);

    case 'csv':
      return parseCsv(source);

    case 'xml':
      return parseSimpleXml(source);

    default:
      throw new Error(`Unsupported source format: ${format}`);
  }
}

/**
 * Minimal YAML parser supporting flat key: value maps.
 * Handles strings, numbers, booleans, null, and simple arrays.
 */
function parseSimpleYaml(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = source.split('\n');
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Array item under current key
    if (trimmed.startsWith('- ') && currentKey !== null) {
      if (!currentArray) {
        currentArray = [];
        result[currentKey] = currentArray;
      }
      currentArray.push(parseYamlValue(trimmed.slice(2).trim()));
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    currentKey = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();
    currentArray = null;

    if (rawValue === '') {
      // Could be start of array or nested object; set null for now
      result[currentKey] = null;
    } else {
      result[currentKey] = parseYamlValue(rawValue);
    }
  }

  return result;
}

function parseYamlValue(raw: string): unknown {
  if (raw === 'null' || raw === '~') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);
  // Strip surrounding quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

/**
 * Minimal TOML parser supporting flat key = value pairs.
 */
function parseSimpleToml(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1).trim();
    result[key] = parseTomlValue(rawValue);
  }

  return result;
}

function parseTomlValue(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  return raw;
}

/**
 * Parse CSV into an array of objects using the first row as headers.
 */
function parseCsv(source: string): Record<string, string>[] {
  const lines = source.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? '';
    }
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Minimal XML parser for flat element structures.
 */
function parseSimpleXml(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const tagRegex = /<(\w+)>(.*?)<\/\1>/gs;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(source)) !== null) {
    const [, tag, content] = match;
    // Check if content contains nested tags
    if (/<\w+>/.test(content)) {
      result[tag] = parseSimpleXml(content);
    } else {
      result[tag] = content;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Serializers
// ---------------------------------------------------------------------------

function serializeTarget(data: unknown, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);

    case 'yaml':
      return serializeYaml(data);

    case 'toml':
      return serializeToml(data as Record<string, unknown>);

    case 'csv':
      return serializeCsv(data as Record<string, unknown>[]);

    case 'xml':
      return serializeXml(data, 'root');

    default:
      throw new Error(`Unsupported target format: ${format}`);
  }
}

function serializeYaml(data: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent);

  if (data === null || data === undefined) return `${prefix}null\n`;
  if (typeof data === 'string') return `${prefix}${yamlEscapeString(data)}\n`;
  if (typeof data === 'number' || typeof data === 'boolean') return `${prefix}${data}\n`;

  if (Array.isArray(data)) {
    if (data.length === 0) return `${prefix}[]\n`;
    let out = '';
    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        out += `${prefix}- ${serializeYaml(item, indent + 1).trimStart()}`;
      } else {
        out += `${prefix}- ${String(item)}\n`;
      }
    }
    return out;
  }

  if (typeof data === 'object') {
    let out = '';
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        out += `${prefix}${key}:\n${serializeYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        out += `${prefix}${key}:\n${serializeYaml(value, indent + 1)}`;
      } else {
        out += `${prefix}${key}: ${String(value)}\n`;
      }
    }
    return out;
  }

  return `${prefix}${String(data)}\n`;
}

function yamlEscapeString(s: string): string {
  if (/[:{}\[\],&*#?|\-<>=!%@`]/.test(s) || s.includes('\n')) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function serializeToml(data: Record<string, unknown>): string {
  let out = '';
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      out += `${key} = "${value}"\n`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out += `${key} = ${value}\n`;
    } else if (typeof value === 'object') {
      out += `${key} = ${JSON.stringify(value)}\n`;
    }
  }
  return out;
}

function serializeCsv(data: Record<string, unknown>[]): string {
  if (!Array.isArray(data) || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const lines = [headers.join(',')];
  for (const row of data) {
    lines.push(headers.map((h) => csvEscape(String(row[h] ?? ''))).join(','));
  }
  return lines.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeXml(data: unknown, rootTag: string): string {
  if (data === null || data === undefined) return `<${rootTag}/>`;
  if (typeof data !== 'object') return `<${rootTag}>${escapeXml(String(data))}</${rootTag}>`;

  if (Array.isArray(data)) {
    return data.map((item, i) => serializeXml(item, 'item')).join('\n');
  }

  let inner = '';
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    inner += `  ${serializeXml(value, key)}\n`;
  }
  return `<${rootTag}>\n${inner}</${rootTag}>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main();
