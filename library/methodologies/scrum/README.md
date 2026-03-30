# Scrum

**Creators**: Ken Schwaber and Jeff Sutherland
**Year**: 1995 (dominant since 2001)
**Category**: Agile Sprint-Based Framework
**Priority**: Medium

## Overview

Scrum is a lightweight agile framework for developing, delivering, and sustaining complex products through iterative progress via sprints. It is the most widely adopted agile framework worldwide, used by organizations from startups to Fortune 500 companies.

Scrum emphasizes empirical process control (empiricism) with three pillars:
- **Transparency**: Significant aspects of the process must be visible
- **Inspection**: Regular inspection of artifacts and progress toward goals
- **Adaptation**: Adjustment of process when inspection reveals unacceptable deviation

Scrum is particularly well-suited for:
- **Complex adaptive problems** where requirements emerge and evolve
- **Product development** requiring frequent feedback and adaptation
- **Cross-functional teams** (3-9 people) with all necessary skills
- **Organizations seeking agility** and rapid response to change
- **Projects with high uncertainty** where waterfall approaches fail

## Key Principles

### Three Roles

1. **Product Owner**
   - Maximizes value of product and work of Development Team
   - Manages and prioritizes Product Backlog
   - Ensures backlog is visible, transparent, and understood
   - Makes final decisions on priorities
   - Single person (not committee)

2. **Scrum Master**
   - Servant-leader for Scrum Team
   - Ensures Scrum is understood and enacted
   - Facilitates Scrum events as needed
   - Removes impediments blocking the team
   - Shields team from external interference
   - Coaches team on self-organization

3. **Development Team**
   - Professionals who deliver potentially releasable Increment
   - Self-organizing (chooses how to do work)
   - Cross-functional (all skills needed to create Increment)
   - 3-9 members optimal (small enough to be nimble, large enough to complete work)
   - No sub-teams or titles (everyone is "Developer")
   - Collectively accountable

### Five Events

All events are time-boxed to minimize waste and maximize value:

1. **Sprint** (1-4 weeks, commonly 2 weeks)
   - Container for all other events
   - Fixed length throughout development
   - No changes that endanger Sprint Goal
   - New Sprint starts immediately after previous

2. **Sprint Planning** (max 8 hours for 1-month sprint)
   - What can be done this Sprint?
   - How will the chosen work get done?
   - Creates Sprint Goal and Sprint Backlog
   - Whole team collaborates

3. **Daily Scrum** (15 minutes)
   - Daily inspection and adaptation
   - Three questions: What did I do? What will I do? Any impediments?
   - Synchronize activities and plan next 24 hours
   - Development Team only (others may observe)

4. **Sprint Review** (max 4 hours for 1-month sprint)
   - Inspect Increment with stakeholders
   - Demo completed work
   - Gather feedback
   - Adapt Product Backlog
   - Collaborative working session

5. **Sprint Retrospective** (max 3 hours for 1-month sprint)
   - Inspect how Sprint went regarding people, relationships, process, tools
   - What went well? What to improve?
   - Create improvement plan
   - Occurs after Sprint Review, before next Sprint Planning

### Three Artifacts

1. **Product Backlog**
   - Ordered list of everything needed in product
   - Single source of requirements
   - Never complete (evolves as product and environment evolve)
   - Product Owner responsible for content, availability, ordering

2. **Sprint Backlog**
   - Product Backlog Items selected for Sprint
   - Plus plan for delivering them
   - Forecast by Development Team
   - Real-time picture of work planned for Sprint

3. **Increment**
   - Sum of all Product Backlog Items completed during Sprint
   - Must meet Definition of Done
   - Must be in usable condition (potentially shippable)
   - Step toward vision or goal

## Usage

### Basic Usage

```javascript
import { babysit } from '@a5c-ai/babysitter-sdk';

const result = await babysit({
  process: 'methodologies/scrum',
  inputs: {
    projectName: 'Mobile Banking App',
    productVision: 'Secure, user-friendly mobile banking with account management, transfers, and bill pay',
    sprintDuration: 2,      // 2-week sprints
    sprintCount: 6,         // Plan 6 sprints (3 months)
    teamSize: 7
  }
});
```

### With Pre-Defined Product Backlog

