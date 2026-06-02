/**
 * Skill routing types for the L6 Agent-Platform skill router.
 */

export interface SkillDescriptor {
  name: string;
  description: string;
  capabilities?: string[];
  source: 'local' | 'plugin' | 'remote';
  triggers?: string[];
  domain?: string;
  filePath?: string;
}

export interface SkillMatchCriteria {
  taskType?: string;
  context?: string;
  capabilities?: string[];
  domain?: string;
}

export interface SkillMatchResult {
  skill: SkillDescriptor;
  score: number;
  reason: string;
}

export interface SkillChainStep {
  skillName: string;
  input?: unknown;
  dependsOn?: string[];
}

export interface SkillChain {
  steps: SkillChainStep[];
  description: string;
}
