---
name: plugin-dependency-resolver
description: Generate plugin dependency resolution logic with topological sorting.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Plugin Dependency Resolver

Generate plugin dependency resolution logic.

## Generated Patterns

```typescript
interface PluginNode {
  name: string;
  dependencies: string[];
}

export function resolveDependencies(plugins: PluginNode[]): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const plugin of plugins) {
    graph.set(plugin.name, plugin.dependencies);
    inDegree.set(plugin.name, 0);
  }

  for (const [, deps] of graph) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([n]) => n);
  const result: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const dep of graph.get(node) || []) {
      inDegree.set(dep, inDegree.get(dep)! - 1);
      if (inDegree.get(dep) === 0) queue.push(dep);
    }
  }

  if (result.length !== plugins.length) {
    throw new Error('Circular dependency detected');
  }

  return result.reverse();
}
```

## Target Processes

- plugin-architecture-implementation