```javascript
const result = await babysit({
  process: 'methodologies/scrum',
  inputs: {
    projectName: 'E-Commerce Platform',
    productVision: 'Online retail platform with shopping cart, payment, and order tracking',
    sprintDuration: 2,
    sprintCount: 8,
    teamSize: 9,
    backlogItems: [
      {
        id: 'PBI-001',
        title: 'User Registration',
        userStory: 'As a customer, I want to register an account, so that I can save my preferences',
        acceptanceCriteria: [
          'Email validation',
          'Password strength requirements',
          'Email confirmation sent'
        ],
        storyPoints: 5,
        priority: 'must-have',
        type: 'feature'
      },
      {
        id: 'PBI-002',
        title: 'Shopping Cart',
        userStory: 'As a customer, I want to add items to cart, so that I can purchase multiple items',
        acceptanceCriteria: [
          'Add/remove items',
          'Update quantities',
          'Show total price'
        ],
        storyPoints: 8,
        priority: 'must-have',
        type: 'feature'
      }
    ]
  }
});
```

### With Custom Definition of Done

```javascript
const result = await babysit({
  process: 'methodologies/scrum',
  inputs: {
    projectName: 'Healthcare Portal',
    productVision: 'Patient portal for appointments, records, and communication',
    sprintDuration: 3,
    sprintCount: 4,
    teamSize: 6,
    definitionOfDone: {
      criteria: [
        {
          category: 'Code Quality',
          requirements: [
            'Code reviewed by at least 2 team members',
            'Unit test coverage >= 80%',
            'No critical security vulnerabilities',
            'Meets HIPAA compliance requirements'
          ]
        },
        {
          category: 'Testing',
          requirements: [
            'All acceptance criteria met',
            'Integration tests pass',
            'UAT completed by Product Owner',
            'Accessibility standards met (WCAG 2.1 AA)'
          ]
        },
        {
          category: 'Documentation',
          requirements: [
            'API documentation updated',
            'User documentation updated',
            'Release notes drafted'
          ]
        }
      ]
    },
    productOwner: 'Jane Smith',
    scrumMaster: 'John Doe'
  }
});
```

## Input Schema

```typescript
interface ScrumInputs {
  // Required
  projectName: string;              // Project/product name
  productVision: string;            // High-level product vision and goals

  // Optional
  sprintDuration?: number;          // Sprint length in weeks (default: 2, recommended: 1-4)
  sprintCount?: number;             // Number of sprints to plan (default: 6)
  teamSize?: number;                // Development Team size (default: 7, recommended: 3-9)
  backlogItems?: Array<PBI>;        // Pre-defined Product Backlog Items (optional)
  productOwner?: string;            // Product Owner name (default: 'Product Owner')
  scrumMaster?: string;             // Scrum Master name (default: 'Scrum Master')
  definitionOfDone?: Object;        // Custom Definition of Done criteria (optional)
}

interface PBI {
  id: string;
  title: string;
  userStory: string;                // "As a [role], I want [feature], so that [benefit]"
  acceptanceCriteria: string[];
  storyPoints: number;              // Fibonacci: 1, 2, 3, 5, 8, 13, 21
  priority: 'must-have' | 'should-have' | 'could-have' | 'won\'t-have';
  type: 'feature' | 'technical' | 'bug' | 'research';
  businessValue?: number;
  dependencies?: string[];
}
```

## Output Schema

```typescript
interface ScrumOutput {
  success: boolean;
  projectName: string;
  productVision: string;

  // Product Backlog
  productBacklog: {
    initial: {
      items: PBI[];
      totalItems: number;
      totalStoryPoints: number;
      epics: Array<{ name: string; pbiIds: string[] }>;
    };
    final: PBI[];  // Remaining after sprints
  };

  // Definition of Done
  definitionOfDone: {
    criteria: Array<{
      category: string;
      requirements: string[];
    }>;
    checklist: string[];
    rationale: string;
  };

  // Sprints
  sprints: Array<{
    sprintNumber: number;
    sprintGoal: string;
    startDate: string;
    endDate: string;
    duration: number;
    sprintBacklog: PBI[];
    tasks: Task[];
    totalStoryPoints: number;
    dailyScrums: DailyScrum[];
    burndown: BurndownData;
    review: SprintReview;
    retrospective: Retrospective;
  }>;

  // Velocity Metrics
  velocityMetrics: {
    velocities: number[];
    averageVelocity: number;
    totalCompletedStoryPoints: number;
    totalCompletedItems: number;
    velocityTrend: number;
    improving: boolean;
    standardDeviation: number;
  };

  // Release Burndown
  releaseBurndown: {
    burndownData: Array<{
      sprint: number;
      remaining: number;
      completed: number;
    }>;
    initialStoryPoints: number;
    remainingStoryPoints: number;
    completedStoryPoints: number;
    completionPercentage: number;
  };

  // All Retrospectives
  retrospectives: Retrospective[];

  // Team Info
  roles: {
    productOwner: string;
    scrumMaster: string;
    teamSize: number;
  };

  // Summary Metrics
  metrics: {
    sprintCount: number;
    sprintDuration: number;
    averageVelocity: number;
    totalStoryPoints: number;
    totalBacklogItems: number;
    completedBacklogItems: number;
    completionRate: number;
  };
}
```

