# Context Preservation Skill

## Overview

Manages state capture and restore across context window compactions for seamless continuation of Pilot Shell workflows.

## Capabilities

| Capability | Description |
|-----------|-------------|
| **State Capture** | Serialize spec, quality, and TDD state to `.pilot-shell/state.json` |
| **State Restore** | Restore state on session start or post-compaction |
| **Threshold Monitoring** | Track context usage, trigger preservation at 70% |

## Attribution

Adapted from the PreCompact and post_compact_restore hooks in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
