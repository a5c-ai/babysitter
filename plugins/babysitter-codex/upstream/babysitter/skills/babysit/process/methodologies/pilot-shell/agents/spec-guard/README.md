# Spec Guard Agent

## Overview

The `spec-guard` agent prevents premature completion of incomplete specifications by tracking task states and blocking stop signals when tasks remain PENDING.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Spec Completion Guardian |
| **Philosophy** | "No spec is done until every task is VERIFIED" |

## Task State Model

`PENDING` -> `COMPLETE` -> `VERIFIED`

## Usage

Referenced by `pilot-shell-feature.js` to enforce spec completion before merge.

## Attribution

Adapted from the spec_stop_guard Stop hook in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
