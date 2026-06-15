import type { NormalizedTriggerEvent, TriggerEvaluation, TriggerQuery } from './types.js';

function list(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function matchesAny(value: string | undefined, expected: string[]): boolean {
  if (expected.length === 0) return true;
  if (!value) return false;
  return expected.some((candidate) => value === candidate || value.includes(candidate));
}

function textIncludes(haystack: string, needles: string[]): boolean {
  if (needles.length === 0) return true;
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

function globToRegExp(glob: string): RegExp {
  let pattern = '';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === '*' && next === '*') {
      pattern += '.*';
      index += 1;
    } else if (char === '*') {
      pattern += '[^/]*';
    } else if (char === '?') {
      pattern += '[^/]';
    } else {
      pattern += char!.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`^${pattern}$`);
}

function matchesGlob(path: string, glob: string): boolean {
  return globToRegExp(glob.replace(/\\/g, '/')).test(path.replace(/\\/g, '/'));
}

function expressionValue(event: NormalizedTriggerEvent, field: string): string | string[] | undefined {
  if (field === 'event' || field === 'eventName') return event.eventName;
  if (field === 'action') return event.action;
  if (field === 'backend') return event.backend;
  if (field === 'text') return event.text;
  if (field === 'diff') return event.changes.map((entry) => entry.patch ?? '').join('\n');
  if (field === 'path' || field === 'paths' || field === 'files') return event.changes.map((entry) => entry.path);
  if (field === 'branch' || field === 'ref') return event.ref ?? event.sourceBranch ?? event.targetBranch;
  if (field === 'label' || field === 'labels') return event.labels;
  return undefined;
}

function evaluateExpression(event: NormalizedTriggerEvent, expression: string): boolean {
  const clauses = expression.split(/\s+&&\s+/).map((clause) => clause.trim()).filter(Boolean);
  return clauses.every((clause) => {
    const contains = clause.match(/^([a-zA-Z][\w.-]*)\s*~\s*['\"](.+)['\"]$/);
    if (contains) {
      const value = expressionValue(event, contains[1]!);
      const haystack = Array.isArray(value) ? value.join('\n') : value ?? '';
      return textIncludes(haystack, [contains[2]!]);
    }

    const equals = clause.match(/^([a-zA-Z][\w.-]*)\s*==\s*['\"](.+)['\"]$/);
    if (equals) {
      const value = expressionValue(event, equals[1]!);
      return Array.isArray(value) ? value.includes(equals[2]!) : value === equals[2];
    }

    throw new Error(`Unsupported trigger expression clause: ${clause}`);
  });
}

export function parseQuery(input: string | TriggerQuery | undefined): TriggerQuery {
  if (!input) return {};
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as TriggerQuery;

  const query: TriggerQuery = {};
  for (const segment of trimmed.split(/\s+/)) {
    const separator = segment.indexOf(':');
    if (separator === -1) {
      query.text = [...list(query.text), segment];
      continue;
    }
    const key = segment.slice(0, separator);
    const value = segment.slice(separator + 1);
    if (key === 'event') query.event = [...list(query.event), value];
    else if (key === 'action') query.action = [...list(query.action), value];
    else if (key === 'text' || key === 'contains') query.text = [...list(query.text), value];
    else if (key === 'diff') query.diff = [...list(query.diff), value];
    else if (key === 'path' || key === 'file') query.paths = [...list(query.paths), value];
    else if (key === 'branch') query.branch = [...list(query.branch), value];
    else if (key === 'label') query.labels = [...list(query.labels), value];
  }
  return query;
}

export function evaluateTrigger(event: NormalizedTriggerEvent, queryInput: string | TriggerQuery | undefined): TriggerEvaluation {
  const query = parseQuery(queryInput);
  const reasons: string[] = [];

  if (!matchesAny(event.eventName, list(query.event))) return { matched: false, reasons: [`event ${event.eventName} did not match`], event };
  if (!matchesAny(event.action, list(query.action))) return { matched: false, reasons: [`action ${event.action ?? ''} did not match`], event };
  if (!textIncludes(event.text, list(query.text))) return { matched: false, reasons: ['text did not match'], event };

  const diffText = event.changes.map((entry) => entry.patch ?? '').join('\n');
  if (!textIncludes(diffText, list(query.diff))) return { matched: false, reasons: ['diff did not match'], event };

  const pathGlobs = [...list(query.paths), ...list(query.files)];
  if (pathGlobs.length > 0 && !event.changes.some((entry) => pathGlobs.some((glob) => matchesGlob(entry.path, glob)))) {
    return { matched: false, reasons: ['changed files did not match'], event };
  }

  if (!matchesAny(event.ref ?? event.sourceBranch ?? event.targetBranch, list(query.branch))) {
    return { matched: false, reasons: ['branch did not match'], event };
  }

  const labelFilters = list(query.labels);
  if (labelFilters.length > 0 && !labelFilters.every((label) => event.labels.includes(label))) {
    return { matched: false, reasons: ['labels did not match'], event };
  }

  if (query.expression && !evaluateExpression(event, query.expression)) {
    return { matched: false, reasons: ['expression did not match'], event };
  }

  reasons.push('trigger matched');
  return { matched: true, reasons, event };
}

export { matchesGlob };
