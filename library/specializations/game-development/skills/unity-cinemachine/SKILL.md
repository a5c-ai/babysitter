---
name: unity-cinemachine
description: Unity Cinemachine skill for virtual cameras, procedural camera control, and cinematic sequences.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Cinemachine Skill

Procedural camera system using Unity Cinemachine.

## Overview

This skill provides capabilities for implementing dynamic camera systems using Cinemachine, including virtual cameras, camera blending, and cinematic sequences.

## Capabilities

### Virtual Cameras
- Create virtual cameras for different views
- Configure follow and look-at targets
- Set up framing transposers
- Implement orbital cameras

### Camera Behaviors
- Configure noise profiles for shake
- Implement dead zones and soft zones
- Set up camera collision
- Handle screen composition

### Blending and Transitions
- Configure blend curves
- Set up camera priorities
- Implement cutscenes with Timeline
- Handle state-driven cameras

### Advanced Features
- Create dolly tracks
- Implement target groups
- Set up clear shots
- Configure confiner extensions

## Prerequisites

- Unity 2021.3+
- Cinemachine package installed

## Usage Patterns

### Player Follow Camera

```csharp
// Configure in editor or via script
var vcam = GetComponent<CinemachineVirtualCamera>();
vcam.Follow = playerTransform;
vcam.LookAt = playerTransform;

// Framing Transposer settings
var transposer = vcam.GetCinemachineComponent<CinemachineFramingTransposer>();
transposer.m_ScreenX = 0.5f;
transposer.m_ScreenY = 0.4f;
```

### Camera Shake

```csharp
public void TriggerShake(float intensity, float duration)
{
    var noise = vcam.GetCinemachineComponent<CinemachineBasicMultiChannelPerlin>();
    noise.m_AmplitudeGain = intensity;
    StartCoroutine(ResetShake(duration));
}
```

## Best Practices

1. Use virtual cameras for game states
2. Configure proper priorities
3. Test camera transitions
4. Use Timeline for cutscenes
5. Profile camera updates

## References

- [Cinemachine Documentation](https://docs.unity3d.com/Packages/com.unity.cinemachine@latest)
