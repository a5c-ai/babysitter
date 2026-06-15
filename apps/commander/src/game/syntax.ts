/**
 * Hand-rolled regex tokenizer for the web IDE highlight layer (SPEC-V4
 * §V4-11): ts/tsx/js/json/css/md → token spans with classes tok-keyword /
 * tok-string / tok-comment / tok-number / tok-type. No dependencies; pure;
 * line-oriented (block comments are recognized within a single line — the
 * deterministic mock contents never span them across lines).
 */

export type SyntaxLang = 'ts' | 'js' | 'json' | 'css' | 'md' | 'plain';

export type TokenClass = 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'plain';

export interface SyntaxToken {
  text: string;
  cls: TokenClass;
}

/** File extension → tokenizer language. */
export function languageOf(path: string): SyntaxLang {
  const dot = path.lastIndexOf('.');
  const ext = dot >= 0 ? path.slice(dot + 1).toLowerCase() : '';
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'ts';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'js';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'md':
    case 'markdown':
      return 'md';
    default:
      return 'plain';
  }
}

const TS_KEYWORDS =
  'const|let|var|function|return|if|else|for|while|do|import|export|from|new|class|extends|implements|interface|type|enum|async|await|switch|case|break|continue|typeof|instanceof|in|of|this|null|undefined|true|false|throw|try|catch|finally|readonly|public|private|protected|static|void|never|unknown|number|string|boolean|default|as|satisfies|keyof|yield|delete|get|set';

/**
 * One alternation per language; capture-group index → token class. Groups:
 * comment, string, number, keyword, type (a missing class is skipped).
 */
interface LangSpec {
  re: RegExp;
  classes: TokenClass[];
}

const SPECS: Record<Exclude<SyntaxLang, 'plain'>, LangSpec> = {
  ts: {
    re: new RegExp(
      [
        String.raw`(\/\/.*$|\/\*[\s\S]*?\*\/)`, // comment
        String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|` + '`(?:[^`\\\\]|\\\\.)*`)', // string
        String.raw`(\b\d(?:[\d_]*\.?[\d_]*)\b)`, // number
        String.raw`(\b(?:${TS_KEYWORDS})\b)`, // keyword
        String.raw`(\b[A-Z][A-Za-z0-9_]*\b)`, // type (PascalCase identifier)
      ].join('|'),
      'gm',
    ),
    classes: ['comment', 'string', 'number', 'keyword', 'type'],
  },
  js: {
    re: new RegExp(
      [
        String.raw`(\/\/.*$|\/\*[\s\S]*?\*\/)`,
        String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|` + '`(?:[^`\\\\]|\\\\.)*`)',
        String.raw`(\b\d(?:[\d_]*\.?[\d_]*)\b)`,
        String.raw`(\b(?:${TS_KEYWORDS})\b)`,
        String.raw`(\b[A-Z][A-Za-z0-9_]*\b)`,
      ].join('|'),
      'gm',
    ),
    classes: ['comment', 'string', 'number', 'keyword', 'type'],
  },
  json: {
    re: new RegExp(
      [
        String.raw`("(?:[^"\\]|\\.)*"(?=\s*:))`, // key → type tint
        String.raw`("(?:[^"\\]|\\.)*")`, // string value
        String.raw`(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)`, // number
        String.raw`(\b(?:true|false|null)\b)`, // keyword
      ].join('|'),
      'gm',
    ),
    classes: ['type', 'string', 'number', 'keyword'],
  },
  css: {
    re: new RegExp(
      [
        String.raw`(\/\*[\s\S]*?\*\/)`, // comment
        String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")`, // string
        String.raw`(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)`, // number
        String.raw`(@[a-z-]+|\b[a-z-]+(?=\s*:))`, // at-rule / property → keyword
        String.raw`(\.[A-Za-z_-][\w-]*|::?[a-z-]+)`, // selector / pseudo → type
      ].join('|'),
      'gm',
    ),
    classes: ['comment', 'string', 'number', 'keyword', 'type'],
  },
  md: {
    re: new RegExp(
      [
        String.raw`(^#{1,6}\s.*$)`, // heading → keyword
        String.raw`(` + '`[^`]*`' + String.raw`)`, // code span → string
        String.raw`(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)`, // emphasis → type
        String.raw`(^\s*[-*+]\s|\b\d+\.\s)`, // list bullets → number
      ].join('|'),
      'gm',
    ),
    classes: ['keyword', 'string', 'type', 'number'],
  },
};

/** Tokenize one line of source for `lang` (plain → a single plain token). */
export function tokenizeLine(line: string, lang: SyntaxLang): SyntaxToken[] {
  if (line.length === 0) return [];
  if (lang === 'plain') return [{ text: line, cls: 'plain' }];
  const spec = SPECS[lang];
  const tokens: SyntaxToken[] = [];
  let last = 0;
  spec.re.lastIndex = 0;
  for (;;) {
    const m = spec.re.exec(line);
    if (m === null) break;
    if (m.index > last) tokens.push({ text: line.slice(last, m.index), cls: 'plain' });
    let cls: TokenClass = 'plain';
    for (let g = 0; g < spec.classes.length; g += 1) {
      if (m[g + 1] !== undefined) {
        cls = spec.classes[g]!;
        break;
      }
    }
    tokens.push({ text: m[0], cls });
    last = m.index + m[0].length;
    if (m[0].length === 0) spec.re.lastIndex += 1; // safety against zero-width loops
  }
  if (last < line.length) tokens.push({ text: line.slice(last), cls: 'plain' });
  return tokens;
}

/** Tokenize a whole buffer (split on '\n'); index = line number. */
export function tokenize(source: string, lang: SyntaxLang): SyntaxToken[][] {
  return source.split('\n').map((line) => tokenizeLine(line, lang));
}
