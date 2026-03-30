---
name: k8s-validator
description: Validate Kubernetes manifests for security, best practices, and resource limits
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Kubernetes Manifest Validator Skill

## Overview

Validates Kubernetes manifests including security policy checking with OPA/Gatekeeper, best practice linting with kube-linter, and resource limit validation.

## Capabilities

- Validate Kubernetes manifests (YAML/JSON)
- Security policy checking (OPA/Gatekeeper)
- Best practice linting (kube-linter, kubeval)
- Resource limit validation
- Network policy analysis
- RBAC analysis
- Pod security standards checking

## Target Processes

- iac-review
- devops-architecture-alignment
- resilience-patterns

## Input Schema

```json
{
  "type": "object",
  "required": ["manifestPaths"],
  "properties": {
    "manifestPaths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Paths to Kubernetes manifests"
    },
    "validators": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["kubeval", "kube-linter", "opa", "kubesec"]
      },
      "default": ["kubeval", "kube-linter"]
    },
    "options": {
      "type": "object",
      "properties": {
        "kubernetesVersion": {
          "type": "string",
          "default": "1.28.0"
        },
        "strict": {
          "type": "boolean",
          "default": false
        },
        "customPolicies": {
          "type": "array",
          "description": "Paths to custom OPA policies"
        }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "valid": {
      "type": "boolean"
    },
    "manifests": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "kind": { "type": "string" },
          "name": { "type": "string" },
          "valid": { "type": "boolean" },
          "issues": { "type": "array" }
        }
      }
    },
    "securityFindings": {
      "type": "array"
    },
    "bestPracticeViolations": {
      "type": "array"
    },
    "resourceLimitIssues": {
      "type": "array"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'k8s-validator',
    context: {
      manifestPaths: ['k8s/*.yaml'],
      validators: ['kubeval', 'kube-linter', 'kubesec'],
      options: {
        kubernetesVersion: '1.28.0',
        strict: true
      }
    }
  }
}
```
