# Impact Mapping Methodology

**Creator**: Gojko Adzic
**Year**: Modern (2012)
**Category**: Strategic Planning / Requirements / Product Strategy
**Process ID**: `methodologies/impact-mapping`

## Overview

Impact Mapping is a strategic planning technique that helps organizations avoid getting lost in implementation details by creating a clear visual map connecting business goals to deliverable features. It ensures that every feature decision can be traced back to a business objective and the behavioral changes needed to achieve it.

This methodology prevents scope creep, enables better prioritization, and helps teams focus on outcomes rather than outputs.

## The Impact Mapping Hierarchy

Impact Mapping uses a four-level hierarchy to connect strategy to execution:

```
🎯 GOAL (Why?)
    └─ 👤 ACTOR (Who?)
        └─ 💫 IMPACT (How?)
            └─ 📦 DELIVERABLE (What?)
```

### 1. 🎯 Goal - WHY are we doing this?

The business objective we want to achieve. Must be:
- **Specific**: Clear and well-defined
- **Measurable**: Quantifiable success metrics
- **Achievable**: Realistic given constraints
- **Relevant**: Aligned with business strategy
- **Time-bound**: Has a deadline or timeframe

**Examples**:
- "Increase monthly recurring revenue by 30% in Q2 2026"
- "Reduce customer churn from 8% to 4% within 6 months"
- "Achieve 100,000 active users by end of year"

### 2. 👤 Actor - WHO can create impact?

The people, systems, or organizations who can help achieve (or hinder) the goal.

**Actor Types**:
- **Primary Actors**: Direct users who will use the product
  - End users, customers, key personas
- **Secondary Actors**: Indirect beneficiaries or influencers
  - Decision makers, stakeholders, partners, internal teams
- **Negative Actors**: Opposition or competition
  - Competitors, detractors, obstacles, systems to replace

**Examples**:
- "Existing premium customers"
- "Free trial users"
- "Customer success team"
- "Competitors (negative actor)"

### 3. 💫 Impact - HOW should their behavior change?

The desired change in actor behavior that contributes to the goal.

**Impact Types**:
- **Adoption**: Start using something new
- **Engagement**: Increase interaction frequency
- **Efficiency**: Do things faster or better
- **Advocacy**: Promote to others
- **Retention**: Continue using, reduce churn
- **Conversion**: Upgrade or purchase
- **Reduction**: Stop unwanted behavior
- **Prevention**: Block negative impacts

**Examples**:
- "Free users upgrade to premium tier"
- "Customers renew subscriptions earlier"
- "Support team resolves tickets 50% faster"
- "Competitors lose market share to us"

### 4. 📦 Deliverable - WHAT can we build?

Features, stories, or capabilities that create the desired impact.

**Deliverable Types**:
- **Feature**: New capability
- **Enhancement**: Improvement to existing feature
- **Content**: Documentation, training, marketing
- **Integration**: Connection to other systems
- **Automation**: Remove manual work
- **UI/UX**: Interface improvement
- **Infrastructure**: Technical enabler

**Examples**:
- "Advanced analytics dashboard"
- "Automated onboarding workflow"
- "API integration with Salesforce"
- "Premium support tier"

## Key Principles

### 1. Outside-In Thinking
Start with the goal and work outward. Don't start with features.

### 2. Multiple Paths to Goal
There are always multiple actors, impacts, and deliverables that could achieve the goal. Map them all, then prioritize.

### 3. Assumption Tracking
Flag assumptions at every level. These are hypotheses that need validation through experimentation or user research.

### 4. Visual Communication
The map is a visual tool for stakeholder alignment. Everyone should be able to understand the strategic connection between features and goals.

### 5. Living Document
Update the map as you learn. When assumptions are validated or invalidated, adjust the map.

## Process Flow

### Phase 1: Goal Definition
- Define clear, measurable business objective
- Establish success metrics (KPIs)
- Document timeline and constraints
- Identify initial assumptions and risks
- Ensure goal is SMART

**Output**: Well-defined goal with metrics and constraints

### Phase 2: Actor Identification
- Brainstorm all actors who can impact the goal
- Categorize as primary, secondary, or negative
- Assess each actor's influence and reach
- Document current vs. desired behaviors
- Prioritize high-influence actors

**Output**: Comprehensive list of actors with influence assessment

### Phase 3: Impact Analysis
- For each actor, define desired behavioral changes
- Connect each impact to goal achievement
- Define how to measure each impact
- Identify assumptions for each impact
- Consider obstacles to creating impact

**Output**: Behavioral impacts for all actors with measurements

