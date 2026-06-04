import { describe, it, expect, beforeEach } from 'vitest';
import { SkillRouter } from '../router';
import { SkillChainBuilder } from '../chain';
import type { SkillDescriptor, SkillMatchCriteria } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSkill(overrides: Partial<SkillDescriptor> & Pick<SkillDescriptor, 'name'>): SkillDescriptor {
  return {
    description: `${overrides.name} skill description`,
    source: 'local',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// SkillRouter
// ---------------------------------------------------------------------------

describe('SkillRouter', () => {
  let router: SkillRouter;

  beforeEach(() => {
    router = new SkillRouter();
  });

  it('register + match returns scored results sorted by descending score', () => {
    router.register(
      makeSkill({
        name: 'code-review',
        description: 'review code changes for quality',
        capabilities: ['review', 'lint'],
        triggers: ['review code'],
      }),
    );
    router.register(
      makeSkill({
        name: 'deploy',
        description: 'deploy application to production',
        capabilities: ['deploy', 'release'],
        triggers: ['deploy app'],
      }),
    );

    const results = router.match({ taskType: 'review code changes' });
    expect(results.length).toBeGreaterThan(0);

    // Verify descending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }

    // The review skill should rank highest for a "review" query
    expect(results[0].skill.name).toBe('code-review');
  });

  it('select returns the best match', () => {
    router.register(
      makeSkill({
        name: 'test-runner',
        description: 'run tests and report results',
        triggers: ['run tests'],
      }),
    );
    router.register(
      makeSkill({
        name: 'linter',
        description: 'lint code for style issues',
        triggers: ['lint code'],
      }),
    );

    const result = router.select({ taskType: 'run tests' });
    expect(result).toBeDefined();
    expect(result!.skill.name).toBe('test-runner');
  });

  it('select returns undefined when nothing matches', () => {
    router.register(
      makeSkill({
        name: 'deploy',
        description: 'deploy application',
        triggers: ['deploy app'],
      }),
    );

    const result = router.select({ taskType: 'zzz-unrelated-gibberish-xyz' });
    expect(result).toBeUndefined();
  });

  it('match with domain filter boosts domain matches', () => {
    router.register(
      makeSkill({
        name: 'frontend-build',
        description: 'build frontend assets',
        domain: 'frontend',
      }),
    );
    router.register(
      makeSkill({
        name: 'backend-build',
        description: 'build backend assets',
        domain: 'backend',
      }),
    );

    const results = router.match({
      taskType: 'build assets',
      domain: 'frontend',
    });

    // Both match on keywords, but frontend gets domain bonus
    expect(results.length).toBe(2);
    expect(results[0].skill.name).toBe('frontend-build');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('match with capabilities filter boosts capability matches', () => {
    router.register(
      makeSkill({
        name: 'full-reviewer',
        description: 'comprehensive code review',
        capabilities: ['security-audit', 'performance-check', 'style-check'],
      }),
    );
    router.register(
      makeSkill({
        name: 'basic-reviewer',
        description: 'basic code review',
        capabilities: ['style-check'],
      }),
    );

    const results = router.match({
      taskType: 'code review',
      capabilities: ['security-audit', 'performance-check'],
    });

    // full-reviewer has 2 capability matches; basic-reviewer has 0
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].skill.name).toBe('full-reviewer');
  });

  it('empty registry returns empty results', () => {
    const results = router.match({ taskType: 'anything' });
    expect(results).toEqual([]);
  });

  it('register replaces existing entry with same name', () => {
    router.register(makeSkill({ name: 'alpha', description: 'version one' }));
    router.register(makeSkill({ name: 'alpha', description: 'version two' }));

    expect(router.size).toBe(1);
    expect(router.get('alpha')!.description).toBe('version two');
  });

  it('unregister removes a skill by name', () => {
    router.register(makeSkill({ name: 'removable', description: 'will be removed' }));
    expect(router.size).toBe(1);

    const removed = router.unregister('removable');
    expect(removed).toBe(true);
    expect(router.size).toBe(0);
  });

  it('unregister returns false for non-existent skill', () => {
    expect(router.unregister('ghost')).toBe(false);
  });

  it('trigger pattern match adds bonus when full trigger phrase appears in query', () => {
    router.register(
      makeSkill({
        name: 'scaffold',
        description: 'scaffold a new project',
        triggers: ['create project'],
      }),
    );

    const withTrigger = router.match({ taskType: 'create project now' });
    const withoutTrigger = router.match({ taskType: 'scaffold something' });

    // The trigger-matching query should score higher
    expect(withTrigger.length).toBeGreaterThan(0);
    expect(withoutTrigger.length).toBeGreaterThan(0);
    expect(withTrigger[0].score).toBeGreaterThan(withoutTrigger[0].score);
  });

  it('match excludes skills that score 0', () => {
    router.register(
      makeSkill({
        name: 'niche-tool',
        description: 'very specific niche tool for quantum computing simulations',
      }),
    );

    const results = router.match({ taskType: 'zzz-unmatched-xyz' });
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SkillChainBuilder
// ---------------------------------------------------------------------------

describe('SkillChainBuilder', () => {
  it('addStep + build returns ordered chain', () => {
    const builder = new SkillChainBuilder();
    builder
      .addStep({ skillName: 'lint' })
      .addStep({ skillName: 'test' })
      .addStep({ skillName: 'deploy', dependsOn: ['lint', 'test'] })
      .setDescription('CI pipeline');

    const chain = builder.build();
    expect(chain.description).toBe('CI pipeline');
    expect(chain.steps).toHaveLength(3);

    // Deploy must come after lint and test
    const deployIdx = chain.steps.findIndex((s) => s.skillName === 'deploy');
    const lintIdx = chain.steps.findIndex((s) => s.skillName === 'lint');
    const testIdx = chain.steps.findIndex((s) => s.skillName === 'test');
    expect(deployIdx).toBeGreaterThan(lintIdx);
    expect(deployIdx).toBeGreaterThan(testIdx);
  });

  it('validate succeeds when all skills are registered', () => {
    const router = new SkillRouter();
    router.register(makeSkill({ name: 'lint' }));
    router.register(makeSkill({ name: 'test' }));

    const builder = new SkillChainBuilder();
    builder.addStep({ skillName: 'lint' }).addStep({ skillName: 'test' });

    const missing = builder.validate(router);
    expect(missing).toEqual([]);
  });

  it('validate fails for missing skill', () => {
    const router = new SkillRouter();
    router.register(makeSkill({ name: 'lint' }));

    const builder = new SkillChainBuilder();
    builder.addStep({ skillName: 'lint' }).addStep({ skillName: 'test' });

    const missing = builder.validate(router);
    expect(missing).toEqual(['test']);
  });

  it('build throws on dependency cycle', () => {
    const builder = new SkillChainBuilder();
    builder
      .addStep({ skillName: 'a', dependsOn: ['b'] })
      .addStep({ skillName: 'b', dependsOn: ['a'] });

    expect(() => builder.build()).toThrow(/cycle/i);
  });
});
