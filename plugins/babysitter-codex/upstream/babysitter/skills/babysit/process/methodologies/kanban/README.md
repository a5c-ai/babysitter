# Kanban

**Creator**: Adapted from Toyota Production System by David J. Anderson
**Year**: 2007 (modern knowledge work adaptation)
**Category**: Flow Management / Continuous Delivery
**Priority**: Medium

## Overview

Kanban is a visual workflow management method for defining, managing, and improving services that deliver knowledge work. It emphasizes visualizing work, limiting work-in-progress (WIP), managing flow, and continuous improvement. Unlike sprint-based approaches, Kanban is continuous flow with no fixed iterations.

Originally developed at Toyota for manufacturing, Kanban was adapted to knowledge work by David J. Anderson in 2007. It has become one of the most popular approaches for teams practicing continuous delivery and DevOps.

Kanban is particularly well-suited for:
- **Continuous delivery teams** with ongoing work streams
- **Support and maintenance** work with unpredictable demand
- **Mature teams** seeking to optimize flow and reduce cycle time
- **Multi-team coordination** with shared dependencies
- **Services** requiring predictable lead times
- **Operations teams** managing incidents and requests

## Key Principles

### Six Core Practices

1. **Visualize the workflow** - Make all work visible on a Kanban board
2. **Limit work in progress (WIP)** - Set explicit limits to prevent overload
3. **Manage flow** - Focus on smooth, predictable flow of work
4. **Make process policies explicit** - Clear rules for how work moves
5. **Implement feedback loops** - Regular cadences for review and improvement
6. **Improve collaboratively, evolve experimentally** - Use data-driven experiments

### Core Concepts

- **Pull System**: Work is pulled when capacity is available, not pushed
- **Flow Efficiency**: Minimize wait time, maximize value-adding time
- **WIP Limits**: Constraints that expose bottlenecks and enable focus
- **Service Classes**: Prioritization categories (Expedite, Standard, Fixed Date, Intangible)
- **Cumulative Flow Diagram (CFD)**: Visual representation of work distribution over time
- **Cycle Time**: How long work takes from start to completion
- **Lead Time**: How long from customer request to delivery
- **Throughput**: Number of work items completed per time period

### Feedback Loops

Kanban defines several regular meetings:

- **Daily Standup** - Focus on flow and blockers (not individual status)
- **Replenishment Meeting** - Prioritize backlog and commit to new work
- **Service Delivery Review** - Review metrics with stakeholders
- **Operations Review** - Review flow metrics and identify improvements
- **Risk Review** - Identify and manage risks to delivery
- **Strategy Review** - Align work with strategic goals

## Usage

### Basic Usage

```javascript
import { babysit } from '@a5c-ai/babysitter-sdk';

const result = await babysit({
  process: 'methodologies/kanban',
  inputs: {
    projectName: 'Customer Support Portal',
    workflowStages: [
      { name: 'Backlog', type: 'queue' },
      { name: 'Ready', type: 'queue' },
      { name: 'Analysis', type: 'active' },
      { name: 'Development', type: 'active' },
      { name: 'Review', type: 'active' },
      { name: 'Done', type: 'complete' }
    ],
    defaultWipLimits: {
      'Analysis': 3,
      'Development': 5,
      'Review': 2
    },
    initialBacklog: [
      { id: 'item-1', title: 'Fix login bug', priority: 'high', serviceClass: 'Expedite' },
      { id: 'item-2', title: 'Add user profile page', priority: 'medium', serviceClass: 'Standard' }
    ],
    cycles: 5
  }
});
```

### With Team Capacity

```javascript
const result = await babysit({
  process: 'methodologies/kanban',
  inputs: {
    projectName: 'DevOps Pipeline',
    workflowStages: [
      { name: 'Backlog', type: 'queue' },
      { name: 'Ready', type: 'queue' },
      { name: 'In Progress', type: 'active' },
      { name: 'Testing', type: 'active' },
      { name: 'Deployment', type: 'active' },
      { name: 'Done', type: 'complete' }
    ],
    defaultWipLimits: {
      'In Progress': 4,
      'Testing': 3,
      'Deployment': 2
    },
    teamCapacity: {
      developers: 4,
      testers: 2,
      devops: 2
    },
    initialBacklog: [
      /* backlog items */
    ],
    cycles: 10
  }
});
```

