import { describe, it, expect } from 'vitest';
import type {
  AgentConfig,
  AgentConfigSchema,
  ConfigField,
  ValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
} from '../src/config-types.js';

/**
 * Type shape tests for config-types.ts.
 *
 * Verifies that the type definitions accept valid data
 * and have the expected structure at runtime.
 */
describe('Config Types', () => {
  // -- AgentConfig ------------------------------------------------------------

  describe('AgentConfig', () => {
    it('accepts a minimal config', () => {
      const cfg: AgentConfig = {};
      expect(cfg).toBeDefined();
    });

    it('accepts a full config with all fields', () => {
      const cfg: AgentConfig = {
        agent: 'claude',
        source: 'merged',
        filePaths: ['/home/user/.claude/config.json'],
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        temperature: 0.7,
        maxTokens: 4096,
        allowedCommands: ['git', 'npm'],
        deniedCommands: ['rm -rf'],
        approvalMode: 'prompt',
        mcpServers: [{ name: 'my-server', transport: 'stdio', command: 'node' }],
        skills: ['code-review'],
        agentsDoc: '/home/user/.claude/agents.md',
        env: { NODE_ENV: 'development' },
        native: { theme: 'dark' },
      };
      expect(cfg.agent).toBe('claude');
      expect(cfg.source).toBe('merged');
      expect(cfg.mcpServers).toHaveLength(1);
    });

    it('supports index signature for dynamic access', () => {
      const cfg: AgentConfig = {
        agent: 'codex',
        customField: 'custom-value',
      };
      expect(cfg['customField']).toBe('custom-value');
    });
  });

  // -- ConfigField ------------------------------------------------------------

  describe('ConfigField', () => {
    it('accepts a full field descriptor', () => {
      const field: ConfigField = {
        path: 'model',
        label: 'Default Model',
        description: 'The default model ID to use',
        type: 'string',
        required: false,
        defaultValue: 'claude-sonnet-4-20250514',
        normalized: true,
        nativeKeyPath: 'model',
        scope: 'both',
      };
      expect(field.path).toBe('model');
      expect(field.type).toBe('string');
      expect(field.scope).toBe('both');
    });

    it('accepts enum type with enumValues', () => {
      const field: ConfigField = {
        path: 'approvalMode',
        label: 'Approval Mode',
        description: 'How to handle tool call approvals',
        type: 'enum',
        required: false,
        enumValues: ['yolo', 'prompt', 'deny'],
        normalized: true,
        nativeKeyPath: 'approval_mode',
        scope: 'both',
      };
      expect(field.enumValues).toEqual(['yolo', 'prompt', 'deny']);
    });

    it('accepts numeric type with min/max', () => {
      const field: ConfigField = {
        path: 'temperature',
        label: 'Temperature',
        description: 'Sampling temperature',
        type: 'number',
        required: false,
        min: 0,
        max: 2,
        normalized: true,
        nativeKeyPath: 'temperature',
        scope: 'global',
      };
      expect(field.min).toBe(0);
      expect(field.max).toBe(2);
    });
  });

  // -- AgentConfigSchema ------------------------------------------------------

  describe('AgentConfigSchema', () => {
    it('accepts a minimal schema', () => {
      const schema: AgentConfigSchema = {
        fields: [],
      };
      expect(schema.fields).toEqual([]);
    });

    it('accepts a full schema with all fields', () => {
      const schema: AgentConfigSchema = {
        agent: 'claude',
        version: 1,
        fields: [
          {
            path: 'model',
            label: 'Model',
            description: 'Default model',
            type: 'string',
            required: false,
            normalized: true,
            nativeKeyPath: 'model',
            scope: 'both',
          },
        ],
        configFilePaths: ['/home/user/.claude/settings.json'],
        projectConfigFilePaths: ['.claude/settings.json'],
        configFormat: 'json',
        supportsProjectConfig: true,
      };
      expect(schema.agent).toBe('claude');
      expect(schema.fields).toHaveLength(1);
      expect(schema.configFormat).toBe('json');
    });
  });

  // -- ValidationResult -------------------------------------------------------

  describe('ValidationResult', () => {
    it('accepts a valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };
      expect(result.valid).toBe(true);
    });

    it('accepts errors and warnings', () => {
      const err: ConfigValidationError = {
        field: 'temperature',
        code: 'out_of_range',
        message: 'Temperature must be between 0 and 2',
        value: 5,
        expected: '0-2',
      };
      const warn: ConfigValidationWarning = {
        field: 'oldField',
        code: 'deprecated',
        message: 'This field is deprecated',
        suggestion: 'Use newField instead',
      };
      const result: ValidationResult = {
        valid: false,
        errors: [err],
        warnings: [warn],
      };
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe('out_of_range');
      expect(result.warnings[0]!.code).toBe('deprecated');
    });
  });

  // -- ConfigValidationError codes --------------------------------------------

  describe('ConfigValidationError codes', () => {
    it('accepts all error codes', () => {
      const codes: ConfigValidationError['code'][] = [
        'required',
        'type_mismatch',
        'out_of_range',
        'invalid_enum',
        'pattern_mismatch',
        'unknown_field',
        'invalid_format',
      ];
      expect(codes).toHaveLength(7);
    });
  });
});