### Phase 4: Deliverable Generation
- Brainstorm deliverables that could create each impact
- Consider multiple solution options
- Assess impact potential vs. effort
- Document dependencies and risks
- Flag high-assumption deliverables

**Output**: Deliverable options for all impacts

### Phase 5: Prioritization and Roadmap
- Score deliverables by impact potential, effort, and risk
- Prioritize into must/should/could/won't have
- Sequence into implementation milestones
- Plan assumption validation experiments
- Balance quick wins with strategic investments

**Output**: Prioritized roadmap with validation plan

### Phase 6: Map Visualization
- Create visual tree diagram
- Mark assumptions with flags
- Highlight prioritized deliverables
- Use color coding for clarity
- Share with stakeholders for alignment

**Output**: Visual impact map for communication

## Usage

### Basic Example

```javascript
import { process } from './impact-mapping.js';

const result = await process({
  goal: "Increase monthly recurring revenue by 30% in Q2 2026",
  timeframe: "Q2 2026",
  successMetrics: [
    {
      metric: "Monthly Recurring Revenue (MRR)",
      currentValue: "$100,000",
      targetValue: "$130,000",
      measurement: "Billing system reports"
    }
  ]
}, ctx);

console.log(`Actors identified: ${result.actorCount}`);
console.log(`Impacts defined: ${result.impactCount}`);
console.log(`Deliverables generated: ${result.deliverableCount}`);
console.log(`Critical assumptions: ${result.criticalAssumptions}`);
console.log(`Roadmap phases: ${result.milestoneCount}`);
```

### With Constraints and Context

```javascript
const result = await process({
  goal: "Reduce customer support ticket volume by 40% within 6 months",
  timeframe: "6 months",
  successMetrics: [
    {
      metric: "Support tickets per month",
      currentValue: "5000",
      targetValue: "3000",
      measurement: "Zendesk analytics"
    },
    {
      metric: "Customer satisfaction (CSAT)",
      currentValue: "75%",
      targetValue: "85%",
      measurement: "Post-interaction surveys"
    }
  ],
  constraints: {
    budget: "$200,000",
    team: "2 engineers, 1 designer",
    technical: ["Must integrate with existing Zendesk"],
    regulatory: ["Must maintain GDPR compliance"]
  },
  context: {
    existingFeatures: ["Basic knowledge base", "Email support"],
    painPoints: ["Repetitive questions", "Slow response times"],
    teamCapabilities: ["React, Node.js, PostgreSQL"]
  },
  knownActors: ["Customers", "Support agents", "Product managers"]
}, ctx);
```

### Inputs

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `goal` | string | ✅ Yes | - | Business goal or objective |
| `timeframe` | string | No | "6 months" | Timeline for achieving goal |
| `successMetrics` | array | No | [] | KPIs to measure goal success |
| `constraints` | object | No | {} | Budget, team, technical, regulatory |
| `context` | object | No | null | Existing product/system context |
| `knownActors` | array | No | [] | Pre-identified actors |

### Outputs

```javascript
{
  success: true,
  sessionDurationMinutes: 45,
  goal: {
    goal: "Increase MRR by 30%",
    why: "Drive business growth and profitability",
    successMetrics: [...],
    timeline: {...},
    smartScore: { specific: true, measurable: true, ... }
  },
  actors: [
    {
      id: "actor-1",
      name: "Free tier users",
      type: "primary",
      influence: "high",
      reach: "10,000 users",
      ...
    }
  ],
  actorCount: 6,
  actorBreakdown: {
    primary: 3,
    secondary: 2,
    negative: 1
  },
  impacts: [
    {
      id: "impact-1",
      actorId: "actor-1",
      description: "Upgrade to premium tier",
      type: "conversion",
      behavioralChange: "Users convert from free to paid",
      effect: "Directly increases MRR",
      measurement: {...},
      assumptions: [...]
    }
  ],
  impactCount: 12,
  deliverables: [
    {
      id: "del-1",
      impactId: "impact-1",
      title: "Advanced analytics dashboard",
      type: "feature",
      impactPotential: "high",
      effort: "medium",
      priorityTier: "must-have",
      priorityScore: 87,
      ...
    }
  ],
  deliverableCount: 24,
  assumptions: [
    {
      assumption: "Users value analytics enough to pay",
      priority: "critical",
      validationMethod: "User interviews and surveys",
      ...
    }
  ],
  assumptionCount: 15,
  criticalAssumptions: 5,
  roadmap: {
    milestones: [
      {
        phase: 1,
        name: "MVP - Core Value Proposition",
        duration: "6 weeks",
        deliverableIds: ["del-1", "del-3"],
        validationExperiments: [...]
      }
    ],
    strategy: "Focus on must-have features first...",
    riskMitigation: [...]
  },
  milestoneCount: 3,
  map: {
    goal: {...},
    tree: [...]
  },
  visualization: {
    mermaid: "graph TB\n...",
    format: "mermaid"
  },
  artifacts: {
    goal: 'artifacts/impact-mapping/goal.json',
    actors: 'artifacts/impact-mapping/actors.md',
    impacts: 'artifacts/impact-mapping/impacts.md',
    deliverables: 'artifacts/impact-mapping/deliverables.md',
    assumptions: 'artifacts/impact-mapping/assumptions.json',
    prioritization: 'artifacts/impact-mapping/prioritization.md',
    roadmap: 'artifacts/impact-mapping/roadmap.json',
    visualization: 'artifacts/impact-mapping/impact-map.mmd',
    completeMap: 'artifacts/impact-mapping/complete-map.json',
    summary: 'artifacts/impact-mapping/summary.md'
  }
}
```

