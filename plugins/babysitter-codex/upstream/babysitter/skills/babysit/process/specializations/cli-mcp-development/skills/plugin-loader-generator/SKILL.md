---
name: plugin-loader-generator
description: Generate dynamic plugin loading system with discovery, validation, and lifecycle management.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Plugin Loader Generator

Generate dynamic plugin loading system.

## Generated Patterns

```typescript
import fs from 'fs';
import path from 'path';

interface Plugin {
  name: string;
  version: string;
  init: () => Promise<void>;
  destroy?: () => Promise<void>;
}

export class PluginLoader {
  private plugins = new Map<string, Plugin>();
  private pluginDirs: string[];

  constructor(pluginDirs: string[]) {
    this.pluginDirs = pluginDirs;
  }

  async discover(): Promise<string[]> {
    const found: string[] = [];
    for (const dir of this.pluginDirs) {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(dir, entry.name, 'manifest.json');
          if (fs.existsSync(manifestPath)) {
            found.push(path.join(dir, entry.name));
          }
        }
      }
    }
    return found;
  }

  async load(pluginPath: string): Promise<Plugin> {
    const manifest = JSON.parse(fs.readFileSync(path.join(pluginPath, 'manifest.json'), 'utf-8'));
    const module = await import(path.join(pluginPath, manifest.main));
    const plugin: Plugin = { name: manifest.name, version: manifest.version, ...module };
    await plugin.init();
    this.plugins.set(plugin.name, plugin);
    return plugin;
  }

  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin?.destroy) await plugin.destroy();
    this.plugins.delete(name);
  }
}
```

## Target Processes

- plugin-architecture-implementation
- cli-application-bootstrap
