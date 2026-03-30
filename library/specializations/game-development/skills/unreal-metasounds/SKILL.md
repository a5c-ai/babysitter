---
name: unreal-metasounds
description: Unreal Engine MetaSounds skill for procedural audio, real-time synthesis, and advanced audio graphs.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal MetaSounds Skill

MetaSounds procedural audio system for Unreal Engine.

## Overview

This skill provides capabilities for implementing procedural audio using Unreal's MetaSounds system.

## Capabilities

### Audio Graphs
- Create MetaSound sources
- Build audio processing graphs
- Handle triggers and parameters
- Implement custom nodes

### Synthesis
- Use oscillators
- Implement filters
- Create envelopes
- Handle modulation

### Procedural Audio
- Generate sound effects
- Create adaptive music
- Implement audio variations
- Handle randomization

### Integration
- Trigger from gameplay
- Control parameters
- Handle spatialization
- Manage performance

## Prerequisites

- Unreal Engine 5.0+
- MetaSounds plugin enabled

## Usage Patterns

### MetaSound Source

```
1. Create MetaSound Source
2. Add input parameters
3. Build audio graph
4. Configure output
5. Use in Sound Cue or directly
```

### Parameter Control

```cpp
UAudioComponent* AudioComp = CreateAudioComponent();
AudioComp->SetFloatParameter(FName("Intensity"), 0.8f);
AudioComp->SetTriggerParameter(FName("OnHit"));
```

## Best Practices

1. Use presets for common patterns
2. Profile CPU usage
3. Handle voice management
4. Use groups for organization
5. Test on all platforms

## References

- [MetaSounds Documentation](https://docs.unrealengine.com/5.0/en-US/metasounds-in-unreal-engine/)
