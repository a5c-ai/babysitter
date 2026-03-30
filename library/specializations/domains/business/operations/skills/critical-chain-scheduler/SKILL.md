---
name: critical-chain-scheduler
description: Critical Chain Project Management (CCPM) skill with buffer management and resource leveling
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: theory-of-constraints
---

# Critical Chain Scheduler

## Overview

The Critical Chain Scheduler skill provides comprehensive capabilities for implementing Critical Chain Project Management (CCPM). It supports critical chain identification, buffer sizing and monitoring, resource leveling, and multi-project synchronization.

## Capabilities

- Critical chain identification
- Project buffer sizing
- Feeding buffer calculation
- Resource buffer placement
- Multi-project buffer management
- Buffer consumption tracking
- Relay runner behavior monitoring

## Used By Processes

- TOC-004: Critical Chain Project Management
- CAP-002: Production Scheduling Optimization

## Tools and Libraries

- Project management APIs
- Scheduling optimization tools
- Resource management systems
- Buffer monitoring dashboards

## Usage

```yaml
skill: critical-chain-scheduler
inputs:
  project_name: "New Product Launch"
  tasks:
    - id: "T1"
      name: "Design"
      duration_50: 10  # 50% confidence estimate
      duration_90: 18  # 90% confidence estimate
      resources: ["Engineer A"]
      predecessors: []
    - id: "T2"
      name: "Prototype"
      duration_50: 5
      duration_90: 9
      resources: ["Engineer A"]
      predecessors: ["T1"]
    - id: "T3"
      name: "Testing"
      duration_50: 8
      duration_90: 14
      resources: ["Engineer B"]
      predecessors: ["T2"]
  resource_constraints:
    - name: "Engineer A"
      capacity: 1
outputs:
  - critical_chain
  - project_buffer
  - feeding_buffers
  - resource_buffers
  - project_schedule
  - buffer_status_report
```

## CCPM vs. Traditional Project Management

| Aspect | Traditional | CCPM |
|--------|-------------|------|
| Task estimates | Include safety | Aggressive (50%) |
| Safety time | Hidden in tasks | Aggregated in buffers |
| Start rule | As soon as possible | As late as safely possible |
| Progress tracking | Task completion | Buffer consumption |
| Resource focus | Utilization | Flow |

## Buffer Types and Sizing

### Project Buffer
```
Location: End of critical chain
Size: 50% of critical chain length
Purpose: Protect project due date
```

### Feeding Buffer
```
Location: Where non-critical path joins critical chain
Size: 50% of feeding chain length
Purpose: Protect critical chain from delays
```

### Resource Buffer
```
Location: Before resource-constrained critical chain tasks
Purpose: Alert resources to upcoming critical work
```

## Buffer Management

| Buffer Status | % Consumed | Action |
|--------------|------------|--------|
| Green | 0-33% | Plan recovery |
| Yellow | 34-66% | Implement recovery |
| Red | 67-100% | Escalate and expedite |

## Relay Runner Behavior

1. Don't start early
2. Work at full effort once started
3. Pass work immediately when complete
4. Focus on elapsed time, not effort

## Integration Points

- Project management systems
- Resource management platforms
- Portfolio management tools
- Time tracking systems
