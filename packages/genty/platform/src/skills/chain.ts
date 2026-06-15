/**
 * SkillChainBuilder — assembles an ordered chain of skill invocations with
 * dependency tracking and topological validation.
 */

import type { SkillChain, SkillChainStep } from './types';
import type { SkillRouter } from './router';

/**
 * Build a SkillChain from individual steps, producing a topologically sorted
 * execution order that respects `dependsOn` declarations.
 */
export class SkillChainBuilder {
  private readonly steps: SkillChainStep[] = [];
  private description = '';

  /** Append a step to the chain. */
  addStep(step: SkillChainStep): this {
    this.steps.push(step);
    return this;
  }

  /** Set the chain's human-readable description. */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * Build the chain, topologically sorting steps so that every step appears
   * after all of its `dependsOn` prerequisites.
   *
   * Throws if the dependency graph contains a cycle.
   */
  build(): SkillChain {
    const sorted = topologicalSort(this.steps);
    return {
      steps: sorted,
      description: this.description,
    };
  }

  /**
   * Validate that every skill referenced in the chain is registered in the
   * given router. Returns an array of missing skill names (empty = valid).
   */
  validate(router: SkillRouter): string[] {
    const missing: string[] = [];
    for (const step of this.steps) {
      if (!router.get(step.skillName)) {
        missing.push(step.skillName);
      }
    }
    return missing;
  }
}

// ---- topological sort (Kahn's algorithm) ----

function topologicalSort(steps: SkillChainStep[]): SkillChainStep[] {
  const byName = new Map<string, SkillChainStep>();
  for (const step of steps) {
    byName.set(step.skillName, step);
  }

  // Build adjacency and in-degree structures
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // prerequisite -> list of dependents

  for (const step of steps) {
    if (!inDegree.has(step.skillName)) {
      inDegree.set(step.skillName, 0);
    }
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        inDegree.set(step.skillName, (inDegree.get(step.skillName) ?? 0) + 1);
        const list = dependents.get(dep) ?? [];
        list.push(step.skillName);
        dependents.set(dep, list);
        // Ensure dep has an in-degree entry even if it wasn't added as a step
        if (!inDegree.has(dep)) {
          inDegree.set(dep, 0);
        }
      }
    }
  }

  // Collect nodes with in-degree 0
  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) {
      queue.push(name);
    }
  }
  // Stable ordering: sort the initial queue alphabetically
  queue.sort();

  const sorted: SkillChainStep[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const step = byName.get(current);
    if (step) {
      sorted.push(step);
    }

    for (const dependent of dependents.get(current) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
        queue.sort(); // keep stable ordering
      }
    }
  }

  // If we didn't visit every step, there's a cycle
  if (sorted.length < steps.length) {
    const visited = new Set(sorted.map((s) => s.skillName));
    const cycleMembers = steps
      .filter((s) => !visited.has(s.skillName))
      .map((s) => s.skillName);
    throw new Error(
      `Dependency cycle detected among skills: ${cycleMembers.join(', ')}`,
    );
  }

  return sorted;
}
