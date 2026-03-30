---
name: unreal-development
description: Unreal Engine integration skill for C++/Blueprint development, actor lifecycle management, plugin development, and editor automation. Enables LLMs to interact with Unreal Editor through MCP servers for level manipulation, Blueprint generation, and automated workflows.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Development Skill

Comprehensive Unreal Engine development integration for AI-assisted game creation, editor automation, and project management.

## Overview

This skill provides capabilities for interacting with Unreal Engine projects, including C++ development, Blueprint visual scripting, actor management, and build automation. It leverages the Unreal MCP ecosystem for direct editor integration when available.

## Capabilities

### Project Management
- Create and configure Unreal projects
- Manage project settings (Project Settings, DefaultEngine.ini, etc.)
- Configure plugin dependencies
- Set up module structure for code organization

### C++ Development
- Generate Actor and Component classes with proper UCLASS macros
- Create UObject subclasses with reflection support
- Implement interfaces (UInterface)
- Write custom Editor modules
- Generate unit tests using Automation Framework

### Blueprint Visual Scripting
- Generate Blueprint classes from specifications
- Create Blueprint function libraries
- Design Blueprint interfaces
- Build reusable Blueprint macros
- Generate data-only Blueprints

### Actor and Component System
- Create and modify Actors programmatically
- Design component hierarchies
- Implement tick and lifecycle management
- Set up actor replication for multiplayer

### Level Design
- Create and modify levels
- Place actors and configure properties
- Set up level streaming
- Configure World Partition settings

### Build System
- Configure build settings for multiple platforms
- Create build scripts using BuildGraph
- Set up CI/CD pipelines
- Manage platform-specific configurations

## Prerequisites

### Unreal Engine Installation
- Unreal Engine 5.0 or higher recommended
- Visual Studio 2022 with C++ game development workload
- .NET 6.0 SDK for tooling

### MCP Server (Recommended)
For direct Unreal Editor integration:

```json
{
  "mcpServers": {
    "unreal": {
      "command": "python",
      "args": ["-m", "unreal_mcp"],
      "env": {
        "UNREAL_PROJECT_PATH": "/path/to/project.uproject"
      }
    }
  }
}
```

Alternative MCP servers:
- `UnrealMCP` (kvick-games) - TCP server with JSON commands
- `unreal-mcp` (chongdashu) - Natural language control
- `Unreal_mcp` (ChiR24) - C++ Automation Bridge

## Usage Patterns

### Creating an Actor Class (C++)

```cpp
// MyCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "MyCharacter.generated.h"

UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMyCharacter();

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float MoveSpeed = 600.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float JumpHeight = 420.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    class UCameraComponent* CameraComponent;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    class USpringArmComponent* SpringArmComponent;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void StartJump();
    void StopJump();
};
```

```cpp
// MyCharacter.cpp
#include "MyCharacter.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

AMyCharacter::AMyCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    // Create spring arm
    SpringArmComponent = CreateDefaultSubobject<USpringArmComponent>(TEXT("SpringArm"));
    SpringArmComponent->SetupAttachment(RootComponent);
    SpringArmComponent->TargetArmLength = 400.0f;
    SpringArmComponent->bUsePawnControlRotation = true;

    // Create camera
    CameraComponent = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
    CameraComponent->SetupAttachment(SpringArmComponent);

    // Configure movement
    GetCharacterMovement()->MaxWalkSpeed = MoveSpeed;
    GetCharacterMovement()->JumpZVelocity = JumpHeight;
}

void AMyCharacter::BeginPlay()
{
    Super::BeginPlay();
}

void AMyCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void AMyCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis("MoveForward", this, &AMyCharacter::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &AMyCharacter::MoveRight);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &AMyCharacter::StartJump);
    PlayerInputComponent->BindAction("Jump", IE_Released, this, &AMyCharacter::StopJump);
}

void AMyCharacter::MoveForward(float Value)
{
    if (Value != 0.0f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}

void AMyCharacter::MoveRight(float Value)
{
    if (Value != 0.0f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
        AddMovementInput(Direction, Value);
    }
}

void AMyCharacter::StartJump()
{
    Jump();
}

void AMyCharacter::StopJump()
{
    StopJumping();
}
```

### Creating a Data Asset (C++)

