---
name: unreal-networking
description: Unreal Engine networking skill for replication, RPCs, relevancy, and dedicated server architecture.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Networking Skill

Multiplayer networking for Unreal Engine.

## Overview

This skill provides capabilities for implementing multiplayer games using Unreal's built-in networking system.

## Capabilities

### Replication
- Configure replicated properties
- Handle replication conditions
- Manage replication priorities
- Implement custom replication

### Remote Procedure Calls
- Implement Server RPCs
- Create Client RPCs
- Handle Multicast RPCs
- Manage RPC reliability

### Authority and Relevancy
- Handle server authority
- Configure network relevancy
- Manage actor ownership
- Implement client prediction

### Dedicated Servers
- Build dedicated server targets
- Handle headless mode
- Manage server performance
- Implement session management

## Prerequisites

- Unreal Engine 5.0+
- Network knowledge

## Usage Patterns

### Replicated Property

```cpp
UPROPERTY(ReplicatedUsing=OnRep_Health)
float Health;

UFUNCTION()
void OnRep_Health()
{
    // Called on clients when Health changes
    UpdateHealthUI();
}

void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    DOREPLIFETIME(AMyCharacter, Health);
}
```

### RPC Implementation

```cpp
UFUNCTION(Server, Reliable, WithValidation)
void Server_Fire(FVector Location, FRotator Rotation);

bool Server_Fire_Validate(FVector Location, FRotator Rotation)
{
    return true; // Add validation
}

void Server_Fire_Implementation(FVector Location, FRotator Rotation)
{
    // Execute on server
}
```

## Best Practices

1. Validate all server RPCs
2. Minimize replicated properties
3. Use relevancy wisely
4. Test with simulated lag
5. Profile network bandwidth

## References

- [Networking Documentation](https://docs.unrealengine.com/5.0/en-US/networking-and-multiplayer-in-unreal-engine/)
