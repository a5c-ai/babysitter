import { describe, it, expect } from 'vitest';
import type {
  AuthMethod,
  AuthState,
  AuthSetupGuidance,
  AuthSetupStep,
  AuthEnvVar,
} from '../src/auth-types.js';

/**
 * Type shape tests for auth-types.ts.
 *
 * Verifies that the type definitions accept valid data
 * and have the expected structure at runtime.
 */
describe('Auth Types', () => {
  // -- AuthMethod -------------------------------------------------------------

  describe('AuthMethod', () => {
    it('accepts all valid auth method strings', () => {
      const methods: AuthMethod[] = [
        'api_key',
        'oauth',
        'oauth_device',
        'browser_login',
        'token_file',
        'keychain',
        'github_token',
        'config_file',
        'none',
      ];
      expect(methods).toHaveLength(9);
    });
  });

  // -- AuthState --------------------------------------------------------------

  describe('AuthState', () => {
    it('accepts minimal auth state (status only)', () => {
      const state: AuthState = {
        status: 'unknown',
      };
      expect(state.status).toBe('unknown');
      expect(state.agent).toBeUndefined();
    });

    it('accepts full auth state with all fields', () => {
      const state: AuthState = {
        agent: 'claude',
        status: 'authenticated',
        method: 'api_key',
        identity: 'sk-ant-...abc',
        expiresAt: new Date('2026-01-01'),
        checkedAt: new Date(),
        details: 'Token verified via API',
      };
      expect(state.agent).toBe('claude');
      expect(state.method).toBe('api_key');
      expect(state.identity).toContain('sk-ant');
    });

    it('accepts all status values', () => {
      const statuses: AuthState['status'][] = [
        'authenticated',
        'unauthenticated',
        'expired',
        'unknown',
      ];
      for (const status of statuses) {
        const s: AuthState = { status };
        expect(s.status).toBe(status);
      }
    });
  });

  // -- AuthSetupStep ----------------------------------------------------------

  describe('AuthSetupStep', () => {
    it('accepts a step with all fields', () => {
      const step: AuthSetupStep = {
        step: 1,
        description: 'Visit the API console to create a key',
        command: 'open https://console.anthropic.com',
        url: 'https://console.anthropic.com',
      };
      expect(step.step).toBe(1);
      expect(step.description).toBeDefined();
    });

    it('accepts a minimal step', () => {
      const step: AuthSetupStep = {
        step: 2,
        description: 'Copy the key to clipboard',
      };
      expect(step.command).toBeUndefined();
      expect(step.url).toBeUndefined();
    });
  });

  // -- AuthEnvVar -------------------------------------------------------------

  describe('AuthEnvVar', () => {
    it('accepts a full env var descriptor', () => {
      const envVar: AuthEnvVar = {
        name: 'ANTHROPIC_API_KEY',
        description: 'Anthropic API key for Claude',
        required: true,
        exampleFormat: 'sk-ant-api03-...',
      };
      expect(envVar.name).toBe('ANTHROPIC_API_KEY');
      expect(envVar.required).toBe(true);
    });

    it('accepts minimal env var (no exampleFormat)', () => {
      const envVar: AuthEnvVar = {
        name: 'OPTIONAL_VAR',
        description: 'Optional configuration variable',
        required: false,
      };
      expect(envVar.exampleFormat).toBeUndefined();
    });
  });

  // -- AuthSetupGuidance ------------------------------------------------------

  describe('AuthSetupGuidance', () => {
    it('accepts minimal guidance (steps only)', () => {
      const guidance: AuthSetupGuidance = {
        steps: [],
      };
      expect(guidance.steps).toEqual([]);
    });

    it('accepts full guidance with all fields', () => {
      const guidance: AuthSetupGuidance = {
        agent: 'claude',
        providerName: 'Anthropic',
        steps: [
          { step: 1, description: 'Get API key', url: 'https://console.anthropic.com' },
        ],
        envVars: [
          { name: 'ANTHROPIC_API_KEY', description: 'API key', required: true },
        ],
        documentationUrls: ['https://docs.anthropic.com'],
        platformNotes: { win32: 'Use PowerShell to set env vars' },
        loginCommand: 'claude login',
        verifyCommand: 'claude whoami',
      };
      expect(guidance.providerName).toBe('Anthropic');
      expect(guidance.steps).toHaveLength(1);
      expect(guidance.loginCommand).toBe('claude login');
    });
  });
});
