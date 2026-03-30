---
name: unreal-cpp
description: Unreal Engine C++ programming skill for UCLASS macros, reflection system, garbage collection, and engine integration.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal C++ Skill

C++ programming for Unreal Engine development.

## Overview

This skill provides capabilities for implementing Unreal Engine gameplay and systems using C++, including the reflection system, macros, and engine integration.

## Capabilities

### UCLASS System
- Implement UCLASS macros
- Handle UPROPERTY specifiers
- Create UFUNCTION methods
- Manage USTRUCT types

### Memory Management
- Use smart pointers
- Handle garbage collection
- Manage object lifecycles
- Implement weak references

### Engine Integration
- Create Actor classes
- Implement Components
- Handle Subsystems
- Create Plugins

### Blueprint Exposure
- Expose C++ to Blueprint
- Handle BlueprintCallable
- Implement BlueprintNativeEvent
- Create Blueprint Function Libraries

## Prerequisites

- Unreal Engine 5.0+
- Visual Studio 2022 / Rider
- C++ programming knowledge

## Usage Patterns

### Actor Class

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMyCharacter();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float Health = 100.f;

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void TakeDamage(float Damage);

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
};
```

### Component

```cpp
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYGAME_API UHealthComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintAssignable)
    FOnHealthChanged OnHealthChanged;

    UFUNCTION(BlueprintCallable)
    void ModifyHealth(float Delta);

private:
    UPROPERTY(EditDefaultsOnly)
    float MaxHealth = 100.f;

    float CurrentHealth;
};
```

## Best Practices

1. Use UPROPERTY for GC visibility
2. Forward declare where possible
3. Use interfaces for decoupling
4. Profile with Unreal Insights
5. Follow Unreal coding standards

## References

- [Unreal C++ Documentation](https://docs.unrealengine.com/5.0/en-US/programming-with-cplusplus-in-unreal-engine/)