### With Service Classes

```javascript
const result = await babysit({
  process: 'methodologies/kanban',
  inputs: {
    projectName: 'Product Development',
    serviceClasses: [
      'Expedite',      // Critical issues, break WIP limits
      'Fixed Date',    // Time-sensitive commitments
      'Standard',      // Regular features and improvements
      'Intangible'     // Tech debt, refactoring
    ],
    workflowStages: [
      { name: 'Backlog', type: 'queue' },
      { name: 'Selected', type: 'queue' },
      { name: 'Design', type: 'active' },
      { name: 'Build', type: 'active' },
      { name: 'Verify', type: 'active' },
      { name: 'Released', type: 'complete' }
    ],
    defaultWipLimits: {
      'Design': 2,
      'Build': 6,
      'Verify': 3
    },
    cycles: 8
  }
});
```

## Input Schema

```typescript
interface KanbanInputs {
  // Required
  projectName: string;              // Project or service name

  // Optional
  workflowStages?: Array<{          // Default: 6-stage workflow
    name: string;
    type: 'queue' | 'active' | 'complete';
  }>;

  defaultWipLimits?: {              // WIP limits per active stage
    [stageName: string]: number;
  };

  initialBacklog?: Array<{          // Initial work items
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    serviceClass?: string;
    estimatedSize?: 'S' | 'M' | 'L' | 'XL';
  }>;

  cycles?: number;                  // Number of flow cycles (default: 5)

  teamCapacity?: {                  // Team capacity info
    developers?: number;
    testers?: number;
    reviewers?: number;
    [role: string]: number;
  };

  serviceClasses?: string[];        // Default: ['Expedite', 'Standard', 'Fixed Date', 'Intangible']
}
```

## Output Schema

```typescript
interface KanbanOutput {
  success: boolean;
  projectName: string;

  // Board state
  board: {
    initial: BoardState;
    final: BoardState;
    stages: Array<WorkflowStage>;
    wipLimits: Record<string, number>;
  };

  // Flow cycles
  flowCycles: Array<{
    cycleNumber: number;
    startDate: string;
    endDate: string;
    wipManagement: WIPManagementResult;
    pullSystem: PullSystemResult;
    metrics: FlowMetricsResult;
  }>;

  // Metrics
  metrics: {
    totalCycles: number;
    itemsCompleted: number;
    averageCycleTime: number;        // Days from start to done
    averageLeadTime: number;         // Days from request to delivery
    throughput: number;              // Items per cycle
    bottlenecks: Array<Bottleneck>;
    blockedItems: Array<BlockedItem>;
  };

  // Replenishment
  replenishment: {
    prioritizedBacklog: Array<PrioritizedItem>;
    itemsAddedToReady: number;
    commitment: CommitmentInfo;
  };

  // Retrospective
  retrospective: {
    insights: Array<Insight>;
    impediments: Array<Impediment>;
    experiments: Array<Experiment>;
    updatedWipLimits: Record<string, number>;
    policyRecommendations: Array<PolicyRecommendation>;
  };

  // Improvement experiments
  improvements: Array<{
    id: string;
    hypothesis: string;
    change: string;
    measurement: string;
    successCriteria: string;
    duration: string;
  }>;

  // Artifacts
  artifacts: {
    boardSetup: string;
    finalBoard: string;
    metricsSummary: string;
    retrospective: string;
    cumulativeFlowDiagram: string;
  };
}
```

## Process Workflow

### Step 1: Visualize Workflow & Initialize Board

**Duration**: Initial setup session

- Design Kanban board layout with workflow stages
- Define column structure (queue vs active stages)
- Set WIP limits for active stages
- Establish board policies (Definition of Ready, Definition of Done)
- Configure swimlanes if needed
- Define card structure
- Set up initial backlog with prioritization
- Make workflow policies explicit

**Artifacts**:
- `artifacts/kanban/board-setup.md` - Board configuration
- `artifacts/kanban/board-setup.json` - Board data
- `artifacts/kanban/board-initial.svg` - Initial board visualization

### Step 2: Flow Management Cycles

**Duration**: Continuous (5-10 cycles in this process)

For each cycle:

#### WIP Limit Management
- Count current WIP in each active stage
- Compare against WIP limits
- Identify bottlenecks (stages consistently full)
- Signal stages with capacity
- Analyze blocked items
- Recommend WIP limit adjustments

