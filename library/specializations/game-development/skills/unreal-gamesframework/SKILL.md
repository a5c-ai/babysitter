---
name: unreal-gamesframework
description: Unreal Engine Gameplay Ability System (GAS) skill for attributes, abilities, and gameplay effects.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal GAS Skill

Gameplay Ability System for Unreal Engine.

## Overview

This skill provides capabilities for implementing complex gameplay systems using Unreal's Gameplay Ability System (GAS).

## Capabilities

### Abilities
- Create Gameplay Abilities
- Handle ability activation
- Manage ability costs
- Implement cooldowns

### Attributes
- Define attribute sets
- Handle attribute modifiers
- Implement derived attributes
- Manage attribute replication

### Gameplay Effects
- Create instant effects
- Implement duration effects
- Handle stacking
- Manage effect removal

### Integration
- Implement ability tasks
- Handle ability events
- Create ability tags
- Manage ability instances

## Prerequisites

- Unreal Engine 5.0+
- GameplayAbilities plugin enabled

## Usage Patterns

### Attribute Set

```cpp
UCLASS()
class UMyAttributeSet : public UAttributeSet
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_Health)
    FGameplayAttributeData Health;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, Health)

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_MaxHealth)
    FGameplayAttributeData MaxHealth;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, MaxHealth)
};
```

### Gameplay Ability

```cpp
UCLASS()
class UGA_Attack : public UGameplayAbility
{
    GENERATED_BODY()

protected:
    virtual void ActivateAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        const FGameplayEventData* TriggerEventData) override;
};
```

## Best Practices

1. Use tags extensively
2. Keep abilities modular
3. Handle prediction properly
4. Test multiplayer thoroughly
5. Document ability interactions

## References

- [GAS Documentation](https://docs.unrealengine.com/5.0/en-US/gameplay-ability-system-for-unreal-engine/)
