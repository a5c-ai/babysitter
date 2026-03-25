---
name: unity-input-system
description: Unity New Input System configuration skill for action maps, device bindings, control schemes, and cross-platform input handling.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Input System Skill

New Input System configuration and implementation for Unity.

## Overview

This skill provides capabilities for implementing Unity's New Input System, including action maps, device support, and cross-platform input handling.

## Capabilities

### Action Configuration
- Create Input Action Assets
- Define action maps and actions
- Configure bindings and interactions
- Set up action types (value, button, passthrough)

### Device Support
- Configure gamepad support
- Implement keyboard/mouse handling
- Set up touch controls
- Handle XR controllers

### Control Schemes
- Define control schemes
- Implement scheme switching
- Support local multiplayer
- Configure device requirements

### Runtime Handling
- Generate C# input classes
- Handle input events
- Implement rebinding UI
- Manage device changes

## Prerequisites

- Unity 2021.3+
- Input System package installed

## Usage Patterns

### Input Actions Asset

```csharp
// Generated PlayerInput class usage
public class PlayerController : MonoBehaviour
{
    private PlayerInputActions inputActions;

    void Awake()
    {
        inputActions = new PlayerInputActions();
    }

    void OnEnable()
    {
        inputActions.Gameplay.Enable();
        inputActions.Gameplay.Jump.performed += OnJump;
        inputActions.Gameplay.Move.performed += OnMove;
    }

    void OnDisable()
    {
        inputActions.Gameplay.Disable();
    }

    void OnJump(InputAction.CallbackContext ctx)
    {
        // Handle jump
    }

    void OnMove(InputAction.CallbackContext ctx)
    {
        Vector2 movement = ctx.ReadValue<Vector2>();
    }
}
```

### Rebinding

```csharp
public void StartRebinding(InputAction action)
{
    action.PerformInteractiveRebinding()
        .WithControlsExcluding("Mouse")
        .OnComplete(operation => {
            operation.Dispose();
            SaveBindings();
        })
        .Start();
}
```

## Best Practices

1. Use Input Action Assets over direct polling
2. Implement rebinding for accessibility
3. Test all supported devices
4. Handle device disconnection gracefully
5. Save custom bindings to PlayerPrefs

## References

- [Input System Documentation](https://docs.unity3d.com/Packages/com.unity.inputsystem@latest)
