---
name: unity-netcode
description: Unity Netcode for GameObjects skill for multiplayer networking, RPCs, state synchronization, and server-authoritative gameplay.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Netcode Skill

Multiplayer networking using Unity Netcode for GameObjects.

## Overview

This skill provides capabilities for implementing multiplayer games using Unity's Netcode for GameObjects, including state synchronization, RPCs, and network topology configuration.

## Capabilities

### Network Architecture
- Configure client-server topology
- Set up network manager
- Handle player spawning
- Manage scene loading

### State Synchronization
- Implement NetworkVariables
- Configure sync modes
- Handle prediction
- Manage network transforms

### Remote Procedure Calls
- Implement ServerRpc methods
- Create ClientRpc methods
- Handle RPC parameters
- Manage RPC batching

### Player Management
- Handle player connections
- Implement player spawning
- Manage player state
- Handle disconnections

## Prerequisites

- Unity 2021.3+
- Netcode for GameObjects package
- Transport layer (UTP recommended)

## Usage Patterns

### Network Object

```csharp
public class PlayerNetworkBehaviour : NetworkBehaviour
{
    private NetworkVariable<int> health = new NetworkVariable<int>(100);

    public override void OnNetworkSpawn()
    {
        if (IsOwner)
        {
            // Initialize owned player
        }
    }

    [ServerRpc]
    public void TakeDamageServerRpc(int damage)
    {
        health.Value -= damage;
        if (health.Value <= 0)
        {
            DieClientRpc();
        }
    }

    [ClientRpc]
    private void DieClientRpc()
    {
        // Play death effects on all clients
    }
}
```

### Network Manager Setup

```csharp
// Configure in NetworkManager component
networkManager.ConnectionApprovalCallback = ApprovalCheck;

void ApprovalCheck(NetworkManager.ConnectionApprovalRequest request,
                   NetworkManager.ConnectionApprovalResponse response)
{
    response.Approved = ValidatePlayer(request.Payload);
    response.CreatePlayerObject = true;
}
```

## Best Practices

1. Use NetworkVariables for state
2. Validate all RPCs on server
3. Minimize network traffic
4. Handle disconnections gracefully
5. Test with simulated latency

## References

- [Netcode Documentation](https://docs-multiplayer.unity3d.com/)