#### Pull System
- Start from downstream (rightmost active stage)
- Pull work when capacity available (WIP < limit)
- Respect service class priorities
- Honor dependencies
- Check Definition of Ready
- Track all moves and reasons

#### Flow Metrics
- Calculate cycle time for completed items
- Calculate lead time
- Measure throughput
- Track WIP over time (CFD data)
- Identify aging work items
- Calculate percentiles (50th, 85th, 95th)
- Measure flow efficiency

**Artifacts**:
- `artifacts/kanban/cycle-{n}-summary.md` - Cycle summary
- `artifacts/kanban/board-cycle-{n}.svg` - Board state
- `artifacts/kanban/metrics-cycle-{n}.json` - Cycle metrics

### Step 3: Replenishment Meeting

**Duration**: Regular cadence (weekly or bi-weekly)

- Review current backlog items
- Consider system metrics (throughput, cycle time)
- Apply prioritization frameworks
- Assign service classes
- Calculate capacity-based commitment
- Move high-priority items to Ready queue
- Balance different types of work
- Document prioritization decisions

**Artifacts**:
- `artifacts/kanban/replenishment.md` - Replenishment report
- `artifacts/kanban/backlog-prioritization.json` - Prioritization data

### Step 4: Retrospective & Continuous Improvement

**Duration**: Regular cadence (monthly or quarterly)

- Review cumulative flow diagram
- Analyze cycle time trends
- Identify persistent bottlenecks
- Assess WIP limit effectiveness
- Evaluate flow efficiency
- Propose improvement experiments
- Design experiments with hypotheses and success criteria
- Recommend process policy updates

**Artifacts**:
- `artifacts/kanban/retrospective.md` - Retrospective report
- `artifacts/kanban/improvement-experiments.json` - Experiments
- `artifacts/kanban/cumulative-flow-diagram.svg` - CFD visualization

## Key Metrics

### Cycle Time

Time from when work starts (pulled into first active stage) until completion.

**Use**: Internal team metric for process efficiency.

**Target**: Minimize and stabilize.

### Lead Time

Time from when work is requested (enters backlog) until delivered to customer.

**Use**: Customer-facing metric for service level.

**Target**: Meet or exceed service level agreements (SLAs).

### Throughput

Number of work items completed per time period.

**Use**: Capacity planning and forecasting.

**Target**: Stable and predictable.

### WIP (Work in Progress)

Number of items currently being worked on.

**Use**: Control focus and identify bottlenecks.

**Target**: Below WIP limits, stable across cycles.

### Flow Efficiency

Percentage of time work is actively being worked on (vs waiting).

**Formula**: (Active time / Total time) × 100

**Typical Range**: 15-30% (knowledge work often has low flow efficiency)

**Target**: Increase over time through improvements.

### Cumulative Flow Diagram (CFD)

Stacked area chart showing WIP in each stage over time.

**Use**: Visual representation of flow health.

**Indicators**:
- **Smooth curves**: Healthy flow
- **Bulges**: Bottlenecks
- **Flat lines**: Starvation
- **Widening bands**: Increasing WIP (problem)

## Service Classes

### Expedite

- **Definition**: Critical issues requiring immediate attention
- **Policy**: Can break WIP limits (one at a time)
- **Examples**: Production outages, security vulnerabilities
- **Cost of Delay**: Extremely high

### Fixed Date

- **Definition**: Work with specific deadline commitments
- **Policy**: Time-boxed commitment, high priority
- **Examples**: Regulatory compliance, customer commitments
- **Cost of Delay**: High after deadline

### Standard

- **Definition**: Regular features and improvements
- **Policy**: Normal priority, respects WIP limits
- **Examples**: Feature development, enhancements
- **Cost of Delay**: Moderate and increasing

### Intangible

- **Definition**: Work without direct customer value
- **Policy**: Lower priority, fill capacity gaps
- **Examples**: Tech debt, refactoring, tooling
- **Cost of Delay**: Low but accumulating

## Examples

See the `examples/` directory for:
- `software-development.json` - Software development team
- `devops-team.json` - DevOps/SRE team managing deployments
- `support-team.json` - Customer support workflow
- `marketing-team.json` - Marketing content production
- `simple.json` - Basic Kanban setup

