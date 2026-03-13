---
name: godot-networking
description: Godot multiplayer skill for high-level networking API, RPCs, and peer-to-peer networking.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Godot Networking Skill

Multiplayer networking for Godot Engine.

## Overview

This skill provides capabilities for implementing multiplayer games using Godot's networking systems.

## Capabilities

- Configure multiplayer peer
- Implement RPCs
- Handle synchronization
- Manage peer connections

## Usage Patterns

```gdscript
@rpc("any_peer", "call_local", "reliable")
func sync_position(pos: Vector2):
    position = pos
```

## References

- [Godot Networking](https://docs.godotengine.org/en/stable/tutorials/networking/)