## Process Workflow

### Phase 1: Initial Setup

**Establish Definition of Done**
- Define what "Done" means for this team
- Include code quality, testing, documentation, deployment criteria
- Ensure it creates potentially releasable Increment
- Get team agreement

**Create Product Backlog**
- Product Owner identifies all needed work
- Write as user stories with acceptance criteria
- Estimate using story points (Fibonacci sequence)
- Order by business value
- Refine top items for Sprint Planning

### Phase 2: Sprint Cycles

Each sprint follows the same rhythm:

**1. Backlog Refinement** (Ongoing, ~10% of sprint capacity)
- Add detail to upcoming items
- Break down large items
- Update estimates
- Re-order based on new information
- Ensure top items are "Ready"

**2. Sprint Planning** (Beginning of sprint)
- Part 1: What can be done? (Define Sprint Goal, select PBIs)
- Part 2: How will it be done? (Break into tasks, create plan)
- Result: Sprint Goal + Sprint Backlog

**3. Daily Scrum** (Every day, 15 minutes)
- What did I do yesterday?
- What will I do today?
- Any impediments?
- Update task board and burndown

**4. Development Work** (Throughout sprint)
- Self-organizing team does the work
- Collaborate to meet Sprint Goal
- Adapt plan as needed
- Maintain focus (no scope changes)

**5. Sprint Review** (End of sprint)
- Demo completed work to stakeholders
- Inspect Increment against Definition of Done
- Gather feedback
- Update Product Backlog
- Calculate velocity

**6. Sprint Retrospective** (After Review)
- What went well?
- What could be improved?
- What will we commit to improve?
- Create action items for next sprint

### Phase 3: Final Summary

**Velocity Analysis**
- Average velocity over all sprints
- Velocity trend (improving or declining)
- Predictability (standard deviation)

**Release Burndown**
- Progress across all sprints
- Remaining Product Backlog
- Completion percentage

## Examples

See the `examples/` directory for:
- `simple.json` - Basic 2-week sprint setup
- `e-commerce.json` - E-commerce platform development
- `mobile-app.json` - Mobile application with 3-week sprints
- `enterprise.json` - Large enterprise project with 1-week sprints
- `startup.json` - Startup MVP with flexible scope

## Best Practices

### 1. Keep Sprints Short and Consistent

**Recommended**: 2-week sprints
- Short enough for rapid feedback
- Long enough to deliver meaningful Increments
- Consistent length aids predictability

**Avoid**: Changing sprint length mid-project

### 2. Definition of Done is Critical

A clear Definition of Done ensures:
- Quality is built-in
- Increment is potentially shippable
- Technical debt doesn't accumulate
- Transparency for stakeholders

**Must include**: Code quality, testing, documentation standards

### 3. Product Backlog is Never Complete

The Product Backlog evolves continuously:
- New items discovered during Sprints
- Priorities change based on feedback
- Items refined just-in-time
- Lower priority items less detailed

**Anti-pattern**: Trying to define all requirements upfront

### 4. Sprint Goal Provides Focus

Every Sprint should have a clear Sprint Goal:
- Describes why the Sprint is valuable
- Provides coherence and focus
- Guides trade-off decisions
- Rallies team around common objective

**Example**: "Enable users to complete checkout process"

### 5. Daily Scrum is for Development Team

The Daily Scrum is not a status report to management:
- Self-organizing team synchronizes
- 15 minutes maximum
- Same time and place daily
- Scrum Master ensures it happens, doesn't lead it

**Anti-pattern**: Management-driven status meetings

### 6. Sprint Review is Working Session

Sprint Review is collaborative, not just a demo:
- Stakeholders provide feedback
- Product Backlog adapted
- Discussion of what to do next
- Working session, not formal presentation

**Key**: Inspect Increment and adapt Product Backlog

### 7. Retrospective Creates Continuous Improvement