## Integration with Other Methodologies

### Kanban + Scrum (Scrumban)

Combine Scrum's structured planning with Kanban's flow:

```javascript
// Use Scrum for planning, Kanban for execution
// - Sprint planning determines scope
// - Kanban board manages daily work
// - WIP limits prevent overcommitment
// - Sprint review and retro remain
```

### Kanban + Spec-Kit

Use Spec-Kit for requirements, Kanban for delivery:

```javascript
// 1. Spec-Kit defines features
const specResult = await babysit({
  process: 'methodologies/spec-driven-development',
  inputs: { /* ... */ }
});

// 2. Kanban manages delivery flow
const kanbanResult = await babysit({
  process: 'methodologies/kanban',
  inputs: {
    projectName: 'Feature Delivery',
    initialBacklog: convertSpecsToBacklog(specResult.specifications)
  }
});
```

### Kanban + FDD

FDD features flow through Kanban board:

```javascript
// FDD provides feature breakdown
// Kanban provides delivery pipeline
// - Feature sets = Swimlanes
// - Features = Kanban cards
// - Parking lot shows macro progress
// - Kanban board shows micro flow
```

### Kanban + DevOps

Natural fit for continuous delivery:

- **Deployment Pipeline**: Workflow stages match pipeline stages
- **Infrastructure as Code**: Changes flow through Kanban
- **Incident Management**: Expedite class for production issues
- **Change Management**: WIP limits prevent overload

## Best Practices

### 1. Start with Current Process

Don't redesign your process upfront. Visualize what you do today, then evolve.

**Steps**:
1. Map current workflow stages
2. Add WIP limits gradually
3. Measure baseline metrics
4. Make small improvements

### 2. Set Conservative WIP Limits

Start with limits equal to or less than team size.

**Formula**: WIP Limit = Team Size × 0.5 to 1.0

**Examples**:
- Team of 6 → Start with WIP limit of 3-6
- Gradually reduce to expose bottlenecks

### 3. Pull from Right to Left

Always start pulling from downstream (rightmost) stages.

**Why**: Ensures work flows toward completion, prevents upstream bottlenecks.

### 4. Make Blockers Highly Visible

Use visual indicators (red borders, blocker tags) for blocked items.

**Daily Standup**: Start by reviewing all blockers.

### 5. Use Service Classes for Prioritization

Define clear policies for each service class.

**Example**:
- Expedite: Must complete within 24 hours
- Fixed Date: Deadline driven, pull 2 weeks before
- Standard: Pull based on priority score
- Intangible: Fill 20% of capacity

### 6. Focus on Flow, Not Utilization

High individual utilization often hurts flow.

**Anti-pattern**: Keeping everyone busy 100%
**Better**: Optimize for fast, smooth flow

### 7. Swarm on Blockers

When work is blocked, swarm to unblock it before starting new work.

**Why**: Reduces WIP, improves flow, prevents pileup.

### 8. Run Regular Replenishment

Schedule regular replenishment meetings (weekly or bi-weekly).

**Agenda**:
1. Review throughput/capacity
2. Prioritize backlog
3. Pull into Ready (capacity-based)
4. Discuss dependencies

### 9. Use CFD to Identify Problems

Review cumulative flow diagram regularly.

**Patterns to Watch**:
- Widening bands → Too much WIP
- Bulges → Bottlenecks
- Flat lines → Starvation

### 10. Run Small Experiments

Use scientific method for improvements.

**Format**:
- **Hypothesis**: "Reducing Dev WIP from 6 to 4 will decrease cycle time"
- **Change**: Lower WIP limit
- **Measurement**: Track cycle time for 2 weeks
- **Success Criteria**: 20% reduction in average cycle time

## Common Patterns

### Pattern: Swim Lanes

Organize board horizontally by type or team.

**Use Cases**:
- Different service classes
- Multiple teams sharing board
- Different work types (features vs bugs)

### Pattern: Class of Service Lanes

Separate lanes for each service class.

**Benefits**:
- Clear prioritization
- Separate WIP limits per class
- Visual load balancing

### Pattern: Definition of Ready/Done

Explicit checklists at stage boundaries.

**Definition of Ready** (before pulling into stage):
- Requirements clear
- Dependencies identified
- Estimated size
- Acceptance criteria defined

