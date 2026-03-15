# Double Diamond Methodology

**Creator**: British Design Council (2005)
**Year**: Established design thinking framework
**Category**: Design Thinking / Innovation / User-Centered Design

## Overview

The Double Diamond is a design thinking framework that visualizes the design process through four distinct phases: Discover, Define, Develop, and Deliver. The framework is represented by two diamonds - the first diamond explores the problem space (Discover → Define), and the second explores the solution space (Develop → Deliver). Each diamond represents both divergent thinking (exploring an issue more widely) and convergent thinking (taking focused action).

This process implements the Double Diamond framework through the Babysitter SDK orchestration framework, providing agent-driven research, synthesis, ideation, and delivery workflows.

## Key Concepts

### The Two Diamonds

**First Diamond: Problem Space (Discover → Define)**
- **Discover**: Divergent exploration of the problem space
- **Define**: Convergent synthesis to a focused problem statement

**Second Diamond: Solution Space (Develop → Deliver)**
- **Develop**: Divergent ideation of multiple solution concepts
- **Deliver**: Convergent selection and implementation of final solution

### Divergent and Convergent Thinking

**Divergent Thinking** (expanding):
- Explore broadly without judgment
- Generate many options and possibilities
- Ask "what else?" and "what if?"
- Defer decision-making
- Embrace ambiguity

**Convergent Thinking** (focusing):
- Analyze and evaluate options
- Synthesize insights into patterns
- Make decisions and choices
- Create clear direction
- Reduce ambiguity

### User-Centered Design

Throughout all phases:
- Keep user needs central to decisions
- Base decisions on research and evidence
- Test assumptions with real users
- Iterate based on feedback
- Design with users, not for users

## Process Workflow

### Phase 1: Discover (Diverge on Problem)

**Goal**: Explore the problem space as broadly as possible

**Activities**:
1. User research (interviews, observations, contextual inquiry)
2. Market and competitive analysis
3. Stakeholder interviews
4. Context mapping
5. Identify user needs, pain points, behaviors
6. Document workarounds and edge cases
7. Gather qualitative and quantitative insights
8. Explore contradictions and tensions

**Key Questions**:
- Who are the users and what are their needs?
- What problems do they face?
- In what context do problems occur?
- What workarounds exist?
- What are users trying to achieve?

**Mindset**: Stay in problem space. Resist jumping to solutions. Cast wide net.

### Phase 2: Define (Converge on Problem)

**Goal**: Synthesize research into focused problem statement

**Activities**:
1. Synthesize discovery insights
2. Identify patterns and themes
3. Frame the core problem
4. Write clear problem statement
5. Define design principles
6. Establish success criteria
7. Identify constraints
8. Define primary users and their needs

**Key Questions**:
- What is the core problem to solve?
- Who are we solving it for?
- Why does this problem matter?
- What does success look like?
- What principles should guide our solution?

**Mindset**: Move from broad insights to specific problem. Be clear but don't prescribe solution.

### Phase 3: Develop (Diverge on Solutions)

**Goal**: Generate multiple solution concepts through ideation

**Activities**:
1. Ideation sessions (brainstorming, SCAMPER, analogies)
2. Generate wide range of concepts (5-10+)
3. Challenge assumptions
4. Range from incremental to radical
5. Create rough prototypes/sketches
6. Evaluate against design principles
7. Assess technical feasibility
8. Identify strengths and weaknesses

**Key Questions**:
- What are different ways to solve this problem?
- What if we tried [extreme approach]?
- How might we combine concepts?
- What assumptions are we making?
- What would a radical solution look like?

**Mindset**: Quantity leads to quality. Defer judgment. Yes, and... Build on ideas.

### Phase 4: Deliver (Converge on Solution)

**Goal**: Select final solution and plan implementation

**Activities**:
1. Evaluate concepts against criteria
2. Select final solution (may combine concepts)
3. Create detailed specification
4. Define user experience
5. Break into implementation steps
6. Create delivery timeline
7. Identify risks and dependencies
8. Plan for testing and iteration

**Key Questions**:
- Which solution best meets our criteria?
- How will it work in detail?
- What needs to be built first?
- How will we measure success?
- What could go wrong?

**Mindset**: Make clear choices with rationale. Plan for reality. Prepare for iteration.

