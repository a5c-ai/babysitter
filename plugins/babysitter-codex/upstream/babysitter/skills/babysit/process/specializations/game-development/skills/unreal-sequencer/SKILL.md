---
name: unreal-sequencer
description: Unreal Engine Sequencer skill for cinematics, camera cuts, and in-game cutscenes.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Sequencer Skill

Sequencer for cinematics and cutscenes in Unreal Engine.

## Overview

This skill provides capabilities for creating cinematics using Unreal's Sequencer, including camera work, actor animation, and event triggering.

## Capabilities

### Sequence Creation
- Create level sequences
- Manage master sequences
- Handle sequence hierarchies
- Implement sequence players

### Camera Work
- Create camera cuts
- Implement camera rails
- Handle camera animation
- Manage camera bindings

### Actor Animation
- Key actor transforms
- Handle skeletal animation
- Implement audio tracks
- Manage event triggers

### Integration
- Trigger from gameplay
- Handle sequence events
- Implement binding overrides
- Manage sequence transitions

## Prerequisites

- Unreal Engine 5.0+
- Sequencer (built-in)

## Usage Patterns

### Level Sequence Setup

```cpp
// Play sequence from code
ULevelSequence* Sequence = LoadSequence();
ALevelSequenceActor* SequenceActor;
ULevelSequencePlayer* Player =
    ULevelSequencePlayer::CreateLevelSequencePlayer(
        GetWorld(),
        Sequence,
        FMovieSceneSequencePlaybackSettings(),
        SequenceActor
    );
Player->Play();
```

### Event Track

```
1. Add Event Track to sequence
2. Add key at desired time
3. Create event in blueprint
4. Bind event to function
```

## Best Practices

1. Use master sequences for organization
2. Handle binding carefully
3. Test sequence loading
4. Manage memory for long sequences
5. Profile playback performance

## References

- [Sequencer Documentation](https://docs.unrealengine.com/5.0/en-US/sequencer-editor-unreal-engine/)
