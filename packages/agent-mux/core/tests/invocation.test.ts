import { describe, it, expect } from 'vitest';
import {
  HARNESS_IMAGE_CATALOG,
  lookupHarnessImage,
} from '../src/invocation.js';
import type {
  InvocationMode,
  LocalInvocation,
  DockerInvocation,
  SshInvocation,
  K8sInvocation,
} from '../src/invocation.js';

describe('InvocationMode types', () => {
  it('LocalInvocation has mode local', () => {
    const inv: LocalInvocation = { mode: 'local' };
    const generic: InvocationMode = inv;
    expect(generic.mode).toBe('local');
  });

  it('DockerInvocation has mode docker with optional fields', () => {
    const inv: DockerInvocation = {
      mode: 'docker',
      image: 'my-image:latest',
      volumes: ['/host:/container'],
      env: { FOO: 'bar' },
      workdir: '/workspace',
    };
    expect(inv.mode).toBe('docker');
    expect(inv.image).toBe('my-image:latest');
  });

  it('SshInvocation has mode ssh with host', () => {
    const inv: SshInvocation = {
      mode: 'ssh',
      host: 'user@remote.example.com',
      port: 2222,
      autoInstall: false,
    };
    expect(inv.mode).toBe('ssh');
    expect(inv.host).toBe('user@remote.example.com');
  });

  it('K8sInvocation has mode k8s with namespace', () => {
    const inv: K8sInvocation = {
      mode: 'k8s',
      namespace: 'agent-runs',
      image: 'my-image:v1',
      resources: { cpu: '2', memory: '4Gi' },
    };
    expect(inv.mode).toBe('k8s');
    expect(inv.namespace).toBe('agent-runs');
  });

  it('discriminant narrowing works', () => {
    const inv: InvocationMode = { mode: 'docker', image: 'test' };
    if (inv.mode === 'docker') {
      expect(inv.image).toBe('test');
    } else {
      expect.unreachable('Should have narrowed to docker');
    }
  });
});

describe('HARNESS_IMAGE_CATALOG', () => {
  it('contains entries for known harnesses', () => {
    expect(HARNESS_IMAGE_CATALOG.length).toBeGreaterThanOrEqual(4);
    const names = HARNESS_IMAGE_CATALOG.map(e => e.harness);
    expect(names).toContain('claude-code');
    expect(names).toContain('codex');
    expect(names).toContain('cursor');
    expect(names).toContain('github-copilot');
  });

  it('all entries have required fields', () => {
    for (const entry of HARNESS_IMAGE_CATALOG) {
      expect(entry.harness).toBeTruthy();
      expect(entry.image).toBeTruthy();
      expect(typeof entry.preinstalled).toBe('boolean');
    }
  });
});

describe('lookupHarnessImage', () => {
  it('finds claude-code', () => {
    const entry = lookupHarnessImage('claude-code');
    expect(entry).toBeDefined();
    expect(entry!.harness).toBe('claude-code');
    expect(entry!.preinstalled).toBe(true);
  });

  it('finds codex', () => {
    const entry = lookupHarnessImage('codex');
    expect(entry).toBeDefined();
  });

  it('resolves built-in agent aliases to harness images', () => {
    const entry = lookupHarnessImage('claude');
    expect(entry).toBeDefined();
    expect(entry!.harness).toBe('claude-code');
  });

  it('returns undefined for unknown harness', () => {
    const entry = lookupHarnessImage('nonexistent');
    expect(entry).toBeUndefined();
  });
});