## Usage

### Full Double Diamond Workflow

```javascript
import { orchestrate } from '@a5c-ai/babysitter-sdk';

const result = await orchestrate({
  process: 'methodologies/double-diamond',
  inputs: {
    projectName: 'Mobile Banking App Redesign',
    context: 'Redesigning mobile banking app to improve user experience...',
    initialResearch: 'User interviews show frustration with...',
    phase: 'full'
  }
});
```

### Discovery Phase Only

```javascript
const result = await orchestrate({
  process: 'methodologies/double-diamond',
  inputs: {
    projectName: 'Mobile Banking App',
    context: 'Exploring user needs...',
    initialResearch: 'Survey data and interviews...',
    phase: 'discover'
  }
});
```

### Continue from Definition

```javascript
const result = await orchestrate({
  process: 'methodologies/double-diamond',
  inputs: {
    projectName: 'Mobile Banking App',
    phase: 'define',
    existingDiscovery: './artifacts/double-diamond/discovery.json'
  }
});
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Name of the design project |
| `context` | string | No | '' | Project context and background |
| `initialResearch` | string | No | '' | Initial research data (interviews, surveys, market analysis) |
| `phase` | string | No | 'full' | Starting phase: 'discover', 'define', 'develop', 'deliver', 'full' |
| `existingDiscovery` | string | No | null | Path to existing artifacts (for continuation) |

## Output Artifacts

The process generates comprehensive Double Diamond artifacts:

### Discovery Phase
- `artifacts/double-diamond/DISCOVERY.md` - Discovery insights and research synthesis
- `artifacts/double-diamond/user-research.json` - Structured user research data
- `artifacts/double-diamond/problem-map.md` - Problem space mapping

### Definition Phase
- `artifacts/double-diamond/DEFINITION.md` - Problem definition and design principles
- `artifacts/double-diamond/problem-statement.json` - Structured problem statement
- `artifacts/double-diamond/design-principles.md` - Design principles and rationale

### Development Phase
- `artifacts/double-diamond/DEVELOPMENT.md` - Solution concepts and ideation
- `artifacts/double-diamond/solution-concepts.json` - Structured concept data
- `artifacts/double-diamond/prototypes.md` - Prototype descriptions

### Delivery Phase
- `artifacts/double-diamond/DELIVERY.md` - Final solution and implementation plan
- `artifacts/double-diamond/final-solution.json` - Detailed solution specification
- `artifacts/double-diamond/implementation-plan.md` - Step-by-step implementation plan

### Summary
- `artifacts/double-diamond/SUMMARY.md` - Complete Double Diamond summary

## Return Value

```javascript
{
  success: boolean,
  projectName: string,
  phase: string,
  discovery: {
    userInsights: [ ... ],
    marketInsights: [ ... ],
    problemAreas: [ ... ],
    userBehaviors: [ ... ],
    stakeholders: [ ... ],
    assumptions: [ ... ],
    researchSynthesis: { ... }
  },
  definition: {
    problemStatement: { ... },
    designPrinciples: [ ... ],
    successCriteria: [ ... ],
    constraints: { ... },
    primaryUsers: [ ... ],
    opportunitySpace: { ... }
  },
  development: {
    concepts: [ ... ],
    prototypes: [ ... ],
    ideationSummary: { ... },
    technicalFeasibility: [ ... ]
  },
  delivery: {
    selectedSolution: { ... },
    specification: { ... },
    implementationSteps: [ ... ],
    deliveryTimeline: { ... },
    qualityAssurance: { ... },
    risks: [ ... ]
  },
  iterationDecision: { ... },
  validation: { ... },
  artifacts: { ... },
  metadata: { ... }
}
```

## Integration with Other Methodologies

### With Jobs to Be Done (JTBD)
Discovery phase includes JTBD job discovery. Forces analysis informs problem definition. Job stories become inputs to solution development.

### With Spec-Driven Development
Problem definition and final solution become inputs to constitution and specification writing. Design principles guide spec development.

### With BDD/Specification by Example
User insights and problem definition inform BDD scenarios. Final solution specification becomes input to Gherkin scenario writing.

### With Hypothesis-Driven Development
Assumptions identified during discovery become hypotheses to test. Development phase concepts can be validated through experiments.

### With Impact Mapping
Problem statement informs goal definition. Success criteria map to impacts. Solution features map to deliverables.

## Double Diamond in Practice

### Iteration is Normal

The Double Diamond is inherently iterative. You may need multiple diamonds:

**Zoom In**: After completing one diamond, zoom into specific aspect for another diamond
**Zoom Out**: If too detailed, zoom out to see bigger picture
**Pivot**: If problem/solution doesn't validate, run new diamond with updated understanding
**Refinement**: Polish and refine solution through additional diamond

### Timeboxing

Phases can be timeboxed based on project needs:

**Sprint Diamond** (1-2 weeks):
- Discover: 2 days
- Define: 1 day
- Develop: 3 days
- Deliver: 2 days

**Standard Diamond** (4-6 weeks):
- Discover: 1-2 weeks
- Define: 3-5 days
- Develop: 1-2 weeks
- Deliver: 1 week

**Deep Diamond** (3-6 months):
- Discover: 4-8 weeks
- Define: 2-3 weeks
- Develop: 4-8 weeks
- Deliver: 3-4 weeks

### Team Collaboration

Double Diamond works best with cross-functional teams:

**Discovery**: Researchers, designers, product managers, users
**Define**: Full team + stakeholders
**Develop**: Designers, developers, product managers
**Deliver**: Full team + implementation specialists

## Best Practices

### Discovery Phase
1. Talk to real users in their context
2. Observe actual behavior, not just what people say
3. Look for workarounds - they reveal pain points
4. Document exact quotes from users
5. Include edge cases and extreme users
6. Resist the urge to jump to solutions
7. Cast a wide net - be truly divergent

### Definition Phase
1. Problem statement should be specific but not prescribe solution
2. Good: "Busy parents struggle to plan healthy meals with limited time"
3. Bad: "We need a meal planning app"
4. Design principles guide solution choices
5. Success criteria must be measurable
6. Get stakeholder alignment on problem definition

### Development Phase
1. Aim for quantity - at least 5-10 distinct concepts
2. Range from incremental to radical solutions
3. Defer judgment during ideation
4. Build on ideas: "yes, and..." not "yes, but..."
5. Challenge assumptions in each concept
6. Create tangible prototypes, even if rough
7. Evaluate concepts against design principles

### Delivery Phase
1. Make clear decisions with documented rationale
2. Combine best elements from multiple concepts
3. Break implementation into clear steps
4. Identify dependencies and critical path
5. Plan for measurement from day one
6. Prepare for iteration based on learnings
7. Communicate decisions to all stakeholders

## Common Pitfalls

### Skipping Divergence
**Pitfall**: Jumping to first solution without exploring alternatives
**Fix**: Force yourself to generate 5-10 concepts before converging

### Staying Too Divergent
**Pitfall**: Endless exploration without making decisions
**Fix**: Set time limits for divergent phases, then move to convergent

### Solution-First Thinking
**Pitfall**: Assuming you know the solution before understanding problem
**Fix**: Spend equal time on first diamond (problem) as second (solution)

### Ignoring Users
**Pitfall**: Designing based on assumptions rather than user research
**Fix**: Talk to at least 5-10 users in discovery phase

### Premature Convergence
**Pitfall**: Converging on problem/solution too quickly
**Fix**: Use divergent techniques to expand thinking before narrowing

### No Iteration Planning
**Pitfall**: Treating Double Diamond as one-and-done
**Fix**: Plan for measurement and learning to inform next iteration

## Example: Food Delivery App Redesign

### Discovery Phase (Divergent)

**User Insights**:
- "I never know when my food will arrive - tracker says 10 minutes for 45 minutes"
- "I order the same meal every time because menu is overwhelming"
- "Restaurant photos never match what arrives"
- "I've learned to over-tip to get faster service"

**Problem Areas**:
- Unreliable delivery time estimates
- Decision fatigue from too many options
- Expectation mismatch on food quality
- Opacity in how service works

### Definition Phase (Convergent)

**Problem Statement**:
"Busy professionals using food delivery apps struggle to make confident ordering decisions and manage their time effectively because delivery estimates are unreliable and the abundance of options creates decision paralysis, resulting in anxiety, wasted time, and disappointment."

**Design Principles**:
1. **Predictable over optimistic**: Show realistic estimates, not wishful thinking
2. **Guide decisions, don't overwhelm**: Help users choose rather than showing everything
3. **Set accurate expectations**: Match experience to promise
4. **Reward trust**: Make service quality transparent and consistent

**Success Criteria**:
- 90% of deliveries arrive within 5 minutes of estimate
- Time to order completion reduced by 30%
- User satisfaction increased from 3.2 to 4.5 stars
- Repeat orders increased by 40%

### Development Phase (Divergent)

**Concepts Generated**:

1. **Time-First Ordering**: Choose delivery time first, see only restaurants that can meet it
2. **AI Meal Recommender**: Personal assistant suggests based on preferences and context
3. **Transparent Kitchen View**: Live view of food preparation and delivery status
4. **Social Ordering**: See what friends/neighbors are ordering right now
5. **Subscription Favorites**: Pre-schedule favorite meals at specific times
6. **Quality Guarantee**: Full refund if food doesn't match photos/description
7. **Delivery Time Auction**: Choose price vs. speed tradeoff explicitly

### Delivery Phase (Convergent)

**Selected Solution**: "Confident Ordering"

Combines elements from concepts 1, 2, 3, and 6:

**Key Features**:
1. **Time-First Flow**: Choose when you want to eat, see realistic restaurant options
2. **Smart Suggestions**: AI recommends 3 meals based on preferences, time, and context
3. **Live Transparency**: Real-time view of food preparation and driver location with accurate ETA
4. **Expectation Promise**: Photo verification and quality guarantee with instant refund

**Implementation Plan**:
- Phase 1: Time-first ordering flow (2 weeks)
- Phase 2: Accurate ETA algorithm (3 weeks)
- Phase 3: Smart meal suggestions (3 weeks)
- Phase 4: Live transparency features (2 weeks)
- Phase 5: Quality guarantee system (2 weeks)

**Success Metrics**:
- ETA accuracy (within 5 minutes)
- Order completion time
- User satisfaction scores
- Repeat order rate

## References

### Books
- **Design Thinking: Understanding How Designers Think and Work** by Nigel Cross (2011)
- **The Design of Everyday Things** by Don Norman (2013) - Foundational user-centered design
- **Sprint: How to Solve Big Problems and Test New Ideas in Just Five Days** by Jake Knapp (2016) - Compressed diamond approach

### Design Council Resources
- [Framework for Innovation: Design Council's Evolved Double Diamond](https://www.designcouncil.org.uk/our-work/skills-learning/tools-frameworks/framework-for-innovation-design-councils-evolved-double-diamond/)
- [What is the Double Diamond?](https://www.designcouncil.org.uk/our-resources/the-double-diamond/)
- [Design Methods for Developing Services](https://www.designcouncil.org.uk/our-resources/archive/articles/design-methods-developing-services/)

### Online Resources
- [IDEO Design Thinking](https://www.ideo.com/post/design-thinking) - Related design thinking approach
- [Stanford d.school](https://dschool.stanford.edu/) - Design thinking resources and methods
- [Nielsen Norman Group](https://www.nngroup.com/) - User experience research and best practices

### Tools and Templates
- [Double Diamond Template (Miro)](https://miro.com/templates/double-diamond/)
- [Design Thinking Toolkit (IDEO)](https://www.ideo.com/tools)
- [Service Design Tools](https://servicedesigntools.org/)

### Case Studies
- [Airbnb's Design-Led Transformation](https://www.designbetter.co/podcast/brian-chesky) - Joe Gebbia on design thinking
- [Gov.uk's User-Centered Design](https://gds.blog.gov.uk/category/design/) - Government service design
- [IBM Design Thinking](https://www.ibm.com/design/thinking/) - Enterprise design thinking approach

## License

Part of the Babysitter SDK Methodology Collection.

## Contributing

To enhance this methodology:
1. Add new example scenarios in `examples/` directory
2. Improve task definitions with better prompts
3. Update this README with new patterns and case studies
4. Submit pull request with detailed description

---

**Version**: 1.0.0
**Last Updated**: 2026-01-23
**Methodology**: Double Diamond
**Framework**: Babysitter SDK
