---
name: plugin-hook-system
description: Generate hook-based plugin extension system with event emitter patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Plugin Hook System

Generate hook-based plugin extension system.

## Generated Patterns

```typescript
type HookCallback = (...args: any[]) => Promise<any> | any;

export class HookSystem {
  private hooks = new Map<string, HookCallback[]>();

  register(hookName: string, callback: HookCallback): void {
    const callbacks = this.hooks.get(hookName) || [];
    callbacks.push(callback);
    this.hooks.set(hookName, callbacks);
  }

  async trigger(hookName: string, ...args: any[]): Promise<any[]> {
    const callbacks = this.hooks.get(hookName) || [];
    const results = [];
    for (const cb of callbacks) {
      results.push(await cb(...args));
    }
    return results;
  }

  async waterfall<T>(hookName: string, initial: T): Promise<T> {
    const callbacks = this.hooks.get(hookName) || [];
    let result = initial;
    for (const cb of callbacks) {
      result = await cb(result);
    }
    return result;
  }
}
```

## Target Processes

- plugin-architecture-implementation
