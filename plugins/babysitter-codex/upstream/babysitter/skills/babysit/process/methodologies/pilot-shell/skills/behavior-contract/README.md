# Behavior Contract Skill

## Overview

Formalizes bugs as Behavior Contracts with Bug Condition, Postcondition, and Invariants for testable, systematic bug resolution.

## Contract Components

| Component | Purpose | Test Mapping |
|-----------|---------|-------------|
| **Bug Condition** | What triggers the bug | Failing bug test |
| **Postcondition** | Correct behavior after fix | Expected test outcome |
| **Invariants** | What must not change | Preservation tests |

## Attribution

Adapted from the Bugfix Mode behavior contract pattern in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
