---
name: plugin-sandbox-setup
description: Configure plugin sandboxing with vm2 or isolated-vm for secure plugin execution.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Plugin Sandbox Setup

Configure plugin sandboxing for security.

## Generated Patterns

```typescript
import ivm from 'isolated-vm';

export async function runInSandbox(code: string, context: Record<string, unknown>) {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const vmContext = isolate.createContextSync();
  const jail = vmContext.global;

  for (const [key, value] of Object.entries(context)) {
    jail.setSync(key, new ivm.ExternalCopy(value).copyInto());
  }

  const script = isolate.compileScriptSync(code);
  const result = await script.run(vmContext, { timeout: 5000 });
  isolate.dispose();
  return result;
}
```

## Target Processes

- plugin-architecture-implementation
- mcp-server-security-hardening
