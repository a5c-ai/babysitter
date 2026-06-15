/**
 * CompressionConfig — type definitions and defaults for the feature-toggle system.
 *
 * Priority (highest wins): env vars > project config > user config > defaults.
 */

export interface CompressionConfig {
  /** Master switch — when false, all layers are bypassed regardless of their individual settings. */
  enabled: boolean;
  layers: {
    userPromptHook: {
      enabled: boolean;
      engine: 'density-filter' | 'sentence-extractor';
      /** Minimum token count before compression is attempted. */
      threshold: number;
      /** Fraction of content to keep (0–1). */
      keepRatio: number;
    };
    commandOutputHook: {
      enabled: boolean;
      engine: 'command-compressor';
      /** Command names whose output should never be compressed. */
      excludeCommands: string[];
    };
    sdkContextHook: {
      enabled: boolean;
      engine: 'sentence-extractor';
      /** Target fraction to remove (0–1). E.g. 0.15 removes ~15%. */
      targetReduction: number;
      /** Minimum token count before compression is attempted. */
      minCompressionTokens: number;
      /** Per-task-kind overrides for targetReduction. */
      perTaskKind?: {
        agent?: number;
        skill?: number;
        breakpoint?: number;
      };
    };
    processLibraryCache: {
      enabled: boolean;
      engine: 'sentence-extractor';
      /** Target fraction to remove (0–1). */
      targetReduction: number;
      /** How many hours a compressed cache entry remains valid. */
      ttlHours: number;
    };
  };
}

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  enabled: true,
  layers: {
    userPromptHook: {
      enabled: true,
      engine: 'density-filter',
      threshold: 500,
      keepRatio: 0.78,
    },
    commandOutputHook: {
      enabled: true,
      engine: 'command-compressor',
      excludeCommands: ['node', 'python', 'ruby'],
    },
    sdkContextHook: {
      enabled: true,
      engine: 'sentence-extractor',
      targetReduction: 0.15,
      minCompressionTokens: 150,
      perTaskKind: {
        agent: 0.15,
        skill: 0.2,
        breakpoint: 0.1,
      },
    },
    processLibraryCache: {
      enabled: true,
      engine: 'sentence-extractor',
      targetReduction: 0.35,
      ttlHours: 24,
    },
  },
};
