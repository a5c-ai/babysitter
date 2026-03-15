---
name: multi-service-orchestration
description: PM2 process management, backend/frontend cascade execution, parallel worktree builds, and cross-service integration testing.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Multi-Service Orchestration

## Overview

Multi-service management methodology adapted from the Everything Claude Code project. Handles service discovery, dependency resolution, PM2 management, cascade/parallel execution, and cross-service testing.

## Service Discovery
- Scan for service directories (packages/, services/, apps/)
- Parse package.json for dependencies and scripts
- Build dependency graph
- Detect package managers per service
- Determine topological execution order
- Flag circular dependencies

## Execution Modes

### Cascade Mode
- Sequential execution following dependency order
- Wait for health check before starting dependents
- Stop on failure with detailed error report
- Support partial cascade (skip healthy services)

### Parallel Mode
- Concurrent execution for independent services
- Optional worktree isolation per service
- Configurable concurrency limit
- Collect all results (continue on individual failures)

### Auto Mode (Default)
- Analyze dependency graph
- Use cascade for services with sequential dependencies
- Use parallel for independent service groups
- Hybrid: cascade between groups, parallel within groups

## PM2 Management
- Generate ecosystem.config.js from service manifest
- Configure per service: name, script, cwd, env, instances
- Start in topological order with health check gates
- Log rotation and restart policies
- Status monitoring: online, stopped, errored

## Cross-Service Testing
- API contract verification (request/response schemas)
- Event bus message flow testing
- Shared state consistency checks
- Authentication across service boundaries
- Circuit breaker behavior validation

## Health Monitoring
- Health check endpoint polling
- PM2 process status monitoring
- Resource usage tracking (CPU, memory)
- Log file error pattern detection
- Inter-service connectivity verification

## When to Use

- Multi-package monorepo development
- Microservice orchestration
- Full-stack application management
- CI/CD pipeline for multi-service deployments

## Agents Used

- `architect` (service discovery and dependency mapping)
- `build-resolver` (individual service builds)
- `e2e-runner` (cross-service integration testing)
