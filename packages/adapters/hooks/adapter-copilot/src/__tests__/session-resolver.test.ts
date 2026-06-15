import { describe, it, expect } from 'vitest';
import { resolveSyntheticSessionId } from '../session-resolver';

describe('resolveSyntheticSessionId', () => {
  it('should produce a copilot- prefixed ID', () => {
    const id = resolveSyntheticSessionId('/home/user/project');
    expect(id).toMatch(/^copilot-[0-9a-f]{16}$/);
  });

  it('should be deterministic for same input', () => {
    const id1 = resolveSyntheticSessionId('/home/user/project');
    const id2 = resolveSyntheticSessionId('/home/user/project');
    expect(id1).toBe(id2);
  });

  it('should produce different IDs for different paths', () => {
    const id1 = resolveSyntheticSessionId('/project-a');
    const id2 = resolveSyntheticSessionId('/project-b');
    expect(id1).not.toBe(id2);
  });

  it('should prefer workspace over cwd', () => {
    const withWorkspace = resolveSyntheticSessionId('/cwd', '/workspace');
    const withCwdOnly = resolveSyntheticSessionId('/cwd');
    const withWorkspaceOnly = resolveSyntheticSessionId(undefined, '/workspace');

    // workspace is used when provided, so workspace-based should match
    expect(withWorkspace).toBe(withWorkspaceOnly);
    // different from cwd-only
    expect(withWorkspace).not.toBe(withCwdOnly);
  });

  it('should normalize Windows paths', () => {
    const winPath = resolveSyntheticSessionId('C:\\Users\\dev\\project');
    const unixPath = resolveSyntheticSessionId('c:/Users/dev/project');
    expect(winPath).toBe(unixPath);
  });

  it('should handle trailing slashes', () => {
    const withSlash = resolveSyntheticSessionId('/project/');
    const withoutSlash = resolveSyntheticSessionId('/project');
    expect(withSlash).toBe(withoutSlash);
  });

  it('should produce a fallback ID when no paths are provided', () => {
    const id = resolveSyntheticSessionId();
    expect(id).toMatch(/^copilot-[0-9a-f]{16}$/);
  });

  it('should produce same fallback ID consistently', () => {
    const id1 = resolveSyntheticSessionId();
    const id2 = resolveSyntheticSessionId(undefined, undefined);
    expect(id1).toBe(id2);
  });
});