Every Sprint should improve something:
- At least one high-priority improvement
- Action items assigned to owners
- Progress reviewed in next Retrospective
- Safe environment for honest discussion

**Anti-pattern**: Retrospectives without action items

### 8. Protect the Sprint

Once Sprint Planning is complete:
- No changes that endanger Sprint Goal
- Product Owner cannot add work
- Development Team commits to Sprint Goal
- Scrum Master shields team from interference

**Exception**: Sprint may be cancelled if Sprint Goal becomes obsolete

### 9. Velocity is a Planning Tool

Velocity helps with forecasting:
- Average over recent sprints (e.g., last 3)
- Used to forecast capacity
- Improves over time as team matures
- Never compared across teams

**Anti-pattern**: Using velocity as performance metric

### 10. Self-Organization is Key

Development Team decides how to do work:
- No one tells team how to turn backlog into Increments
- Team organizes itself around work
- Collective accountability
- Grows expertise and ownership

**Scrum Master**: Facilitates, doesn't dictate

## Sprint Burndown Chart

The Sprint Burndown shows remaining work throughout sprint:

```
Story Points
40 |●
   |  ●
30 |    ●
   |      ●         ●
20 |        ●     ●
   |          ● ●
10 |            ●
   |              ●
 0 |________________●
    1  2  3  4  5  6  7  8  9  10
              Days

    ● Actual    --- Ideal
```

**Ideal line**: Linear burn from start to zero
**Actual line**: Team's actual progress
**Analysis**:
- Ahead of schedule: Actual below ideal
- Behind schedule: Actual above ideal
- Flat line: Work not being completed

## Velocity Chart

Track velocity across sprints to improve forecasting:

```
Story Points
40 |        ██
35 |    ██  ██
30 |    ██  ██  ██
25 |    ██  ██  ██  ██
20 |██  ██  ██  ██  ██  ██
15 |██  ██  ██  ██  ██  ██
10 |██  ██  ██  ██  ██  ██
 5 |██  ██  ██  ██  ██  ██
 0 |________________________
    S1  S2  S3  S4  S5  S6

Average Velocity: 28 story points
Trend: Improving (↑)
```

## Release Burndown

Track progress toward release across multiple sprints:

```
Story Points
200 |●
    |  ●
150 |    ●
    |      ●
100 |        ●
    |          ●
 50 |            ●
    |              ●
  0 |________________●
     S0 S1 S2 S3 S4 S5 S6
           Sprints

Completed: 200 story points
Remaining: 0 story points
On track for release
```

## Integration with Other Methodologies

### Scrum + BDD

Use BDD for backlog item specification:
```javascript
// 1. Create Product Backlog with Scrum
const scrumResult = await babysit({
  process: 'methodologies/scrum',
  inputs: { /* ... */ }
});

// 2. Use BDD for each Sprint's selected items
for (const pbi of sprint.sprintBacklog) {
  const bddResult = await babysit({
    process: 'methodologies/bdd-specification-by-example',
    inputs: {
      featureName: pbi.title,
      userStory: pbi.userStory,
      acceptanceCriteria: pbi.acceptanceCriteria
    }
  });
}
```

### Scrum + TDD/ATDD

Use TDD/ATDD for development within Sprint:
```javascript
// Scrum organizes sprints
// TDD/ATDD guides development practices within sprint

const scrumResult = await babysit({
  process: 'methodologies/scrum',
  inputs: { /* ... */ }
});

// During sprint, use TDD for each task
const tddResult = await babysit({
  process: 'methodologies/atdd-tdd',
  inputs: {
    features: sprint.sprintBacklog,
    approach: 'tdd'
  }
});
```

### Scrum + Domain-Driven Design

Use DDD for complex domain modeling:
```javascript
// 1. DDD for domain modeling (Product Backlog creation)
const dddModel = await babysit({
  process: 'methodologies/domain-driven-design',
  inputs: { /* ... */ }
});

// 2. Scrum for iterative delivery
const scrumResult = await babysit({
  process: 'methodologies/scrum',
  inputs: {
    projectName: 'Complex Domain',
    productVision: dddModel.vision,
    // Use DDD insights for backlog
  }
});
```

### Scrum + XP Engineering Practices

Combine Scrum framework with XP technical practices:
- **Pair Programming**: During sprint development
- **Test-Driven Development**: Red-Green-Refactor cycle
- **Continuous Integration**: Multiple integrations per day
- **Refactoring**: Improve design continuously
- **Simple Design**: YAGNI principle
- **Collective Code Ownership**: Anyone can improve any code