```cpp
// EnemyDataAsset.h
#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "EnemyDataAsset.generated.h"

UENUM(BlueprintType)
enum class EEnemyType : uint8
{
    Melee,
    Ranged,
    Boss
};

UCLASS(BlueprintType)
class MYGAME_API UEnemyDataAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()

public:
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Basic Info")
    FString EnemyName;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Basic Info")
    EEnemyType EnemyType;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Stats")
    float MaxHealth = 100.0f;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Stats")
    float MoveSpeed = 300.0f;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Combat")
    float AttackDamage = 10.0f;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Combat")
    float AttackRange = 150.0f;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Visuals")
    TObjectPtr<USkeletalMesh> Mesh;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Visuals")
    TObjectPtr<UAnimBlueprint> AnimBlueprint;

    // UPrimaryDataAsset interface
    virtual FPrimaryAssetId GetPrimaryAssetId() const override;
};
```

### Gameplay Ability System Example

```cpp
// MyGameplayAbility.h
#pragma once

#include "CoreMinimal.h"
#include "Abilities/GameplayAbility.h"
#include "MyGameplayAbility.generated.h"

UCLASS()
class MYGAME_API UMyGameplayAbility : public UGameplayAbility
{
    GENERATED_BODY()

public:
    UMyGameplayAbility();

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Ability")
    float CooldownDuration = 1.0f;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Ability")
    float ManaCost = 10.0f;

protected:
    virtual void ActivateAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        const FGameplayEventData* TriggerEventData) override;

    virtual void EndAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        bool bReplicateEndAbility,
        bool bWasCancelled) override;
};
```

## Integration with Babysitter SDK

### Task Definition Example

```javascript
const unrealActorTask = defineTask({
  name: 'unreal-actor-generation',
  description: 'Generate Unreal Engine Actor class',

  inputs: {
    actorType: { type: 'string', required: true }, // Character, Pawn, Actor
    className: { type: 'string', required: true },
    components: { type: 'array', required: true },
    outputPath: { type: 'string', required: true }
  },

  outputs: {
    headerPath: { type: 'string' },
    sourcePath: { type: 'string' },
    success: { type: 'boolean' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate Unreal Actor: ${inputs.className}`,
      skill: {
        name: 'unreal-development',
        context: {
          operation: 'generate_actor',
          actorType: inputs.actorType,
          className: inputs.className,
          components: inputs.components,
          outputPath: inputs.outputPath
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Integration

### Available MCP Tools (via unreal-mcp)

| Tool | Description |
|------|-------------|
| `unreal_spawn_actor` | Spawn actor in level |
| `unreal_modify_actor` | Modify actor properties |
| `unreal_create_blueprint` | Generate Blueprint class |
| `unreal_compile` | Trigger hot reload/compile |
| `unreal_build` | Build for target platform |
| `unreal_run_automation` | Execute automation tests |
| `unreal_query_level` | Get level structure |
| `unreal_python_exec` | Execute Unreal Python command |

### Configuration

```json
{
  "mcpServers": {
    "unreal": {
      "command": "python",
      "args": ["-m", "unreal_mcp"],
      "env": {
        "UNREAL_PROJECT_PATH": "C:/Projects/MyGame/MyGame.uproject",
        "UNREAL_ENGINE_PATH": "C:/Program Files/Epic Games/UE_5.3"
      }
    }
  }
}
```

## Best Practices

1. **UCLASS Macros**: Always use appropriate specifiers (BlueprintType, Blueprintable, etc.)
2. **Property Specifiers**: Use EditAnywhere/VisibleAnywhere and BlueprintReadWrite/BlueprintReadOnly correctly
3. **Replication**: Mark replicated properties with UPROPERTY(Replicated)
4. **Memory Management**: Use TObjectPtr for object pointers, avoid raw pointers
5. **Modules**: Organize code into logical modules with clear dependencies
6. **Tick Optimization**: Only enable tick when necessary, use Timers for periodic tasks

## Platform Considerations

| Platform | Key Considerations |
|----------|-------------------|
| PC | Full feature support, shader model 5+ |
| Console | Memory budgets, certification requirements |
| Mobile | Simplified rendering, thermal management |
| VR | Frame rate requirements, motion sickness prevention |

## References

- [Unreal Engine Documentation](https://dev.epicgames.com/documentation/)
- [UnrealMCP (kvick-games)](https://github.com/kvick-games/UnrealMCP)
- [unreal-mcp (chongdashu)](https://github.com/chongdashu/unreal-mcp)
- [Unreal_mcp (ChiR24)](https://github.com/ChiR24/Unreal_mcp)
- [ClaudeAI Plugin for UE5](https://claudeaiplugin.com/)
- [Unreal C++ Documentation](https://docs.unrealengine.com/5.0/en-US/programming-with-cplusplus-in-unreal-engine/)
