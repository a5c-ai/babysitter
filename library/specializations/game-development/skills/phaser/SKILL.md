---
name: phaser
description: Phaser.js 2D game development skill for web games, arcade physics, and web deployment.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
graph:
  domains: [domain:gaming]
  specializations: [specialization:game-development]
  skillAreas: [skill-area:game-engines, skill-area:gameplay-programming]
  roles: [role:game-developer]
---

# Phaser Skill

Phaser.js 2D game development for web.

## Overview

This skill provides capabilities for creating 2D web games using Phaser.js.

## Capabilities

- Configure game scenes
- Implement arcade physics
- Handle sprites and animations
- Set up input systems
- Deploy to web

## Usage Patterns

```javascript
class GameScene extends Phaser.Scene {
    preload() {
        this.load.image('player', 'assets/player.png');
    }
    create() {
        this.player = this.physics.add.sprite(100, 100, 'player');
    }
}
```

## References

- [Phaser Documentation](https://phaser.io/docs)
