---
name: unity-animation
description: Unity Animation skill for Animator controllers, Animation Rigging, Timeline integration, and animation state machines.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Animation Skill

Animation system implementation and configuration in Unity.

## Overview

This skill provides capabilities for implementing character and object animation using Unity's Animator, Animation Rigging, and Timeline systems.

## Capabilities

### Animator Controllers
- Create state machines
- Configure blend trees
- Set up animation layers
- Handle state transitions

### Animation Rigging
- Implement IK constraints
- Create procedural animation
- Set up multi-aim constraints
- Handle runtime rigging

### Timeline
- Create animation clips
- Sequence cutscenes
- Integrate with Cinemachine
- Handle animation events

### Avatar System
- Configure humanoid avatars
- Set up animation retargeting
- Handle muscle settings
- Manage avatar masks

## Prerequisites

- Unity 2021.3+
- Animation Rigging package (optional)
- Timeline package (built-in)

## Usage Patterns

### Animator Controller

```csharp
public class CharacterAnimator : MonoBehaviour
{
    private Animator animator;
    private static readonly int SpeedHash = Animator.StringToHash("Speed");
    private static readonly int JumpTrigger = Animator.StringToHash("Jump");

    void Update()
    {
        float speed = GetMovementSpeed();
        animator.SetFloat(SpeedHash, speed, 0.1f, Time.deltaTime);

        if (Input.GetButtonDown("Jump"))
        {
            animator.SetTrigger(JumpTrigger);
        }
    }
}
```

### Animation Rigging

```csharp
[RequireComponent(typeof(RigBuilder))]
public class AimRig : MonoBehaviour
{
    [SerializeField] private MultiAimConstraint aimConstraint;
    [SerializeField] private Transform aimTarget;

    public void SetAimWeight(float weight)
    {
        aimConstraint.weight = weight;
    }
}
```

## Best Practices

1. Use parameter hashes for performance
2. Organize layers by body part
3. Use avatar masks for partial animations
4. Profile animator updates
5. Use sub-state machines for organization

## References

- [Animation Documentation](https://docs.unity3d.com/Manual/AnimationSection.html)
