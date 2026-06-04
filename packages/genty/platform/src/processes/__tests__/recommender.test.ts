import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessRecommender } from '../recommender';
import type { ProcessDescriptor, RecommendationCriteria } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProcess(
  overrides: Partial<ProcessDescriptor> & Pick<ProcessDescriptor, 'id' | 'name'>,
): ProcessDescriptor {
  return {
    description: `${overrides.name} process description`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ProcessRecommender
// ---------------------------------------------------------------------------

describe('ProcessRecommender', () => {
  let recommender: ProcessRecommender;

  beforeEach(() => {
    recommender = new ProcessRecommender();
  });

  it('register + recommend returns results', () => {
    recommender.register(
      makeProcess({
        id: 'dev/code-review',
        name: 'Code Review',
        description: 'automated code review process',
        category: 'dev',
      }),
    );

    const results = recommender.recommend({ taskDescription: 'code review' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].process.id).toBe('dev/code-review');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('registerBatch adds multiple descriptors', () => {
    recommender.registerBatch([
      makeProcess({ id: 'a', name: 'Alpha' }),
      makeProcess({ id: 'b', name: 'Beta' }),
      makeProcess({ id: 'c', name: 'Gamma' }),
    ]);

    expect(recommender.size).toBe(3);
  });

  it('recommend keyword matching scores higher for relevant processes', () => {
    recommender.register(
      makeProcess({
        id: 'sec/audit',
        name: 'Security Audit',
        description: 'audit security vulnerabilities in codebase',
        tasks: ['scan', 'report'],
      }),
    );
    recommender.register(
      makeProcess({
        id: 'dev/build',
        name: 'Build Pipeline',
        description: 'compile and bundle source code',
        tasks: ['compile', 'bundle'],
      }),
    );

    const results = recommender.recommend({
      taskDescription: 'security audit vulnerabilities',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].process.id).toBe('sec/audit');
  });

  it('category filter in list()', () => {
    recommender.registerBatch([
      makeProcess({ id: 'dev/lint', name: 'Lint', category: 'dev' }),
      makeProcess({ id: 'ops/deploy', name: 'Deploy', category: 'ops' }),
      makeProcess({ id: 'dev/test', name: 'Test', category: 'dev' }),
    ]);

    const devProcesses = recommender.list({ category: 'dev' });
    expect(devProcesses).toHaveLength(2);
    expect(devProcesses.every((p) => p.category === 'dev')).toBe(true);
  });

  it('list without filter returns all', () => {
    recommender.registerBatch([
      makeProcess({ id: 'a', name: 'Alpha' }),
      makeProcess({ id: 'b', name: 'Beta' }),
    ]);

    expect(recommender.list()).toHaveLength(2);
  });

  it('getById returns correct process', () => {
    recommender.register(
      makeProcess({ id: 'ops/monitor', name: 'Monitoring', description: 'monitoring process' }),
    );

    const result = recommender.getById('ops/monitor');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Monitoring');
  });

  it('getById returns undefined for unknown id', () => {
    const result = recommender.getById('nonexistent');
    expect(result).toBeUndefined();
  });

  it('maxResults limits output', () => {
    recommender.registerBatch([
      makeProcess({ id: 'a', name: 'build Alpha', description: 'build alpha project' }),
      makeProcess({ id: 'b', name: 'build Beta', description: 'build beta project' }),
      makeProcess({ id: 'c', name: 'build Gamma', description: 'build gamma project' }),
      makeProcess({ id: 'd', name: 'build Delta', description: 'build delta project' }),
    ]);

    const results = recommender.recommend({
      taskDescription: 'build project',
      maxResults: 2,
    });

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('empty registry returns empty results', () => {
    const results = recommender.recommend({ taskDescription: 'anything' });
    expect(results).toEqual([]);
  });

  it('domain bonus increases score for matching domain', () => {
    recommender.registerBatch([
      makeProcess({
        id: 'fe/build',
        name: 'Frontend Build',
        description: 'build frontend assets',
        domain: 'frontend',
      }),
      makeProcess({
        id: 'be/build',
        name: 'Backend Build',
        description: 'build backend assets',
        domain: 'backend',
      }),
    ]);

    const results = recommender.recommend({
      taskDescription: 'build assets',
      domain: 'frontend',
    });

    expect(results.length).toBe(2);
    expect(results[0].process.id).toBe('fe/build');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