## Integration Points

### Perfect Input for Other Methodologies

1. **Spec-Driven Development**
   - Impact Map defines what to build and why
   - Deliverables become specifications
   - Assumptions guide specification validation
   - Goal metrics become acceptance criteria

2. **Example Mapping**
   - Each deliverable can be mapped with examples
   - Impacts help define business rules
   - Actors inform user story personas
   - Goal provides context for mapping sessions

3. **BDD/Specification by Example**
   - Impacts define behavioral scenarios
   - Deliverables become features in Gherkin
   - Metrics guide scenario design
   - Actors become personas in scenarios

4. **Domain-Driven Design (DDD)**
   - Actors map to domain entities and aggregates
   - Impacts identify domain events
   - Deliverables suggest bounded contexts
   - Goal defines core domain

5. **Hypothesis-Driven Development**
   - Assumptions become hypotheses to test
   - Impacts are predicted outcomes
   - Deliverables are experiments
   - Metrics measure hypothesis validation

6. **Feature-Driven Development (FDD)**
   - Deliverables become features
   - Actors drive feature ownership
   - Impacts guide feature prioritization
   - Goal aligns with business value

7. **GSD (Getting Stuff Done)**
   - Roadmap defines phases
   - Milestones structure execution
   - Prioritization guides sprint planning
   - Goal tracks toward business outcome

### Workflow Integration

```
Impact Mapping (Strategic)
    ↓
Hypothesis-Driven Development (Assumption Validation)
    ↓
Spec-Driven Development (Define Implementation)
    ↓
Example Mapping (Elaborate Stories)
    ↓
BDD/TDD (Build and Test)
    ↓
GSD Execution (Deliver)
```

## Success Criteria

A successful Impact Mapping session produces:

- ✅ Clear, measurable SMART goal with 3-5 KPIs
- ✅ Diverse actor types identified (primary, secondary, negative)
- ✅ Specific, measurable behavioral impacts per actor
- ✅ Multiple deliverable options per impact
- ✅ Prioritized roadmap with 2-4 milestones
- ✅ Critical assumptions flagged for validation
- ✅ Visual map for stakeholder communication
- ✅ Team alignment on strategy and priorities

## Warning Signs

If Impact Mapping reveals these issues, consider refinement:

- ❌ Goal is vague or not measurable
- ❌ Only 1-2 actors identified (too narrow)
- ❌ Impacts are features, not behaviors
- ❌ All deliverables are "must-have" (no prioritization)
- ❌ Dozens of assumptions with no validation plan
- ❌ Map is too complex (more than 50 deliverables)
- ❌ Stakeholders can't explain the strategy from the map

→ **Refine the goal**, simplify the scope, or break into multiple maps

## Best Practices

