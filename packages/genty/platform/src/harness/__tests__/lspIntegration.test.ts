import { describe, it, expect } from 'vitest';
import {
  resolveSymbolsForPrompt,
  formatSymbolContext,
  type LspSymbolInfo,
  type LspServerConfig,
  type LspRouteHint,
} from '../lspIntegration';

describe('lspIntegration', () => {
  const symbols: LspSymbolInfo[] = [
    { name: 'parseConfig', kind: 'function', location: { file: 'config.ts', line: 10, col: 0 } },
    { name: 'AppRouter', kind: 'class', location: { file: 'router.ts', line: 5, col: 0 } },
    { name: 'MAX_RETRIES', kind: 'variable', location: { file: 'constants.ts', line: 1, col: 6 } },
    { name: 'RouteConfig', kind: 'type', location: { file: 'types.ts', line: 20, col: 0 } },
  ];

  // -------------------------------------------------------------------------
  // resolveSymbolsForPrompt
  // -------------------------------------------------------------------------

  describe('resolveSymbolsForPrompt', () => {
    it('matches symbol names in the prompt', () => {
      const result = resolveSymbolsForPrompt(symbols, 'How does parseConfig work?');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('parseConfig');
    });

    it('matches multiple symbols', () => {
      const result = resolveSymbolsForPrompt(symbols, 'parseConfig and AppRouter');
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toEqual(['parseConfig', 'AppRouter']);
    });

    it('is case-insensitive', () => {
      const result = resolveSymbolsForPrompt(symbols, 'PARSECONFIG usage');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('parseConfig');
    });

    it('returns empty for no matches', () => {
      const result = resolveSymbolsForPrompt(symbols, 'something unrelated');
      expect(result).toHaveLength(0);
    });

    it('returns empty for blank prompt', () => {
      const result = resolveSymbolsForPrompt(symbols, '   ');
      expect(result).toHaveLength(0);
    });

    it('does not match partial names without word boundary', () => {
      const result = resolveSymbolsForPrompt(symbols, 'unparseConfigExtra');
      // 'parseConfig' is embedded but not at word boundary
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // formatSymbolContext
  // -------------------------------------------------------------------------

  describe('formatSymbolContext', () => {
    it('formats symbols as markdown', () => {
      const result = formatSymbolContext(symbols.slice(0, 2));
      expect(result).toContain('## Relevant Symbols');
      expect(result).toContain('function `parseConfig`');
      expect(result).toContain('config.ts:10:0');
      expect(result).toContain('class `AppRouter`');
    });

    it('returns empty string for no symbols', () => {
      expect(formatSymbolContext([])).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Type checks (compile-time, but exercised at runtime)
  // -------------------------------------------------------------------------

  describe('types', () => {
    it('LspServerConfig is well-shaped', () => {
      const config: LspServerConfig = {
        languageId: 'typescript',
        command: 'typescript-language-server',
        args: ['--stdio'],
        rootUri: 'file:///workspace',
      };
      expect(config.languageId).toBe('typescript');
      expect(config.args).toHaveLength(1);
    });

    it('LspRouteHint is well-shaped', () => {
      const hint: LspRouteHint = {
        symbol: symbols[0],
        relevantFiles: ['config.ts', 'utils.ts'],
        suggestedModel: 'opus',
      };
      expect(hint.relevantFiles).toHaveLength(2);
      expect(hint.suggestedModel).toBe('opus');
    });
  });
});
