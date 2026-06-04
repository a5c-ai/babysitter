/**
 * Skill routing module for L6 Agent-Platform.
 *
 * Provides skill registration, criteria-based matching, filesystem discovery,
 * and chain-of-skills orchestration.
 */

// Types
export type {
  SkillDescriptor,
  SkillMatchCriteria,
  SkillMatchResult,
  SkillChainStep,
  SkillChain,
} from './types';

// Router
export { SkillRouter } from './router';

// Discovery
export { SkillDiscoveryService } from './discovery';
export type { RawSkillEntry } from './discovery';

// Chain builder
export { SkillChainBuilder } from './chain';