### Do's
- ✅ Start with a single, clear goal per map
- ✅ Think broadly about actors (don't forget negative actors)
- ✅ Focus impacts on behavior, not features
- ✅ Generate multiple deliverable options (divergent thinking)
- ✅ Flag assumptions early and often
- ✅ Validate critical assumptions before building
- ✅ Update the map as you learn
- ✅ Use the map for stakeholder communication

### Don'ts
- ❌ Don't try to map multiple goals at once
- ❌ Don't skip actors and jump to features
- ❌ Don't assume one solution per impact
- ❌ Don't build everything - prioritize ruthlessly
- ❌ Don't ignore negative actors
- ❌ Don't create the map alone - collaborate
- ❌ Don't let the map become stale - keep it updated

## Example: SaaS Revenue Growth

### Goal
> 🎯 **Increase monthly recurring revenue (MRR) from $100K to $150K by Q3 2026**

**Success Metrics**:
- MRR: $100K → $150K (50% increase)
- Customer count: 500 → 700 customers
- Average revenue per customer: $200 → $214
- Churn rate: 8% → 5%

### Actors and Impacts

**👤 Actor: Free Tier Users** (Primary)
- 💫 Impact: Convert to paid plans
  - 📦 Advanced analytics dashboard (must-have) ⚡
  - 📦 Customizable reports (should-have)
  - 📦 Data export API (could-have)

- 💫 Impact: Increase engagement before conversion
  - 📦 Interactive product tour (must-have)
  - 📦 Onboarding email sequence (must-have)
  - 📦 Usage milestone notifications (should-have)

**👥 Actor: Existing Paid Customers** (Primary)
- 💫 Impact: Upgrade to higher tiers
  - 📦 Team collaboration features (must-have) ⚡
  - 📦 Advanced permissions system (should-have)
  - 📦 Priority support tier (should-have)

- 💫 Impact: Reduce churn by increasing value
  - 📦 Customer success program (must-have)
  - 📦 Regular feature adoption webinars (should-have)
  - 📦 In-app usage recommendations (could-have)

**👥 Actor: Customer Success Team** (Secondary)
- 💫 Impact: Proactively prevent churn
  - 📦 Churn risk dashboard (must-have)
  - 📦 Automated health score alerts (must-have)
  - 📦 Customer journey playbooks (should-have)

**⚠️ Actor: Competitors** (Negative)
- 💫 Impact: Prevent customer loss to competitors
  - 📦 Competitive feature parity analysis (must-have)
  - 📦 Unique differentiating feature (must-have) ⚡
  - 📦 Price comparison tool for prospects (could-have)

### Assumptions (⚡ = Critical)
1. ⚡ Free users will pay for advanced analytics (Validation: User interviews + pricing survey)
2. ⚡ Team features justify higher price tiers (Validation: Beta testing with 10 customers)
3. Customer success can reduce churn by 3% (Validation: 3-month pilot program)
4. Competitors are not planning major feature releases (Validation: Market monitoring)

### Roadmap

**Milestone 1: MVP (Weeks 1-8)**
- Goal: Validate core upgrade value proposition
- Deliverables: Advanced analytics, interactive tour, churn dashboard
- Experiments: Test pricing tiers, measure conversion rate
- Target: $10K MRR increase from conversions

**Milestone 2: Retention (Weeks 9-16)**
- Goal: Reduce churn and increase customer lifetime value
- Deliverables: Customer success program, team features, onboarding sequence
- Experiments: A/B test onboarding flows, measure retention impact
- Target: Churn from 8% → 6%

**Milestone 3: Expansion (Weeks 17-24)**
- Goal: Drive upgrades and market differentiation
- Deliverables: Advanced permissions, priority support, unique feature
- Experiments: Test upgrade paths, measure competitive win rates
- Target: Reach $150K MRR

## References

### Original Sources
- [Impact Mapping Official Website](https://www.impactmapping.org/) - Free online book by Gojko Adzic
- [Impact Mapping: Making a Big Impact with Software Products](https://www.impactmapping.org/book.html) - Complete book
- [Drawing Impact Maps](https://www.impactmapping.org/drawing.html) - Workshop guide
- [Example Impact Maps](https://www.impactmapping.org/example.html) - Real-world examples

### Related Reading
- [Specification by Example](https://gojko.net/books/specification-by-example/) - Gojko Adzic
- [Fifty Quick Ideas to Improve Your User Stories](https://fiftyquickideas.com/fifty-quick-ideas-to-improve-your-user-stories/) - Gojko Adzic & David Evans
- [User Story Mapping](https://www.jpattonassociates.com/user-story-mapping/) - Jeff Patton

### Video Tutorials
- [Gojko Adzic: Impact Mapping](https://www.youtube.com/watch?v=y4Rj05YVg_E) - Overview presentation
- [Impact Mapping Workshop](https://www.youtube.com/results?search_query=impact+mapping+workshop) - Various workshop recordings

### Community Resources
- [Impact Mapping Templates](https://miro.com/templates/impact-mapping/) - Miro templates
- [Impact Mapping Guide](https://www.thoughtworks.com/insights/blog/impact-mapping-scaling-agile-practices-impact) - ThoughtWorks
- [Product Management Resources](https://www.productplan.com/glossary/impact-mapping/) - Product planning context

## License

This methodology implementation is part of the Babysitter SDK orchestration framework.

Creator credit: Gojko Adzic for the Impact Mapping technique.