This combination is very common and effective.

### Scrumban (Scrum + Kanban)

Blend Scrum's timeboxing with Kanban's flow:
- Keep Scrum events (Planning, Review, Retrospective)
- Use Kanban board for visual workflow
- Limit WIP (Work In Progress)
- Continuous flow within sprint
- Pull system instead of push

## Comparison with Other Methodologies

| Aspect | Scrum | Kanban | XP | FDD | Waterfall |
|--------|-------|--------|-----|-----|-----------|
| **Iterations** | Fixed sprints | Continuous flow | 1-2 week iterations | 2-week iterations | Phases |
| **Planning** | Sprint Planning | Continuous | Weekly | Feature-based | Upfront |
| **Roles** | 3 defined roles | No prescribed roles | 12 practices | Chief Programmers | Many roles |
| **Change** | At sprint boundary | Anytime | Weekly | At iteration | Costly |
| **Delivery** | End of sprint | Continuous | Continuous | End of iteration | End of project |
| **Team Size** | 3-9 | Any | 2-12 | 15-500+ | Any |
| **Best For** | Product development | Support/maintenance | Technical excellence | Large teams | Fixed requirements |
| **Tracking** | Burndown charts | Cumulative Flow | Story board | Parking Lot | Gantt charts |
| **Ownership** | Collective | Varies | Collective | Individual | Individual |

## Common Challenges and Solutions

### Challenge: Incomplete Sprint Backlog Items

**Problem**: Stories not meeting Definition of Done by sprint end

**Solutions**:
- Break items into smaller pieces (no item larger than 1/3 of sprint)
- Improve Definition of Ready (ensure items are well-understood)
- Address impediments faster
- Reduce scope in Sprint Planning
- Improve estimates through practice

### Challenge: Scope Creep During Sprint

**Problem**: Product Owner adding work mid-sprint

**Solutions**:
- Reinforce Sprint sanctity (no changes endangering goal)
- Product Owner can add to Product Backlog, not Sprint Backlog
- If critical, may need to end sprint and replan
- Clear Sprint Goal helps resist scope creep
- Educate stakeholders on Scrum principles

### Challenge: Low Velocity

**Problem**: Team completing fewer story points than expected

**Solutions**:
- Check for technical debt slowing team
- Identify and remove impediments
- Improve Definition of Done (may be unrealistic)
- Team may be over-estimating
- Ensure team has all needed skills
- Look for external interruptions

### Challenge: Ineffective Daily Scrums

**Problem**: Daily Scrums becoming status reports or too long

**Solutions**:
- Stand up (keeps meeting short)
- Focus on Sprint Goal, not status
- Scrum Master timeboxes to 15 minutes
- Deep discussions taken offline
- Same time and place daily
- Development Team only (others observe)

### Challenge: Sprint Review Without Stakeholders

**Problem**: No stakeholders attend Sprint Review

**Solutions**:
- Product Owner must invite stakeholders
- Demo real, working software
- Make it interactive working session
- Show value delivered
- Schedule at convenient time
- Emphasize importance to product success

### Challenge: Retrospectives Without Action

**Problem**: Same issues every retrospective, no improvement

**Solutions**:
- Ensure action items assigned to owners
- Review previous action items first
- Focus on 1-2 high-priority improvements
- Make improvements visible
- Hold team accountable
- Change retrospective format if stale

### Challenge: Technical Debt Accumulating

**Problem**: Code quality declining, velocity dropping

**Solutions**:
- Strengthen Definition of Done
- Allocate capacity for technical work (e.g., 20% of sprint)
- Make technical debt visible on Product Backlog
- Never compromise Definition of Done for velocity
- Refactoring is part of done, not separate item

## Scrum Myths Debunked

### Myth 1: "Scrum means no documentation"

**Reality**: Scrum values working software over documentation, but doesn't prohibit it. Definition of Done typically includes necessary documentation.

### Myth 2: "Scrum Master is project manager"

**Reality**: Scrum Master is servant-leader and coach, not manager. Has no authority over team, facilitates rather than directs.

### Myth 3: "Scrum eliminates planning"

**Reality**: Scrum has multiple planning events (Sprint Planning, backlog refinement, Daily Scrum). Planning is continuous, not just upfront.

### Myth 4: "Velocity should always increase"

**Reality**: Velocity stabilizes as team matures. Always increasing velocity may indicate poor estimates or technical debt accumulation.

