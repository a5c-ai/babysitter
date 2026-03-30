---
name: unity-addressables
description: Unity Addressables asset management skill for remote catalogs, content updates, asset bundles, and memory-efficient asset loading.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Addressables Skill

Addressable asset management system for Unity projects.

## Overview

This skill provides capabilities for implementing Unity's Addressables system for efficient asset management, remote content delivery, and memory optimization.

## Capabilities

### Asset Organization
- Configure addressable groups
- Set up asset labels and addresses
- Manage group schemas and settings
- Organize assets by load behavior

### Remote Content
- Configure remote catalog hosting
- Set up content update workflows
- Manage asset bundle hosting
- Implement CDN integration

### Loading Strategies
- Implement async asset loading
- Handle loading dependencies
- Manage memory with release patterns
- Configure preloading strategies

### Build Pipeline
- Configure build scripts
- Set up content builds
- Generate catalogs and bundles
- Manage build caching

## Prerequisites

- Unity 2021.3+
- Addressables package installed
- Remote hosting setup (optional)

## Usage Patterns

### Loading Assets

```csharp
// Load by address
var handle = Addressables.LoadAssetAsync<GameObject>("Prefabs/Player");
handle.Completed += (op) => {
    GameObject player = op.Result;
    Instantiate(player);
};

// Load by label
var allEnemies = await Addressables.LoadAssetsAsync<GameObject>(
    "enemies",
    (enemy) => { /* callback per asset */ }
);
```

### Memory Management

```csharp
// Release when done
Addressables.Release(handle);

// Instance management
var instance = await Addressables.InstantiateAsync("Prefabs/Bullet");
// Later...
Addressables.ReleaseInstance(instance);
```

## Best Practices

1. Group assets by loading context
2. Use labels for cross-cutting concerns
3. Release assets when not needed
4. Test with remote bundles early
5. Monitor memory with Profiler

## References

- [Addressables Documentation](https://docs.unity3d.com/Packages/com.unity.addressables@latest)