**Definition of Done** (before moving to next stage):
- All tests pass
- Code reviewed
- Documentation updated
- Stakeholder approved

### Pattern: Aging Work Items

Visual indicator for items in progress too long.

**Implementation**:
- Color dots: Green (< 5 days), Yellow (5-10 days), Red (> 10 days)
- Daily review of aging items
- Swarm to complete old work

## Troubleshooting

### Problem: Bottleneck at Specific Stage

**Symptoms**: Stage consistently at WIP limit, items pile up upstream.

**Solutions**:
- Analyze why work is slow in that stage
- Add capacity (people, automation)
- Break stage into substages
- Increase WIP limit temporarily (measure impact)
- Review Definition of Ready (is work prepared?)

### Problem: Low Flow Efficiency

**Symptoms**: Long cycle times, lots of waiting.

**Solutions**:
- Identify wait time causes
- Reduce batch sizes
- Improve handoffs
- Add automation
- Cross-train team members

### Problem: WIP Limits Always Violated

**Symptoms**: Team routinely exceeds WIP limits.

**Solutions**:
- Make limits more visible
- Discuss why limits are being broken
- Consider if limits are too restrictive
- Address root causes (blockers, external dependencies)
- Improve discipline (stop starting, start finishing)

### Problem: Uneven Flow

**Symptoms**: Bursty throughput, unpredictable cycle time.

**Solutions**:
- Smooth demand (regular replenishment)
- Standardize work items (size similarly)
- Address capacity variations
- Buffer against variability (slack time)

### Problem: Team Resists WIP Limits

**Symptoms**: Team doesn't understand value of limits.

**Solutions**:
- Educate on flow theory
- Show data (correlation between high WIP and long cycle times)
- Start with generous limits, reduce gradually
- Celebrate improvements
- Make problems visible (CFD)

## Comparison with Other Methodologies

| Aspect | Kanban | Scrum | XP | Waterfall |
|--------|--------|-------|-----|-----------|
| **Iteration** | Continuous flow | Fixed sprints | 1-2 week iterations | Phases |
| **Planning** | On-demand (replenishment) | Sprint planning | Iteration planning | Upfront |
| **Change** | Anytime | Between sprints | Between iterations | Difficult |
| **Roles** | Flexible | Prescribed (SM, PO, Dev) | Prescribed (Coach, pairs) | Prescribed |
| **Estimation** | Optional | Required (points) | Required (stories) | Detailed |
| **Metrics** | Cycle time, throughput | Velocity, burndown | Velocity | Milestones |
| **WIP** | Limited | Implicit (sprint scope) | Implicit | Unlimited |
| **Best For** | Continuous delivery | Predictable teams | Technical excellence | Fixed scope |

## References

### Official Resources
- [Kanban University](https://kanban.university/)
- [David J. Anderson's Blog](https://djaa.com/)
- [Essential Kanban Condensed](https://kanban.university/kanban-guide/)

### Articles & Guides
- [Kanban Method Overview](https://kanbantool.com/kanban-method)
- [Atlassian: WIP Limits](https://www.atlassian.com/agile/kanban/wip-limits)
- [Business Map: Kanban Pull Systems](https://businessmap.io/kanban-resources/getting-started/pull-systems)
- [Kanban vs Scrum](https://www.atlassian.com/agile/kanban/kanban-vs-scrum)

### Books
- **"Kanban: Successful Evolutionary Change for Your Technology Business"** by David J. Anderson - The definitive guide
- **"The Kanban Guide"** by David J. Anderson & Andy Carmichael - Concise overview
- **"Kanban from the Inside"** by Mike Burrows - Understanding Kanban values
- **"Actionable Agile Metrics for Predictability"** by Daniel Vacanti - Flow metrics deep dive

### Academic Papers
- Anderson, D. J. (2010). "Kanban: Successful Evolutionary Change for Your Technology Business"
- Vacanti, D. (2015). "Actionable Agile Metrics for Predictability"

## License

This methodology implementation is part of the Babysitter SDK and follows the same license terms.

## Contributing

To improve this Kanban implementation:
1. Review the backlog in `methodologies/backlog.md`
2. Propose enhancements via issues
3. Submit pull requests with improvements
4. Share real-world usage experiences

---

**Implementation Status**: ✅ Implemented
**Last Updated**: 2026-01-23
**Version**: 1.0.0