### Myth 5: "Sprint Review is just a demo"

**Reality**: Sprint Review is collaborative working session to inspect Increment and adapt Product Backlog, not just a presentation.

### Myth 6: "Can't change Product Backlog during Sprint"

**Reality**: Product Owner can change Product Backlog anytime. Just can't change Sprint Backlog.

### Myth 7: "Scrum means no design"

**Reality**: Design happens continuously. Architecture emerges through refinement and development. Definition of Done ensures design quality.

### Myth 8: "Daily Scrum must use three questions"

**Reality**: Three questions are common pattern, not rule. Team can use any format that achieves daily synchronization.

## References

### Official Resources

- [Scrum Guide (Official)](https://scrumguides.org/) - The definitive guide to Scrum
- [Scrum.org](https://www.scrum.org/) - Ken Schwaber's organization
- [Scrum Alliance](https://www.scrumalliance.org/) - Jeff Sutherland's organization
- [2020 Scrum Guide](https://scrumguides.org/scrum-guide.html) - Latest version

### Books

- **"Scrum: The Art of Doing Twice the Work in Half the Time"** by Jeff Sutherland - Co-creator's perspective
- **"The Scrum Guide"** by Ken Schwaber and Jeff Sutherland - Official guide (free)
- **"Agile Estimating and Planning"** by Mike Cohn - Planning and estimation
- **"User Stories Applied"** by Mike Cohn - Writing effective user stories
- **"Succeeding with Agile"** by Mike Cohn - Implementing Scrum
- **"The Professional Product Owner"** by Don McGreal and Ralph Jocham - Product Owner role
- **"Scrum Mastery"** by Geoff Watts - Scrum Master role

### Articles & Guides

- [Monday.com Scrum Guide 2026](https://monday.com/blog/project-management/scrum/)
- [Atlassian Scrum Resources](https://www.atlassian.com/agile/scrum)
- [Mountain Goat Software](https://www.mountaingoatsoftware.com/) - Mike Cohn's resources
- [Scrum.org Resources](https://www.scrum.org/resources)

### Academic Papers

- Schwaber, K., & Sutherland, J. (2020). "The Scrum Guide"
- Schwaber, K. (1995). "SCRUM Development Process"
- Rising, L., & Janoff, N. S. (2000). "The Scrum Software Development Process for Small Teams"

### Training & Certification

- [Professional Scrum Master (PSM)](https://www.scrum.org/assessments/professional-scrum-master-i-certification) - Scrum.org
- [Certified ScrumMaster (CSM)](https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster) - Scrum Alliance
- [Professional Scrum Product Owner (PSPO)](https://www.scrum.org/assessments/professional-scrum-product-owner-i-certification)

## Troubleshooting

### Sprints Feel Chaotic

**Symptoms**: Constant firefighting, no rhythm

**Diagnosis**: Likely weak Definition of Done, poor backlog refinement, or too many interruptions

**Solutions**:
1. Strengthen Definition of Done
2. Invest in backlog refinement (10% of capacity)
3. Scrum Master shields team from interruptions
4. Ensure Sprint Goal is clear and focused

### Velocity Unpredictable

**Symptoms**: Wide swings in velocity sprint-to-sprint

**Diagnosis**: Inconsistent estimating, changing team, or technical debt

**Solutions**:
1. Improve estimation through practice and calibration
2. Keep team stable (no constant changes)
3. Address technical debt
4. Ensure items are well-understood before commitment

### Team Waiting for Approval

**Symptoms**: Work blocked waiting for Product Owner decisions

**Solutions**:
1. Product Owner must be available (not 5% role)
2. Acceptance criteria clear before Sprint Planning
3. Definition of Ready for backlog items
4. Product Owner empowered to make decisions

### No Improvement Sprint-to-Sprint

**Symptoms**: Same problems every sprint

**Solutions**:
1. Take Retrospective action items seriously
2. Assign owners and due dates
3. Review progress on improvements
4. Focus on 1-2 high-priority improvements
5. Make improvements visible

## License

This methodology implementation is part of the Babysitter SDK and follows the same license terms.

## Contributing

To improve this Scrum implementation:
1. Review the backlog in `methodologies/backlog.md`
2. Propose enhancements via issues
3. Submit pull requests with improvements
4. Share real-world usage experiences

---

**Implementation Status**: ✅ Implemented
**Last Updated**: 2026-01-23
**Version**: 1.0.0
**Based On**: Scrum Guide 2020
