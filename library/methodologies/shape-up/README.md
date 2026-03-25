# Shape Up

## Overview

Shape Up is Basecamp's methodology for building products through fixed-time, variable-scope cycles. Created by Ryan Singer and popularized through the free online book, Shape Up emphasizes appetite-driven development, thoughtful upfront shaping, strategic betting, and autonomous team execution with visual progress tracking.

**Creator**: Ryan Singer / Basecamp
**Year**: 2019
**Book**: [Shape Up: Stop Running in Circles and Ship Work that Matters](https://basecamp.com/shapeup) (free online)

### Core Philosophy

- **Fixed time, variable scope**: 6-week cycles (or 2-week small batches) with no extensions
- **Appetite not estimates**: Define how much time you want to spend, not how long it will take
- **Shaping before betting**: Abstract design work happens before committing resources
- **Betting table**: Senior team explicitly decides what to build
- **Autonomous teams**: Small teams (designer + 1-2 programmers) work independently
- **Hill charts**: Visual progress tracking showing figuring-out vs. executing
- **Circuit breaker**: If work isn't done in 6 weeks, it doesn't get extended automatically
- **No backlogs**: Work that doesn't get chosen is discarded

## Key Principles

### 1. Appetite-Driven Development
Instead of asking "how long will this take?", ask "how much time do we want to spend on this?"
- **Small batch**: 1-2 weeks (one designer + one programmer)
- **Big batch**: 6 weeks (one designer + two programmers)

### 2. Shaping
Abstract design work at the right level of detail:
- **Breadboarding**: Flow and affordances without visual design
- **Fat marker sketches**: Rough UI concepts that leave room for creativity
- **Rabbit holes**: Explicitly call out risks and time traps
- **No-gos**: Things we explicitly won't do

### 3. Betting
Every 6 weeks, senior team meets at the "betting table":
- Reviews shaped pitches
- Decides what gets resources
- No backlog maintenance
- Work either gets bet on or discarded

### 4. Building
Autonomous teams with freedom to solve problems:
- Get oriented and understand the terrain
- Map work into scopes (integrated slices)
- Track progress on hill charts
- Integrate QA throughout
- Ship or stop at end of cycle (circuit breaker)

### 5. Cool-Down
2-week breaks between cycles:
- Fix bugs
- Pay down technical debt
- Explore new ideas
- Rest and recharge
- No structured project work

## Methodology

### Phase 1: Shaping (Pre-Cycle)

Senior product people shape work before it goes to betting:

1. **Set Boundaries** - Define appetite and constraints
2. **Rough Out Elements** - Create breadboard showing places, affordances, connections
3. **Address Risks** - Identify rabbit holes and define no-gos
4. **Write Pitch** - Formal document for betting table

**Time**: Days to weeks of deliberate shaping work
**Output**: Pitch document with problem, solution, appetite, risks

### Phase 2: Betting (Between Cycles)

Senior team decides what to build:

1. **Review Pitches** - Evaluate shaped work
2. **Assess Capacity** - Check team availability
3. **Make Bets** - Explicitly commit resources
4. **Create Cycle Plan** - Set up team and logistics

**Time**: 1-2 hour meeting every 6 weeks
**Output**: Bets placed, teams assigned, cycle started

### Phase 3: Building (6-Week Cycle)

Autonomous team builds the shaped work:

1. **Get Oriented** (Week 1) - Understand the terrain, explore codebase
2. **Map Scopes** (Week 1-2) - Break work into integrated slices
3. **Execute** (Week 1-6) - Build scopes, move them on hill chart
4. **Track Progress** - Weekly check-ins with hill charts
5. **Integrate QA** (Throughout) - Test and validate continuously
6. **Circuit Breaker** (Week 6) - Ship, cut scope, or stop

**Time**: 6 weeks (or 2 weeks for small batch)
**Output**: Shipped feature or clear decision to stop

### Phase 4: Cool-Down (2 Weeks)

Team breaks between cycles:

1. **Fix Bugs** - Address issues from recent cycle
2. **Tech Debt** - Refactor and clean up
3. **Explore** - Investigate new ideas
4. **Rest** - Recharge for next cycle

**Time**: 2 weeks
**Output**: Cleaned up codebase, explored ideas, rested team

## Process Workflow

```
Shaping (ongoing)
  → Define appetite
  → Breadboard solution
  → Identify rabbit holes
  → Fat marker sketches
  → Write pitch
     ↓
[Review Pitch]
     ↓
Betting Table (every 6 weeks)
  → Evaluate pitches
  → Assess capacity
  → Place bets
  → Assign teams
     ↓
[Bet Placed]
     ↓
Building (6 weeks)
  → Get oriented (Week 1)
  → Map scopes (Week 1-2)
  → Execute cycle (Week 1-6)
  → Track hill charts (Weekly)
  → QA integration (Throughout)
  → Circuit breaker (Week 6)
     ↓
[Ship or Stop]
     ↓
Cool-Down (2 weeks)
  → Fix bugs
  → Tech debt
  → Explore ideas
  → Retrospective
```

## Usage

### Full Cycle

Run complete Shape Up cycle from shaping through cool-down:

```javascript
import { runProcess } from '@a5c-ai/babysitter-sdk';

const result = await runProcess('methodologies/shape-up', {
  projectName: 'Acme CRM',
  workDescription: 'Add ability to bulk edit customer records',
  appetite: 'big-batch',
  cycleWeeks: 6,
  teamSize: 'one-designer-two-programmers',
  phase: 'full-cycle',
  includeCoolDown: true
});
```

### Shaping Only

Shape work to create a pitch:

```javascript
const shapingResult = await runProcess('methodologies/shape-up', {
  projectName: 'Acme CRM',
  workDescription: 'Add ability to bulk edit customer records',
  appetite: 'big-batch',
  phase: 'shaping'
});

// Use shapingResult.pitch for betting table
```

### Betting Only

Evaluate an existing pitch:

```javascript
const bettingResult = await runProcess('methodologies/shape-up', {
  projectName: 'Acme CRM',
  workDescription: 'Add ability to bulk edit customer records',
  existingPitch: previousPitch,
  competingPitches: [pitch1, pitch2, pitch3],
  teamCapacity: {
    availableTeams: 2,
    teamComposition: 'one-designer-two-programmers',
    currentCommitments: ['Cycle 5 project']
  },
  phase: 'betting'
});
```

### Building Only

Execute a cycle with an existing pitch:

```javascript
const buildingResult = await runProcess('methodologies/shape-up', {
  projectName: 'Acme CRM',
  workDescription: 'Add ability to bulk edit customer records',
  existingPitch: approvedPitch,
  cycleWeeks: 6,
  teamSize: 'one-designer-two-programmers',
  phase: 'building'
});
```

### Small Batch (2 Weeks)

```javascript
const smallBatch = await runProcess('methodologies/shape-up', {
  projectName: 'Acme CRM',
  workDescription: 'Fix PDF export formatting issues',
  appetite: 'small-batch',
  cycleWeeks: 2,
  teamSize: 'one-designer-one-programmer',
  phase: 'full-cycle'
});
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Project name |
| `workDescription` | string | Yes | - | Description of work to shape/build |
| `appetite` | string | No | `'big-batch'` | Time appetite: `'small-batch'` (1-2 weeks) or `'big-batch'` (6 weeks) |
| `cycleWeeks` | number | No | `6` | Cycle length in weeks |
| `teamSize` | string | No | `'one-designer-two-programmers'` | Team composition |
| `phase` | string | No | `'full-cycle'` | Which phase to run: `'shaping'`, `'betting'`, `'building'`, `'cool-down'`, `'full-cycle'` |
| `existingPitch` | object | No | `null` | Existing pitch document (for betting/building) |
| `competingPitches` | array | No | `[]` | Other pitches competing for resources |
| `teamCapacity` | object | No | `null` | Team capacity and availability |
| `includeCoolDown` | boolean | No | `true` | Include cool-down phase |
| `cycleStartDate` | string | No | Current date | ISO date string for cycle start |

## Output Structure

```javascript
{
  success: boolean,
  projectName: string,
  workDescription: string,
  appetite: string,
  phase: string,

  // Shaping outputs
  appetiteDefinition: {
    appetite: string,
    timeEstimate: string,
    problemStatement: string,
    boundaries: { mustHave, niceToHave, notNow },
    inScope: [],
    outOfScope: [],
    successCriteria: []
  },
  breadboard: {
    places: [{ id, name, description, type }],
    affordances: [{ id, name, placeId, type, description }],
    connections: [{ from, to, affordance, description }],
    flow: { entryPoint, mainPath, alternatePaths, exitPoints }
  },
  rabbitHoles: {
    rabbitHoles: [{ id, area, description, severity, deRiskingStrategy }],
    noGos: [{ id, feature, rationale }],
    risks: [{ id, category, description, impact, likelihood }],
    mitigation: [{ riskId, strategy, owner }]
  },
  sketches: {
    sketches: [{ id, placeId, title, description, elements }],
    keyElements: [{ element, purpose, behavior }],
    annotations: []
  },
  pitch: {
    pitchMarkdown: string,
    summary: string,
    problem: { statement, whyNow, impact },
    solution: { overview, approach, keyElements },
    appetite: { type, duration, teamSize },
    rabbitHoles: [],
    noGos: []
  },

  // Betting outputs
  bettingEvaluation: {
    recommendation: 'bet' | 'pass' | 'needs-more-shaping',
    score: number,
    rationale: string,
    keyFactors: [{ factor, assessment, weight }],
    strengths: [],
    concerns: [],
    capacityAssessment: { teamAvailable, timing, conflicts }
  },
  cyclePlan: {
    timeline: { startDate, endDate, weeks, checkInDays },
    team: { designer, programmers, qa, size },
    milestones: [{ week, description, deliverable }],
    successCriteria: []
  },

  // Building outputs
  orientation: {
    orientationSummary: string,
    startingPoints: [],
    codebaseAreas: [{ area, familiarity, complexity }],
    unknowns: [],
    initialTasks: [{ task, type, assignee }]
  },
  scopeMap: {
    scopes: [{ id, name, description, priority, complexity, estimatedWeeks }],
    dependencies: [{ scopeId, dependsOn, type }],
    scopeMap: { totalScopes, mustHaveScopes, criticalPath }
  },
  cycleExecution: {
    executionSummary: string,
    scopeProgress: [{ scopeId, status, weekCompleted, surprises }],
    challenges: [{ scopeId, challenge, resolution, impactWeeks }]
  },
  hillChartHistory: [{
    week: number,
    scopePositions: [{ scopeId, position, phase, movement, notes }],
    uphill: [],
    downhill: [],
    completed: [],
    stuckScopes: [{ scopeId, reason, intervention }],
    riskLevel: string
  }],
  qaAndIntegration: {
    testResults: [{ scopeId, testsPassed, testsFailed, coverage }],
    bugs: [{ id, severity, scopeId, description, mustFixForShip }],
    passed: boolean,
    shipReadiness: { recommendation, rationale, blockingIssues }
  },
  circuitBreaker: {
    status: 'complete' | 'incomplete' | 'partial',
    decision: 'ship' | 'cut-scope-and-ship' | 'stop',
    completed: [],
    incomplete: [],
    rationale: string,
    learnings: [{ learning, category }],
    appetiteAssessment: { wasAccurate, shouldHaveBeen, notes }
  },

  // Cool-down outputs
  coolDown: {
    duration: string,
    activities: [{ type, description, assignee, completed }],
    retrospective: { wentWell, wentPoorly, learnings, actionItems },
    explorations: [{ idea, findings, potentialPitch }]
  },

  // Summary
  summary: {
    phase: string,
    appetite: string,
    cycleWeeks: number,
    pitched: boolean,
    betPlaced: boolean,
    scopeCount: number,
    completionRate: string,
    shipped: boolean,
    coolDownIncluded: boolean
  },

  artifacts: {
    shaping: 'artifacts/shape-up/shaping/',
    betting: 'artifacts/shape-up/betting/',
    building: 'artifacts/shape-up/building/',
    coolDown: 'artifacts/shape-up/cool-down/'
  }
}
```

## Examples

### Example 1: Customer Bulk Edit Feature

**Context**: Established SaaS product needs ability to edit multiple customer records at once.

```javascript
const result = await runProcess('methodologies/shape-up', {
  projectName: 'Acme CRM',
  workDescription: 'Add ability to select multiple customers and edit common fields in bulk',
  appetite: 'big-batch',
  cycleWeeks: 6,
  teamSize: 'one-designer-two-programmers',
  phase: 'full-cycle'
});
```

**Shaping Output**:
- **Problem**: Sales team wastes hours editing customers one-by-one when updating territories
- **Appetite**: 6 weeks (big batch)
- **Solution**: Selection UI + bulk edit dialog
- **Rabbit Holes**: Complex field validation, undo/redo, conflict resolution
- **No-Gos**: Bulk create, advanced filtering, scheduled edits

**Betting Output**:
- **Score**: 85/100
- **Decision**: Bet placed
- **Strengths**: Clear value, well-shaped, fits appetite
- **Concerns**: Integration with permissions system

**Building Output**:
- **Scopes**:
  1. Selection mechanism (Week 1-2)
  2. Bulk edit dialog (Week 2-3)
  3. Field validation (Week 3-4)
  4. Permission checks (Week 4-5)
  5. Error handling (Week 5-6)
- **Completion**: 5/5 scopes shipped
- **Circuit Breaker**: Ship

### Example 2: Mobile App Notifications

**Context**: New mobile app needs push notification system.

```javascript
const result = await runProcess('methodologies/shape-up', {
  projectName: 'FitTracker Mobile',
  workDescription: 'Add push notifications for daily goals and achievements',
  appetite: 'big-batch',
  cycleWeeks: 6,
  teamSize: 'one-designer-two-programmers',
  phase: 'full-cycle'
});
```

**Shaping Output**:
- **Problem**: Users forget to log workouts; need timely reminders
- **Appetite**: 6 weeks
- **Solution**: Daily goal reminders + achievement celebrations
- **Rabbit Holes**: Notification scheduling, time zones, notification grouping
- **No-Gos**: Custom schedules, rich notifications with images, notification history

**Building Output**:
- **Scopes**:
  1. Push notification infrastructure (Week 1-2)
  2. Daily goal reminders (Week 2-3)
  3. Achievement notifications (Week 3-4)
  4. User preferences (Week 4-5)
  5. Testing and polish (Week 5-6)
- **Hill Chart Week 4**: 2 scopes uphill (preferences, testing), 3 downhill
- **Circuit Breaker**: Ship with known limitation (no custom schedules)

### Example 3: Small Batch Bug Fix

**Context**: PDF export has formatting issues that frustrate users.

```javascript
const result = await runProcess('methodologies/shape-up', {
  projectName: 'DocGen Pro',
  workDescription: 'Fix PDF export formatting issues with tables and images',
  appetite: 'small-batch',
  cycleWeeks: 2,
  teamSize: 'one-designer-one-programmer',
  phase: 'full-cycle'
});
```

**Shaping Output**:
- **Problem**: Tables break across pages poorly, images distorted
- **Appetite**: 2 weeks (small batch)
- **Solution**: Improved pagination logic + image scaling
- **Rabbit Holes**: Complex nested tables, SVG rendering
- **No-Gos**: Full table redesign, new export formats

**Building Output**:
- **Scopes**:
  1. Table pagination (Week 1)
  2. Image scaling (Week 1-2)
- **Completion**: 2/2 scopes shipped
- **Circuit Breaker**: Ship

### Example 4: Bet Not Placed

**Context**: Pitch evaluated but not selected.

```javascript
const result = await runProcess('methodologies/shape-up', {
  projectName: 'TeamHub',
  workDescription: 'Add advanced analytics dashboard with custom reports',
  appetite: 'big-batch',
  phase: 'shaping'
});

// Later at betting table
const betting = await runProcess('methodologies/shape-up', {
  projectName: 'TeamHub',
  workDescription: 'Add advanced analytics dashboard with custom reports',
  existingPitch: result.pitch,
  competingPitches: [urgentSecurityPatch, requestedIntegration],
  phase: 'betting'
});

// Result: Pass - security and integration higher priority
```

**Betting Output**:
- **Score**: 72/100
- **Decision**: Pass
- **Rationale**: Nice to have but security patch and integration higher priority
- **Future**: May reshape with smaller appetite for future cycle

## Hill Charts Explained

The hill chart is Shape Up's signature progress visualization:

### Hill Metaphor

```
        /\
       /  \
      /    \
     /      \
    /        \
   /          \
  /            \
 /______________\
Left   Top   Right
```

- **Left side (Uphill)**: Figuring things out, solving unknowns, exploration
- **Top of hill**: Transition - unknowns resolved, approach clear
- **Right side (Downhill)**: Executing known solution, building it out
- **Far right**: Complete

### Scope Movement

- **Forward**: Scope making progress
- **Stuck**: No movement for 1+ weeks, needs intervention
- **Backward**: Discovered new unknowns, moved left on hill

### Risk Assessment

- **Low risk**: Most scopes downhill, nearing completion
- **Medium risk**: Mix of uphill and downhill, some stuck
- **High risk**: Many scopes uphill late in cycle, multiple stuck

### Example Hill Chart (Week 4 of 6)

```
Scope Positions:
- Selection UI: Position 75 (downhill) - executing known solution
- Bulk edit dialog: Position 85 (downhill) - nearly complete
- Field validation: Position 50 (top) - just figured out approach
- Permission checks: Position 30 (uphill) - still figuring out
- Error handling: Position 10 (uphill) - early exploration

Risk: Medium (permissions scope needs attention)
```

## Integration Points

### With BDD/Specification by Example

Use BDD to specify acceptance criteria during shaping:

```javascript
// Shape the work
const pitch = await runProcess('methodologies/shape-up', {
  workDescription: 'Bulk customer edit',
  phase: 'shaping'
});

// Create BDD scenarios for shaped scopes
const bdd = await runProcess('methodologies/bdd-specification-by-example', {
  feature: pitch.pitch.solution.overview,
  stakeholders: ['Product', 'Dev', 'QA']
});
```

### With Domain-Driven Design

Use DDD strategic patterns during shaping:

```javascript
// Understand domain during shaping
const ddd = await runProcess('methodologies/domain-driven-design', {
  phase: 'strategic'
});

// Use bounded contexts and aggregates in breadboard
const pitch = await runProcess('methodologies/shape-up', {
  workDescription: 'Order fulfillment workflow',
  phase: 'shaping'
});
```

### With ATDD/TDD

Use shaped work to drive test-driven development:

```javascript
// Build cycle with TDD
const cycle = await runProcess('methodologies/shape-up', {
  existingPitch: approvedPitch,
  phase: 'building'
});

// Implement each scope test-first
for (const scope of cycle.scopeMap.scopes) {
  await runProcess('methodologies/atdd', {
    acceptanceCriteria: scope.description
  });
}
```

## Best Practices

### Shaping

1. **Set clear appetite first** - Constraint drives creative solutions
2. **Stay at right level of abstraction** - Not too specific, not too vague
3. **Call out rabbit holes explicitly** - Help team avoid time traps
4. **Define no-gos clearly** - Prevent scope creep
5. **Make it a pitch, not a spec** - Leave room for team creativity
6. **Get design at room temperature** - Warm enough to evaluate, cool enough to be flexible
7. **Breadboard before visual design** - Focus on flow and functionality first

### Betting

1. **Bet consciously** - Every bet is an opportunity cost
2. **Don't maintain backlogs** - Old ideas get stale; reshape if still relevant
3. **Allow uninterrupted time** - Give teams full 6 weeks without interruptions
4. **Respect the circuit breaker** - No automatic extensions
5. **Bet on problems, not solutions** - Teams might find better approaches
6. **Consider team composition** - Match complexity to team experience
7. **Time box the meeting** - Betting table shouldn't take more than 2 hours

### Building

1. **Get oriented first** - Understand terrain before diving in
2. **Map scopes thoughtfully** - Each scope should be shippable slice
3. **Update hill charts honestly** - Don't hide stuck work
4. **Integrate QA throughout** - Don't leave testing until end
5. **Cut scope if needed** - Preserve core value, drop nice-to-haves
6. **Respect the cycle** - Don't extend automatically
7. **Communicate through hill charts** - Visual updates beat status reports

### Cool-Down

1. **Actually rest** - Don't pack cool-down with structured work
2. **Fix annoying bugs** - Address technical debt
3. **Explore freely** - Investigation might lead to future pitches
4. **Reflect on cycle** - What went well? What to improve?
5. **Don't commit to deliverables** - Cool-down is unstructured time
6. **Recharge for next cycle** - Team needs breaks between intense cycles

## Common Patterns

### Appetite-First Design

Always start with appetite, then fit solution:

```javascript
// Wrong: "How long will bulk edit take?"
// Right: "We'll spend 6 weeks on bulk edit. What can we build?"

const result = await runProcess('methodologies/shape-up', {
  workDescription: 'Bulk edit capability',
  appetite: 'big-batch', // Set constraint first
  phase: 'shaping'
});
```

### Graduated Commitment

Start small, expand if valuable:

```javascript
// Cycle 1: Basic bulk edit (6 weeks)
const basic = await runProcess('methodologies/shape-up', {
  workDescription: 'Basic bulk edit for common fields',
  appetite: 'big-batch'
});

// Later cycle if successful: Advanced features
const advanced = await runProcess('methodologies/shape-up', {
  workDescription: 'Advanced bulk edit with formulas and validations',
  appetite: 'big-batch'
});
```

### Circuit Breaker in Action

Don't extend cycles:

```javascript
// Cycle ends, work incomplete
if (result.circuitBreaker.status === 'incomplete') {
  // Option 1: Ship partial work
  // Option 2: Discard and reshape for future bet
  // Option 3: Cut scope and ship core

  // Never: Extend the cycle
}
```

## Troubleshooting

### Problem: Work doesn't fit appetite

**Solution**: Shape more aggressively
- Define more no-gos
- Simplify solution
- Consider smaller appetite
- Break into multiple pitches

### Problem: Scopes stuck uphill late in cycle

**Solution**: Intervene early
- Pair with experienced developer
- Simplify the scope
- Cut scope if not must-have
- Surface blockers to leadership

### Problem: Too many competing pitches

**Solution**: Be ruthless at betting table
- Focus on strategic priorities
- Consider if pitch really needs 6 weeks
- Reshape as small batch
- Pass and discard old ideas

### Problem: Team extends cycle

**Solution**: Enforce circuit breaker
- Ship what's done
- Reshape for future bet
- Learn from appetite mismatch
- Don't reward extensions

### Problem: Shaping too specific or too vague

**Solution**: Find room temperature
- Too hot: Remove implementation details
- Too cold: Add concrete examples
- Just right: Can see it works, room for creativity

## Artifacts Generated

### Shaping Phase
- `artifacts/shape-up/shaping/pitch.md` - Complete pitch document
- `artifacts/shape-up/shaping/breadboard.md` - Flow and affordances
- `artifacts/shape-up/shaping/sketches.md` - Fat marker sketches
- `artifacts/shape-up/shaping/rabbit-holes.json` - Risks and no-gos

### Betting Phase
- `artifacts/shape-up/betting/evaluation.md` - Betting table assessment
- `artifacts/shape-up/betting/comparison.md` - Competing pitches comparison
- `artifacts/shape-up/betting/cycle-plan.json` - Execution plan

### Building Phase
- `artifacts/shape-up/building/scope-map.md` - Scope breakdown
- `artifacts/shape-up/building/scope-diagram.md` - Scope dependencies
- `artifacts/shape-up/building/hill-chart-week-N.md` - Weekly hill charts
- `artifacts/shape-up/building/progress-week-N.json` - Progress data
- `artifacts/shape-up/building/final-hill-chart.md` - End of cycle chart
- `artifacts/shape-up/building/circuit-breaker.md` - Ship/stop decision
- `artifacts/shape-up/building/qa-report.md` - QA results

### Cool-Down Phase
- `artifacts/shape-up/cool-down/activities.md` - Cool-down work
- `artifacts/shape-up/cool-down/cycle-retrospective.md` - Learnings

## References

### Official Resources

- **[Shape Up Book](https://basecamp.com/shapeup)** - Complete methodology (free online)
- **[Basecamp Blog](https://basecamp.com/articles)** - Articles about Shape Up in practice
- **[Ryan Singer on Twitter](https://twitter.com/rjs)** - Ongoing insights

### Key Chapters

1. **Introduction** - Philosophy and principles
2. **Shaping** - Breadboarding, fat marker sketches, pitches
3. **Betting** - The betting table, capacity, saying no
4. **Building** - Getting oriented, scopes, hill charts
5. **Conclusion** - Circuit breaker, cool-down, cycles

### Tools

- **[Basecamp](https://basecamp.com/)** - Built using Shape Up methodology
- **[Hill Charts in Basecamp](https://basecamp.com/features/hill-charts)** - Official implementation
- **[ShapeUp.how](https://shapeup.how/)** - Community resources (if available)

### Articles

- [Introducing Hill Charts](https://basecamp.com/articles/hill-charts) - Progress visualization
- [No Deadlines](https://basecamp.com/articles/no-deadlines) - Fixed time approach
- [The Betting Table](https://basecamp.com/articles/betting-table) - How Basecamp decides what to build

### Comparisons

- **vs. Scrum**: Fixed time (not fixed scope), 6 weeks (not 2), no daily standups
- **vs. Kanban**: Batched work (not continuous flow), clear cycles (not continuous)
- **vs. Waterfall**: Small cycles (not big bang), variable scope (not fixed scope)
- **vs. Feature-Driven Development**: Appetite-driven (not feature-driven), betting (not backlog)

## Real-World Adoption

Shape Up works well for:

- **Product teams** building software products
- **Small to medium teams** (not ideal for very large orgs)
- **Established products** with ongoing development
- **Teams with experienced shapers** who can abstract well
- **Organizations** that can commit to uninterrupted time

Shape Up may not fit:

- **Client services** with fixed-scope contracts
- **Regulated industries** with extensive documentation requirements
- **Very large organizations** with many dependencies
- **Teams without senior designers/shapers**
- **Projects with immovable deadlines**

## License

Part of the Babysitter SDK orchestration framework.

Shape Up methodology is by Basecamp (Ryan Singer). The methodology is freely available through their online book.
