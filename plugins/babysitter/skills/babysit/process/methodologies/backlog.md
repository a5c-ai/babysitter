# Methodology Backlog

This document contains researched methodologies that can be adapted to the Babysitter SDK orchestration framework. Each methodology should be implemented in its own directory under `methodologies/[name]/`.

## Implementation Guidelines

### Directory Structure
```
methodologies/
├── [methodology-name]/
│   ├── README.md              # Overview and usage
│   ├── [workflow-name].js     # Main process workflow
│   ├── tasks/                 # Task definitions
│   │   ├── [task-name].js
│   │   └── ...
│   └── examples/              # Example inputs/outputs
│       ├── examples.json
│       └── ...
```

### File Patterns
- **Main Process**: `methodologies/[name]/[name].js` or `methodologies/[name].js` (for single-file)
- **JSDoc Required**: `@process`, `@description`, `@inputs`, `@outputs`
- **Export Pattern**: `export async function process(inputs, ctx) { ... }`
- **Task Definitions**: Use `defineTask` from `@a5c-ai/babysitter-sdk`
- **Breakpoints**: Use `ctx.breakpoint()` for human approval gates
- **Parallel Execution**: Use `ctx.parallel.all()` for independent tasks

---

## Priority Matrix

### 🔥 High Priority (Implement First)
**Process-heavy methodologies similar to Spec-Kit:**
1. **BDD/Specification by Example** - Executable specifications with Gherkin
2. **Domain-Driven Design (DDD)** - Strategic and tactical design patterns
3. **Feature-Driven Development (FDD)** - Feature-centric with parking lot tracking
4. **Example Mapping** - BDD workshop technique
5. **ATDD/TDD** - Test-driven development approaches
6. **Hypothesis-Driven Development** - Experimentation framework

### ⭐ Medium Priority (Modern Methodologies)
7. **Shape Up** - Modern 6-week cycle product development
8. **Kanban** - Pull system with WIP limits
9. **Extreme Programming (XP)** - Engineering practices framework
10. **Scrum** - Sprint-based iterative development
11. **Jobs to Be Done** - Outcome-focused development
12. **Impact Mapping** - Goal-to-feature traceability

### 📋 Classic Priority (Foundational Methodologies)
13. **Waterfall** - Sequential SDLC
14. **RUP (Rational Unified Process)** - Iterative with 4 phases
15. **Spiral Model** - Risk-driven iterative
16. **V-Model** - Verification and validation
17. **Cleanroom Software Engineering** ✅ - Formal methods with statistical testing
18. **Event Storming** - Domain modeling workshop
19. **Double Diamond** - Design thinking framework

---

## 1. Shape Up

**Creator**: Basecamp (Ryan Singer)
**Year**: Modern (2019)
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Product Development / Project Management

### Overview
Shape Up is Basecamp's methodology for building products through 6-week cycles with clear shaping, betting, and building phases. It emphasizes appetite-driven development, fixed time with variable scope, and small autonomous teams.

### Key Principles
- **Appetite not estimates**: Define how much time you want to spend, not how long it will take
- **Fixed time, variable scope**: 6-week cycles with cool-down periods
- **Shaping**: Abstract design work before committing resources
- **Betting Table**: Senior team decides what to build
- **Hill Charts**: Visual progress tracking (uphill = figuring out, downhill = executing)
- **Circuit Breaker**: If work isn't done in 6 weeks, it doesn't get extended automatically
- **No backlogs**: Work that doesn't get chosen gets discarded

### Implementation Plan

**Directory**: `methodologies/shape-up/`

**Files to Create**:
1. **`shape-up.js`** - Main orchestration process
   - Shaping phase (appetite definition, breadboarding, fat marker sketching)
   - Betting phase (pitch writing, betting table decision)
   - Building phase (scope mapping, hill chart tracking, QA integration)
   - Cool-down phase (cleanup, exploration)

### Tasks

1. Shape work at right abstraction level
   - Capture appetite (1-day, 2-week, 6-week)
   - Create breadboard (flow and affordances without visual design)
   - Fat marker sketches (rough UI concepts)
   - Identify rabbit holes and no-gos

2. Write formal pitch
   - Problem definition
   - Appetite statement
   - Solution sketch
   - Rabbit holes
   - No-gos

3. Break work into scopes
   - Identify scopes (integrated slices of the project)
   - Map dependencies between scopes
   - Track on hill chart

4. Track progress visually
   - Monitor uphill (unknown) vs downhill (known) progress
   - Identify stuck work
   - Trigger interventions

**Integration Points**:
- Use `ctx.breakpoint()` for betting table decisions
- Agent tasks for shaping and pitch writing
- Node tasks for generating hill chart visualizations
- Parallel execution for multiple scopes during building

### Sources
- [Shape Up book](https://basecamp.com/shapeup) (free online)
- [Basecamp articles](https://basecamp.com/articles)

---

## 2. Jobs to Be Done (JTBD)

**Creator**: Clayton Christensen (popularized by Intercom, Alan Klement)
**Year**: Modern framework (2016-present)
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Product Strategy / Requirements

### Overview
JTBD focuses on the progress customers are trying to make in their lives rather than on products or user personas. "People don't want a quarter-inch drill, they want a quarter-inch hole."

### Key Principles
- **Progress not products**: Understand the progress users want to make
- **Circumstances matter**: Context of the "job" is crucial
- **Switching triggers**: What causes someone to fire their current solution?
- **Forces diagram**: Push forces (problems), Pull forces (attraction), Anxiety (new solution), Habits (old solution)
- **Job stories over user stories**: "When [situation], I want to [motivation], so I can [outcome]"

### Implementation Plan

**Directory**: `methodologies/jobs-to-be-done/`

**Files to Create**:
1. **`jtbd.js`** - Main JTBD discovery and specification process
   - Job discovery (identify jobs)
   - Job framing (forces diagram analysis)
   - Job stories generation
   - Solution mapping

2. Discover customer jobs
   - Interview analysis
   - Struggle identification
   - Progress definition
   - Job clustering

3. Analyze forces
   - Push forces (current problems)
   - Pull forces (new solution appeal)
   - Anxiety forces (concerns about new solution)
   - Habits forces (comfort with current solution)

4. Convert jobs to job stories
   - Format: "When [situation], I want to [motivation], so I can [outcome]"
   - Avoid personas and demographics
   - Focus on causality and context

5. Map solutions to jobs
   - Feature-to-job mapping
   - Progress measurement
   - Success criteria

**Integration Points**:
- Compose with spec-driven-development (use job stories as requirements input)
- Use with brownfield analysis (understand why current solution exists)
- Agent tasks for interview analysis and job identification

### Sources
- [Intercom on Jobs to Be Done](https://www.intercom.com/resources/books/intercom-jobs-to-be-done)
- ["Competing Against Luck" by Clayton Christensen](https://www.christenseninstitute.org/books/competing-against-luck/)
- [JTBD.info](https://jtbd.info/)

---

## 3. Impact Mapping

**Creator**: Gojko Adzic
**Year**: Modern (2012)
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Strategic Planning / Requirements

### Overview
Impact Mapping is a strategic planning technique that prevents organizations from getting lost in implementation details. It creates a visual map connecting business goals to features through actors and impacts.

### Key Principles
- **Goal → Actor → Impact → Deliverable** hierarchy
- **Goal**: Why are we doing this? (Business objective)
- **Actor**: Who can create the impact? (Users, stakeholders)
- **Impact**: How should their behavior change? (Desired effect)
- **Deliverable**: What can we build? (Features, stories)
- **Visual mapping**: Tree structure showing relationships
- **Assumption tracking**: Mark assumptions for validation

### Implementation Plan

**Directory**: `methodologies/impact-mapping/`

**Files to Create**:
1. **`impact-mapping.js`** - Main impact mapping process
   - Goal definition
   - Actor identification
   - Impact analysis
   - Deliverable generation
   - Map visualization

### Tasks

1. Define measurable goal
   - Business objective
   - Success metrics
   - Timeline
   - Constraints

2. Identify actors
   - Primary actors (direct users)
   - Secondary actors (indirect beneficiaries)
   - Negative actors (opponents, competitors)

3. Define desired impacts
   - Behavioral changes
   - Measurable outcomes
   - Assumption flagging

4. Generate deliverables
   - Feature ideas
   - Prioritization by impact
   - Milestone planning

5. Create visual map
   - Tree structure (Mermaid/Graphviz)
   - Assumption markers
   - Progress tracking

**Integration Points**:
- Use impact map as input to spec-driven-development
- Combine with JTBD (actors and impacts align with jobs)
- Node task for generating visual maps
- Agent task for identifying assumptions

### Sources
- [Impact Mapping book](https://www.impactmapping.org/) (free online)
- [Impact Mapping workshop guide](https://www.impactmapping.org/drawing.html)

---

## 4. Event Storming

**Creator**: Alberto Brandolini
**Year**: Modern (2013)
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Domain Modeling / System Design

### Overview
Event Storming is a workshop-based method for rapidly exploring complex business domains. It uses sticky notes and a timeline to model domain events, commands, aggregates, and bounded contexts.

### Key Principles
- **Domain events first**: Focus on what happens (past tense: "Order Placed")
- **Color coding**: Orange (events), Blue (commands), Yellow (actors), Pink (external systems), Purple (policies), Green (read models)
- **Timeline layout**: Left to right, chronological flow
- **Hot spots**: Mark conflicts, questions, or problems with red notes
- **Big Picture → Process Modeling → Software Design**: Three levels of detail
- **Collaborative discovery**: Bring domain experts and developers together

### Implementation Plan

**Directory**: `methodologies/event-storming/`

**Files to Create**:
1. **`event-storming.js`** - Main event storming process
   - Big Picture storming
   - Process Modeling
   - Software Design
   - Bounded Context identification
   - Aggregates definition

### Tasks

1. Discover domain events
   - Chaotic exploration (add all events)
   - Enforce timeline (sort chronologically)
   - Identify hot spots
   - People and systems

2. Model key processes
   - Commands that trigger events
   - Policies (when event X, then command Y)
   - Read models
   - External systems

4. Design aggregates
   - Identify aggregates (clusters of events)
   - Define bounded contexts
   - Command handlers
   - Event handlers

5. Map bounded contexts
   - Context relationships
   - Shared kernel
   - Customer-supplier
   - Anti-corruption layer

6. Generate visual artifacts
   - Event flow diagrams
   - Context maps
   - Aggregate diagrams

**Integration Points**:
- Use discovered domain model as input to spec-driven-development
- Compose with brownfield analysis (understand existing domain model)
- Agent tasks for event discovery and aggregate identification
- Node tasks for diagram generation

### Sources
- [Event Storming book](https://leanpub.com/introducing_eventstorming)
- [Brandolini's blog](https://www.eventstorming.com/)
- [Awesome Event Storming](https://github.com/mariuszgil/awesome-eventstorming)

---

## 5. Hypothesis-Driven Development

**Creator**: Popularized by Lean Startup, practiced at Microsoft, Amazon
**Year**: Modern practice (2011-present)
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Experimentation / Validation

### Overview
Hypothesis-Driven Development treats every feature as an experiment. Instead of "building what the user asked for," teams form hypotheses about outcomes and measure whether features achieve them.

### Key Principles
- **Hypothesis format**: "We believe [building this feature] for [these people] will achieve [this outcome]. We'll know we're right when [measurable signal]."
- **Experiments over features**: Every feature is a test
- **Fail fast**: Invalidate bad ideas quickly
- **Metrics-driven**: Define success criteria upfront
- **A/B testing**: Compare treatments
- **Learning loop**: Hypothesis → Experiment → Measurement → Learning

### Implementation Plan

**Directory**: `methodologies/hypothesis-driven/`

**Files to Create**:
1. **`hypothesis-driven.js`** - Main hypothesis-driven development process
   - Hypothesis formulation
   - Experiment design
   - Build minimum testable feature
   - Deploy and measure
   - Analyze and decide
   - Iteration loop

2. Formulate testable hypothesis
   - "We believe..." (feature description)
   - "...for..." (target audience)
   - "...will achieve..." (outcome)
   - "...we'll know when..." (success metric)

3. Design experiment
   - Control group definition
   - Treatment group definition
   - Sample size calculation
   - Duration estimate
   - Instrumentation plan

4. Specify minimum testable version
   - Core hypothesis test
   - Cut all non-essential scope
   - Instrumentation requirements

5. Define measurement approach
   - Primary metrics
   - Secondary metrics
   - Counter metrics (watch for negative side effects)
   - Statistical significance criteria

6. Analyze results
   - Statistical analysis
   - Qualitative feedback
   - Decision: Persevere, Pivot, or Stop

7. Capture learnings
   - What we learned
   - Updated beliefs
   - Next hypothesis

**Integration Points**:
- Compose with spec-driven-development (hypothesis drives constitution and spec)
- Use with Shape Up (hypotheses inform appetite and scope)
- Requires instrumentation and analytics integration
- Agent tasks for hypothesis formulation and analysis
- Node/shell tasks for running statistical tests

### Sources
- [The Lean Startup by Eric Ries](http://theleanstartup.com/)
- [Microsoft's Experimentation Platform](https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/)
- [Booking.com's A/B testing practices](https://booking.design/how-booking-com-increases-the-power-of-online-experiments-with-cuped-995d186fff1d)

---

## 6. Double Diamond

**Creator**: British Design Council (2005)
**Year**: Established design thinking framework
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Design Thinking / Innovation

### Overview
Double Diamond represents the design thinking process through four phases: Discover, Define, Develop, Deliver. Two diamonds represent divergent (exploring) and convergent (focusing) thinking in problem and solution spaces.

### Key Principles
- **First Diamond (Problem Space)**: Discover → Define
  - Discover: Explore the problem broadly
  - Define: Narrow to specific problem statement
- **Second Diamond (Solution Space)**: Develop → Deliver
  - Develop: Explore many possible solutions
  - Deliver: Narrow to final solution and implement
- **Divergent thinking**: Generate many options
- **Convergent thinking**: Synthesize and choose
- **User-centered**: Keep user needs central
- **Iterative**: Repeat diamonds as needed

### Implementation Plan

**Directory**: `methodologies/double-diamond/`

**Files to Create**:
1. **`double-diamond.js`** - Main Double Diamond process
   - Discover phase
   - Define phase
   - Develop phase
   - Deliver phase
   - Iteration support

### Tasks

1. Discover (diverge on problem)
   - User research
   - Stakeholder interviews
   - Market analysis
   - Context mapping
   - Problem space exploration

2. Define (converge on problem)
   - Synthesis of research
   - Problem statement
   - Design principles
   - Success criteria
   - Constraints

4. Develop (diverge on solutions)
   - Ideation sessions
   - Sketching and prototyping
   - Multiple concepts
   - Technical feasibility

5. Deliver (converge on solution)
   - Solution selection
   - Detailed specification
   - Implementation planning
   - Delivery execution

6. Decide if another diamond needed
   - Review outcomes
   - Identify new unknowns
   - Scope next diamond

**Integration Points**:
- First diamond output feeds into spec-driven-development constitution
- Second diamond develops = spec-driven-development specification
- Compose with JTBD (discover phase includes job discovery)
- Agent tasks for research synthesis and ideation
- Breakpoints between phases

### Sources
- [Design Council's Double Diamond](https://www.designcouncil.org.uk/our-work/skills-learning/tools-frameworks/framework-for-innovation-design-councils-evolved-double-diamond/)
- [What is the Double Diamond?](https://www.designcouncil.org.uk/our-resources/the-double-diamond/)

---

## 7. BDD/Specification by Example

**Creator**: Dan North (BDD), Gojko Adzic (Specification by Example)
**Year**: Modern practice (2006-present)
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Requirements / Testing / Executable Specifications

### Overview
Behavior-Driven Development (BDD), also known as Specification by Example, captures requirements as concrete examples that illustrate how the system should behave in specific scenarios. These examples become executable specifications that serve as both documentation and automated tests.

### Key Principles
- **Three-step iterative process**: Discovery, Formulation, Automation
- **Shared understanding**: Business and development teams use the same words
- **Outside-in development**: Start with what users see and experience
- **Living documentation**: Requirements stay current because they're also tests
- **Gherkin DSL**: Given-When-Then format using natural language constructs
- **Discovery phase**: Concrete examples explore and clarify requirements
- **Formulation phase**: Examples become structured scenarios
- **Automation phase**: Scenarios become automated acceptance tests

### Implementation Plan

**Directory**: `methodologies/bdd-specification-by-example/`

**Files to Create**:
1. **`bdd-process.js`** - Main BDD workflow
   - Discovery workshop (Example Mapping style)
   - Formulation (Gherkin generation)
   - Automation (test generation)
   - Execution and reporting
   - Living documentation update

### Tasks

1. Collaborative discovery
   - Story analysis
   - Example generation with stakeholders
   - Rule identification
   - Question capture
   - Scope validation

2. Convert to Gherkin
   - Given-When-Then scenarios
   - Scenario outlines (data-driven)
   - Background steps
   - Tags for organization
   - Step reusability analysis

3. Generate step definitions
   - Parse Gherkin steps
   - Generate code stubs (Cucumber/SpecFlow/Behave)
   - Map to implementation
   - Identify reusable steps

4. Automate scenarios
   - Implement step definitions
   - Page Object patterns
   - Test data management
   - Assertion strategies

5. Generate documentation
   - Feature documentation from scenarios
   - Test result reporting
   - Coverage analysis
   - Traceability matrix

**Integration Points**:
- Perfect companion to spec-driven-development (BDD provides detailed acceptance criteria)
- Combine with Example Mapping for discovery phase
- Feeds into ATDD/TDD workflows
- Agent tasks for workshop facilitation and scenario generation
- Node/shell tasks for running Cucumber/SpecFlow/Behave

### Sources
- [Cucumber BDD Guide](https://cucumber.io/docs/bdd/)
- [BDD on Wikipedia](https://en.wikipedia.org/wiki/Behavior-driven_development)
- [Specification by Example by Gojko Adzic](https://gojko.net/books/specification-by-example/)
- [Monday.com BDD Guide 2026](https://monday.com/blog/rnd/behavior-driven-development/)
- [BrainHub BDD 2025](https://brainhub.eu/library/behavior-driven-development)

---

## 8. Domain-Driven Design (DDD)

**Creator**: Eric Evans
**Year**: Established (2003), still highly relevant
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Strategic Design / Tactical Design / Architecture

### Overview
Domain-Driven Design is an approach for building complex software systems that places the business domain at the center of development. It provides both strategic patterns for organizing large systems and tactical patterns for modeling domain logic.

### Key Principles
**Strategic Design (Problem Space)**:
- **Ubiquitous Language**: Shared vocabulary between domain experts and developers
- **Bounded Contexts**: Specific areas where a model/language is consistently used
- **Context Mapping**: Define relationships between bounded contexts
- **Subdomains**: Core (key differentiator), Supporting (necessary but not core), Generic (off-the-shelf)

**Tactical Design (Solution Space)**:
- **Entities**: Objects with unique identity (e.g., Customer, Order)
- **Value Objects**: Immutable values without identity (e.g., Money, Address)
- **Aggregates**: Clusters of entities/value objects treated as a unit
- **Repositories**: Abstract persistence of aggregates
- **Domain Services**: Operations that don't belong to entities
- **Domain Events**: Significant occurrences in the domain
- **Factories**: Complex object creation

### Implementation Plan

**Directory**: `methodologies/domain-driven-design/`

**Files to Create**:
1. **`ddd-process.js`** - Complete DDD workflow
   - Strategic design phase
   - Tactical design phase
   - Implementation phase
   - Continuous refinement

### Tasks

1. Strategic patterns
   - Subdomain identification (Core/Supporting/Generic)
   - Bounded context definition
   - Context mapping (relationships)
   - Ubiquitous language glossary

2. Tactical patterns
   - Entity identification
   - Value object design
   - Aggregate definition (boundaries, invariants)
   - Repository design
   - Domain service identification

4. Event modeling
   - Event storming integration
   - Event identification
   - Event handlers
   - Eventual consistency patterns

5. Language development
   - Term extraction from domain expert conversations
   - Glossary creation
   - Model/code alignment check
   - Evolution tracking

6. Implement context
   - Module structure
   - API boundaries
   - Anti-corruption layers
   - Integration patterns

**Integration Points**:
- Combine with Event Storming for strategic design
- Use with spec-driven-development (DDD provides domain model, spec provides implementation plan)
- Feeds into architecture decisions
- Agent tasks for domain modeling and pattern identification
- Outputs: Domain model, context maps, ubiquitous language glossary

### Sources
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [DDD on Wikipedia](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Microsoft's DDD for Microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)
- [Learning Domain-Driven Design (O'Reilly)](https://www.oreilly.com/library/view/learning-domain-driven-design/9781098100124/)

---

## 9. Feature-Driven Development (FDD)

**Creator**: Jeff De Luca and Peter Coad
**Year**: Established Agile (1997)
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Feature-Centric Agile / Progress Tracking

### Overview
FDD is an Agile methodology that organizes work around building small, client-valued features in short, predictable cycles. It emerged from managing a massive banking project with 50+ developers, combining the discipline needed for large projects with agile responsiveness.

### Key Principles
- **Five-step process**: Clear, sequential phases
  1. Develop Overall Model
  2. Build Features List
  3. Plan by Feature
  4. Design by Feature
  5. Build by Feature
- **Feature-centric**: Everything organized around delivering features
- **Parking Lot diagrams**: Visual progress tracking (colored boxes showing feature set status)
- **Regular builds**: 2-week iterations with working builds
- **Class ownership**: Individual developers own classes (reduces merge conflicts)
- **Feature teams**: Small teams (Chief Programmer + 2-5 developers)

### Implementation Plan

**Directory**: `methodologies/feature-driven-development/`

**Files to Create**:
1. **`fdd-process.js`** - Complete FDD workflow
   - Develop overall model
   - Build features list
   - Plan by feature
   - Design by feature (iterations)
   - Build by feature (iterations)
   - Parking lot reporting

### Tasks

1. Initial domain modeling
   - Domain walkthrough
   - Study documents
   - Build domain object model
   - Identify classes and relationships
   - Write class specifications

3. Feature decomposition
   - Identify major feature sets
   - Break into features (<action> <result> <object> format)
   - Feature prioritization
   - Organize into parking lot structure

4. Sequence and assign
   - Identify feature dependencies
   - Assign to Chief Programmers
   - Identify class owners
   - Schedule by 2-week iterations

5. Detailed design per feature
   - Refine object model
   - Sequence diagrams
   - Class and method design
   - Design inspection

6. Implement and test
   - Code implementation (class ownership)
   - Unit testing
   - Code inspection
   - Integration
   - Promote to build

7. Generate progress visualization
   - Feature set boxes with completion color
   - Percentage complete per set
   - Overall project status
   - Export as SVG/image

**Integration Points**:
- Use DDD for "Develop Overall Model" phase
- Combine with spec-driven-development (FDD provides feature breakdown)
- Parking lot diagrams can track tasks from any methodology
- Agent tasks for modeling and feature decomposition
- Node tasks for parking lot diagram generation

### Sources
- [Feature Driven Development Official](http://www.featuredrivendevelopment.com/)
- [FDD on Wikipedia](https://en.wikipedia.org/wiki/Feature-driven_development)
- [Monday.com FDD Guide 2026](https://monday.com/blog/rnd/feature-driven-development-fdd/)
- [FDD Parking Lot Diagrams](http://www.featuredrivendevelopment.com/node/1037)

---

## 10. Example Mapping

**Creator**: Matt Wynne (Cucumber Ltd)
**Year**: Modern BDD practice (2015)
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Requirements / BDD / Testing

### Overview
Example Mapping is a simple workshop technique for exploring and understanding requirements using colored cards. It bridges the gap between high-level user stories and low-level acceptance criteria.

### Key Principles
- **Four Colors**:
  - **Blue**: User Story (one per session)
  - **Yellow**: Rules/Acceptance Criteria (business rules that apply)
  - **Green**: Examples (concrete scenarios illustrating rules)
  - **Red**: Questions (unknowns, assumptions, risks)
- **25-minute timeboxed sessions**: If it takes longer, story is too big
- **Conversation over documentation**: Collaborative exploration
- **Outside-in**: Start with story, identify rules, illustrate with examples
- **Ready indicator**: Story is ready when questions are resolved and examples cover all rules

### Implementation Plan

**Directory**: `methodologies/example-mapping/`

**Files to Create**:
1. **`example-mapping.js`** - Example mapping session process
   - Story preparation
   - Collaborative session simulation
   - Rule extraction
   - Example generation
   - Question capture
   - Readiness assessment
   - Gherkin generation

2. Analyze user story
   - Story parsing
   - Initial complexity assessment
   - Scope clarification

3. Extract business rules
   - Identify acceptance criteria
   - Business rule discovery
   - Edge case identification

4. Generate concrete examples
   - Happy path examples
   - Edge case examples
   - Error case examples
   - Rule coverage check

5. Identify questions
   - Missing information
   - Assumptions to validate
   - Technical unknowns
   - Prioritize questions

6. Generate Gherkin scenarios
   - Given-When-Then format
   - Scenario outlines for data-driven tests
   - Tags for organization

7. Assess story readiness
   - Questions resolved?
   - Examples cover all rules?
   - Complexity appropriate?
   - Story splitting recommendations

**Integration Points**:
- Perfect precursor to spec-driven-development (examples become test cases)
- Compose with TDD Quality Convergence (examples drive tests)
- Use with GSD execution (map examples before implementing)
- Agent tasks for collaborative simulation
- Output: Structured examples ready for test implementation

### Sources
- [Cucumber Blog: Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/)
- [Matt Wynne's Example Mapping video](https://www.youtube.com/watch?v=VwvrGfWmG_U)
- [Example Mapping Webinar](https://cucumber.io/blog/bdd/example-mapping-webinar/)

---

## 11. ATDD/TDD (Test-Driven Development)

**Creator**: Kent Beck (TDD), Brian Marick (ATDD concepts)
**Year**: Established practice (1999-present)
**Priority**: 🔥 High
**Implementation Status**: ✅ Implemented
**Category**: Testing / Development Process

### Overview
Test-Driven Development (TDD) and Acceptance Test-Driven Development (ATDD) are feedback-driven, test-first approaches. ATDD focuses on acceptance-level tests defined by customers before development, while TDD focuses on unit-level tests written by developers. They work together: ATDD provides high-level acceptance criteria that guide development, while TDD helps implement code at the unit level.

### Key Principles
**TDD (Unit Level)**:
- **Red-Green-Refactor**: Write failing test → Make it pass → Refactor
- **Unit tests first**: Tests written before production code
- **Small iterations**: Tiny test-code cycles
- **Design emerges**: Tests drive better design

**ATDD (Acceptance Level)**:
- **Customer-defined criteria**: Business stakeholders define acceptance tests
- **Communication tool**: Bridge between customer, developer, and tester
- **Outside-in**: Start with acceptance tests, use TDD for implementation
- **Automated acceptance**: Tests become regression suite

### Implementation Plan

**Directory**: `methodologies/tdd-atdd/`

**Files to Create**:
1. **`tdd-atdd-process.js`** - Combined TDD/ATDD workflow
   - ATDD: Define acceptance criteria
   - ATDD: Write acceptance tests (failing)
   - TDD: Write unit test (failing)
   - TDD: Implement code (pass unit test)
   - TDD: Refactor
   - ATDD: Verify acceptance test passes
   - Integration and deployment

### Tasks

1. Define criteria
   - Collaborate with customers/stakeholders
   - Identify acceptance scenarios
   - Define success criteria
   - Example generation

3. Write acceptance tests
   - Generate test code from criteria
   - Setup test fixtures
   - Define assertions
   - Run (should fail initially)

4. Write unit tests
   - Identify units to test
   - Write failing unit test
   - Minimal test for one aspect
   - Run test suite

5. Implement minimum code
   - Write simplest code to pass test
   - No premature optimization
   - Focus on current test only
   - Run test (should pass)

6. Refactor with confidence
   - Remove duplication
   - Improve design
   - Maintain passing tests
   - Run full test suite

7. Verify acceptance
   - Run acceptance test suite
   - Verify all criteria met
   - Integration testing
   - Customer validation

**Integration Points**:
- ATDD feeds from BDD/Specification by Example (scenarios become acceptance tests)
- TDD nested inside ATDD cycle
- Combine with spec-driven-development (acceptance criteria from specification)
- Use with iterative convergence (test coverage as quality metric)
- Agent tasks for test generation
- Node/shell tasks for running test frameworks

### Sources
- [Test-Driven Development on Wikipedia](https://en.wikipedia.org/wiki/Test-driven_development)
- [ATDD on Wikipedia](https://en.wikipedia.org/wiki/Acceptance_test-driven_development)
- [Agile Alliance: ATDD](https://agilealliance.org/glossary/atdd/)
- [TDD vs BDD vs ATDD](https://www.browserstack.com/guide/tdd-vs-bdd-vs-atdd)

---

## 12. Waterfall

**Creator**: Winston W. Royce (1970)
**Year**: Classic SDLC
**Priority**: 📋 Classic
**Implementation Status**: ✅ Implemented
**Category**: Sequential SDLC

**Implementation Files**:
- `methodologies/waterfall/waterfall.js` - Main process with all inline task definitions
- `methodologies/waterfall/README.md` - Comprehensive documentation
- `methodologies/waterfall/examples/*.json` - 6 example input files

### Overview
The Waterfall model is a linear and sequential approach to software development. Progress flows in one direction (like a waterfall) through phases: requirements, design, implementation, testing, deployment, and maintenance. Each phase must be completed before the next begins.

### Key Principles
- **Sequential phases**: No phase overlap
- **Document-driven**: Heavy documentation at each phase
- **Phase gates**: Formal approval before proceeding
- **Requirements fixed early**: All requirements defined upfront
- **No backtracking**: Expensive to return to previous phases
- **Well-suited for**: Stable requirements, regulatory environments, clear specifications

**Six Phases**:
1. **Requirements**: Gather and document all requirements
2. **Design**: Define system architecture and detailed design
3. **Implementation**: Write code per design specifications
4. **Testing**: Test complete system (unit, integration, system)
5. **Deployment**: Release to production
6. **Maintenance**: Bug fixes and updates

### Implementation Plan

**Directory**: `methodologies/waterfall/`

**Files to Create**:
1. **`waterfall-process.js`** - Complete waterfall SDLC
   - Requirements gathering and analysis
   - System and software design
   - Implementation (coding)
   - Testing phase
   - Deployment
   - Maintenance planning

### Tasks

1. Comprehensive requirements
   - Stakeholder interviews
   - Requirements document (SRS)
   - Functional and non-functional requirements
   - Requirements review and approval

2. Architecture and design
   - High-level architecture
   - Component design
   - Database design
   - Interface design
   - Design document (SDD)

3. Sequential coding
   - Code per design specifications
   - Module-by-module implementation
   - Code reviews
   - Unit testing per module

4. Comprehensive testing
   - Integration testing
   - System testing
   - User acceptance testing (UAT)
   - Test documentation

5. Production release
   - Deployment planning
   - Production environment setup
   - Release execution
   - Post-deployment verification

6. Support planning
   - Maintenance procedures
   - Bug tracking process
   - Update management
   - End-of-life planning

**Integration Points**:
- Contrast with agile methodologies
- Use V-Model for testing strategy within waterfall
- Can compose waterfall phases with other methodologies (e.g., DDD for design phase)
- Agent tasks for documentation generation
- Breakpoints at phase gates for approvals

### Sources
- [Waterfall Model on Wikipedia](https://en.wikipedia.org/wiki/Waterfall_model)
- [SDLC Waterfall Model](https://www.tutorialspoint.com/sdlc/sdlc_waterfall_model.htm)
- [GeeksforGeeks: Waterfall Model](https://www.geeksforgeeks.org/software-engineering/waterfall-model/)

---

## 13. RUP (Rational Unified Process)

**Creator**: Rational Software (Grady Booch, Ivar Jacobson, James Rumbaugh)
**Year**: Established iterative process (1990s)
**Priority**: 📋 Classic
**Implementation Status**: ✅ Implemented
**Category**: Iterative / Use-Case Driven / Architecture-Centric

### Overview
The Rational Unified Process is an iterative software development framework created in the 1990s. It combines phases (Inception, Elaboration, Construction, Transition) with workflows (Business Modeling, Requirements, Analysis & Design, Implementation, Testing). RUP emphasizes iteration, risk management, and architecture-centric practices.

### Key Principles
- **Iterative development**: Software built incrementally through iterations
- **Risk-driven**: Risks drive the sequence of activities
- **Architecture-centric**: Establish solid architecture early
- **Use-case driven**: Use cases capture functional requirements
- **Four phases with iterations**: Each phase contains multiple iterations
- **Six core workflows**: Business Modeling, Requirements, Analysis & Design, Implementation, Testing, Deployment

**Four Phases**:
1. **Inception**: Define scope, estimate costs, identify risks, create business case
2. **Elaboration**: Detailed requirements, architecture definition, risk mitigation
3. **Construction**: Build software, most coding happens here, iterative development
4. **Transition**: Beta testing, deployment, user training, warranty period

### Implementation Plan

**Directory**: `methodologies/rup/`

**Files to Create**:
1. **`rup-process.js`** - Complete RUP workflow
   - Inception phase
   - Elaboration phase
   - Construction phase
   - Transition phase
   - Iteration management

### Tasks

1. Project initiation
   - Vision document
   - Business case
   - Risk list
   - Project plan
   - Initial use-case model

2. Architecture and planning
   - Detailed use cases
   - Architecture baseline
   - Risk mitigation
   - Refined project plan
   - Executable architecture prototype

4. Iterative build
   - Multiple iterations
   - Incremental builds
   - Beta releases
   - Testing and integration
   - User documentation

5. Deployment
   - Beta testing
   - Production deployment
   - User training
   - System tuning
   - Post-deployment support

6. Use-case driven development
   - Actor identification
   - Use case definition
   - Use case prioritization
   - Traceability to implementation

7. Plan iterations
   - Risk assessment
   - Iteration goals
   - Work allocation
   - Iteration review

**Integration Points**:
- Use cases can come from Impact Mapping or JTBD
- Architecture phase aligns with DDD strategic design
- Iterations can use TDD/ATDD within them
- Agent tasks for use-case generation and risk analysis
- Breakpoints at phase boundaries

### Sources
- [RUP on Wikipedia](https://en.wikipedia.org/wiki/Rational_unified_process)
- [GeeksforGeeks: RUP Phases](https://www.geeksforgeeks.org/software-engineering/rup-and-its-phases/)
- [ToolsHero: RUP Method](https://www.toolshero.com/information-technology/rational-unified-process-rup/)

---

## 14. Spiral Model

**Creator**: Barry Boehm (1986)
**Year**: Classic risk-driven (1988)
**Priority**: 📋 Classic
**Implementation Status**: ✅ Implemented
**Category**: Risk-Driven Iterative

### Overview
The Spiral Model is a risk-driven software development process model created by Barry Boehm in 1986. Development progresses in a spiral shape through multiple loops, where each loop represents a complete development cycle with four phases: Planning, Risk Analysis, Engineering, and Evaluation. It's designed for large, complex projects (6 months to 2 years).

### Key Principles
- **Risk-driven**: Risk analysis performed each iteration
- **Iterative spirals**: Multiple loops through the four phases
- **Flexible process**: Can incorporate elements of waterfall, incremental, evolutionary prototyping
- **Prototype-heavy**: Prototypes built in each iteration
- **Large project focus**: Intended for complex, high-risk projects
- **Regular assessment**: Continuous evaluation and course correction

**Four Phases per Spiral**:
1. **Planning**: Determine objectives, alternatives, constraints
2. **Risk Analysis**: Identify and resolve risks, build prototypes
3. **Engineering**: Develop and test the product
4. **Evaluation**: Customer evaluation, plan next iteration

### Implementation Plan

**Directory**: `methodologies/spiral-model/`

**Files to Create**:
1. **`spiral-process.js`** - Spiral iteration orchestration
   - Initialize spiral (iteration 1)
   - Loop through spirals
   - Planning phase
   - Risk analysis phase
   - Engineering phase
   - Evaluation phase
   - Convergence check

### Tasks

1. Objectives and alternatives
   - Define iteration objectives
   - Identify alternatives
   - Document constraints
   - Resource estimation

3. Risk identification and mitigation
   - Identify risks
   - Assess risk severity
   - Build prototypes for high-risk areas
   - Develop mitigation strategies
   - Go/no-go decision

4. Development
   - Design iteration
   - Implementation
   - Testing
   - Integration
   - Iteration deliverable

5. Customer feedback
   - Customer review
   - Stakeholder evaluation
   - Identify issues
   - Plan next spiral or conclude

6. Visualize spiral progress
   - Track radial distance (cost/effort)
   - Track angular progress (phase)
   - Generate spiral diagram
   - Risk heatmap

**Integration Points**:
- Risk analysis can use hypothesis-driven approach
- Engineering phase can use TDD/ATDD
- Prototyping aligns with Double Diamond develop phase
- Agent tasks for risk identification and evaluation
- Node tasks for spiral visualization

### Sources
- [Boehm's Original Paper (PDF)](https://www.cse.msu.edu/~cse435/Homework/HW3/boehm.pdf)
- [Spiral Model on Wikipedia](https://en.wikipedia.org/wiki/Spiral_model)
- [GeeksforGeeks: Spiral Model](https://www.geeksforgeeks.org/software-engineering-spiral-model/)

---

## 15. V-Model

**Creator**: Evolved from waterfall in the 1980s
**Year**: Classic verification/validation
**Priority**: 📋 Classic
**Implementation Status**: ✅ Implemented
**Category**: Verification & Validation / Testing

### Overview
The V-Model is an SDLC model where execution happens in a sequential V-shape. It's also known as the Verification and Validation model. The left side of the "V" represents decomposition of requirements and system specifications, while the right side represents integration and validation. Each development phase has a corresponding testing phase.

### Key Principles
- **Verification and Validation**: "Are you building it right?" (verification) vs "Are you building the right thing?" (validation)
- **Testing parallel to development**: Testing phases planned alongside development phases
- **V-shape mapping**: Requirements → Unit Tests, Design → Integration Tests, Architecture → System Tests
- **Early test planning**: Test design starts during corresponding dev phase
- **High discipline**: Rigorous documentation and phase completion
- **Best for**: Safety-critical systems (aerospace, automotive, healthcare)

**V-Model Phases**:
**Left side (Development)**:
1. Requirements Analysis → Acceptance Testing
2. System Design → System Testing
3. Architectural Design → Integration Testing
4. Module Design → Unit Testing

**Bottom**: Implementation (Coding)

**Right side (Testing)**: Tests execute in reverse order

### Implementation Plan

**Directory**: `methodologies/v-model/`

**Files to Create**:
1. **`v-model-process.js`** - Complete V-Model workflow
   - Left side (decomposition)
   - Bottom (implementation)
   - Right side (integration/validation)
   - Traceability tracking

### Tasks

1. Requirements + Acceptance test design
   - Requirements gathering
   - Design acceptance test cases
   - Define validation criteria
   - Requirements-to-test traceability

3. System design + System test design
   - High-level system design
   - Design system test cases
   - Integration strategy
   - Design-to-test traceability

4. Architecture + Integration test design
   - Detailed architectural design
   - Design integration test cases
   - Interface specifications
   - Architecture-to-test traceability

5. Module design + Unit test design
   - Detailed module design
   - Design unit test cases
   - Code-level specifications
   - Module-to-test traceability

6. Coding phase
   - Implement modules
   - Code reviews
   - Static analysis
   - Coding standards compliance

7. Execute right side of V
   - Unit tests
   - Integration tests
   - System tests
   - Acceptance tests
   - Defect tracking and resolution

8. Generate traceability
   - Requirements-to-tests mapping
   - Coverage analysis
   - Gap identification
   - Compliance reporting

**Integration Points**:
- Use within Waterfall for testing strategy
- Combine with TDD (unit tests) and ATDD (acceptance tests)
- V-Model test design can use Example Mapping
- Agent tasks for test case generation
- Critical for compliance-heavy domains

### Sources
- [V-Model on Wikipedia](https://en.wikipedia.org/wiki/V-model)
- [SDLC V-Model](https://www.tutorialspoint.com/sdlc/sdlc_v_model.htm)
- [TeachingAgile: V-Model](https://teachingagile.com/sdlc/models/v-model/)

---

## 16. Cleanroom Software Engineering

**Creator**: Harlan Mills and colleagues at IBM
**Year**: Classic formal methods (1980s)
**Priority**: 📋 Classic
**Implementation Status**: ✅ Implemented
**Category**: Formal Methods / Statistical Testing

### Overview
Cleanroom Software Engineering is a process intended to produce software with certifiable reliability. It combines mathematically-based methods of software specification, design, and correctness verification with statistical usage testing. The name evokes semiconductor cleanrooms - preventing defect introduction rather than removing defects.

### Key Principles
- **Defect prevention over defect removal**: Focus on not introducing bugs
- **Formal methods**: Mathematical specification and verification
- **No unit testing by developers**: Developers verify code mentally/formally, don't execute it
- **Statistical usage testing**: Test based on anticipated customer usage patterns
- **Incremental development**: Small increments with statistical quality control
- **Box structures**: Black box (behavior), State box (state), Clear box (procedure)
- **Correctness verification**: Formal proof of program correctness

### Implementation Plan

**Directory**: `methodologies/cleanroom/`

**Files to Create**:
1. **`cleanroom-process.js`** - Complete Cleanroom workflow
   - Formal specification
   - Incremental development planning
   - Design with correctness verification
   - Statistical test planning
   - Usage modeling
   - Statistical testing execution
   - Certification

### Tasks

1. Mathematical specification
   - Black box specifications (external behavior)
   - State box specifications (state transitions)
   - Formal notation
   - Specification review

3. Plan increments
   - Define increment boundaries
   - Sequence increments
   - Statistical quality objectives
   - Certification requirements

4. Design with correctness proof
   - Structured programming (no GOTOs)
   - Clear box design (procedure)
   - Correctness arguments
   - Formal verification
   - Design review

5. Model customer usage
   - Identify usage scenarios
   - Probability distribution of usage
   - Markov chain model
   - Test case generation from usage model

6. Execute statistical tests
   - Generate test cases from usage model
   - Execute tests
   - Track failures
   - Calculate MTTF (Mean Time To Failure)
   - Reliability growth modeling

7. Certify reliability
   - Statistical analysis
   - Reliability certification
   - Quality metrics
   - Certification report

**Integration Points**:
- Extreme contrast to TDD (no unit testing by developers)
- Can combine formal specification with spec-driven-development
- Usage modeling aligns with JTBD (job scenarios → usage scenarios)
- Agent tasks for formal verification assistance
- Statistical analysis via node tasks
- Best for high-reliability/safety-critical systems

### Sources
- [Cleanroom Software Engineering on Wikipedia](https://en.wikipedia.org/wiki/Cleanroom_software_engineering)
- [GeeksforGeeks: Cleanroom Testing](https://www.geeksforgeeks.org/software-engineering-cleanroom-testing/)
- [NASA Technical Reports: Cleanroom Development](https://ntrs.nasa.gov/citations/19820016143)

---

## 17. Kanban

**Creator**: Adapted from Toyota Production System by David J. Anderson (2007)
**Year**: Modern flow-based (2007-present)
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Flow Management / Continuous Delivery

### Overview
Kanban is a visual workflow management method for defining, managing, and improving services that deliver knowledge work. It emphasizes visualizing work, limiting work-in-progress (WIP), managing flow, and continuous improvement. Unlike sprint-based approaches, Kanban is continuous flow.

### Key Principles
- **Visualize workflow**: Kanban board with columns representing stages
- **Limit WIP**: Explicit limits on work items per stage
- **Manage flow**: Focus on smooth, predictable flow
- **Make policies explicit**: Clear rules for moving work
- **Feedback loops**: Regular reviews (daily standups, replenishment meetings, retrospectives)
- **Improve collaboratively**: Evolve process experimentally
- **Pull system**: Work pulled when capacity available, not pushed

### Implementation Plan

**Directory**: `methodologies/kanban/`

**Files to Create**:
1. **`kanban-process.js`** - Kanban workflow orchestration
   - Board initialization
   - WIP limit configuration
   - Flow management loop
   - Metrics tracking (cycle time, throughput, lead time)
   - Continuous improvement

### Tasks

1. Setup Kanban board
   - Define workflow stages (columns)
   - Set WIP limits per column
   - Define card structure
   - Swimlanes (if needed)
   - Board policies

2. Manage WIP limits
   - Monitor WIP per column
   - Enforce limits
   - Identify bottlenecks
   - Signal pull availability

3. Implement pull
   - Detect capacity available (WIP < limit)
   - Pull from upstream column
   - Respect dependencies
   - Flow-based prioritization

5. Track flow metrics
   - Cycle time (how long work takes)
   - Lead time (customer perspective time)
   - Throughput (work items completed per period)
   - Cumulative flow diagram
   - Aging work identification

6. Prioritize new work
   - Review backlog
   - Prioritize items
   - Pull into "Ready" column
   - Capacity-based commitment

7. Continuous improvement
   - Review metrics
   - Identify impediments
   - Experiment with changes
   - Update policies

**Integration Points**:
- Kanban can orchestrate task execution from any methodology
- Use with GSD (Kanban board tracks GSD tasks)
- Use with spec-driven-development (features flow through Kanban)
- FDD parking lots provide macro view, Kanban provides detailed flow
- Agent tasks for bottleneck analysis
- Node tasks for metrics visualization

### Sources
- [Kanban Method](https://kanbantool.com/kanban-method)
- [Atlassian: Working with WIP Limits](https://www.atlassian.com/agile/kanban/wip-limits)
- [Kanban Pull Systems](https://kanbantool.com/kanban-guide/pull-systems)
- [Kanban WIP Limits Guide](https://businessmap.io/kanban-resources/getting-started/what-is-wip)

---

## 18. Extreme Programming (XP)

**Creator**: Kent Beck, Ward Cunningham, Ron Jeffries
**Year**: Established Agile (1996-present)
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Agile Engineering Practices

### Overview
Extreme Programming (XP) is an agile software development methodology that advocates frequent releases in short development cycles to improve productivity and responsiveness to changing requirements. XP emphasizes engineering practices and takes best practices to "extreme" levels.

### Key Principles
**12 Core Practices grouped into four areas**:

**Fine-scale feedback**:
- Pair Programming
- Planning Game
- Test-Driven Development
- Whole Team

**Continuous Process**:
- Continuous Integration
- Refactoring
- Small Releases

**Shared Understanding**:
- Coding Standards
- Collective Code Ownership
- Simple Design
- System Metaphor

**Programmer Welfare**:
- Sustainable Pace (40-hour week)

### Implementation Plan

**Directory**: `methodologies/extreme-programming/`

**Files to Create**:
1. **`xp-process.js`** - Complete XP workflow
   - Release planning
   - Iteration planning
   - Daily practice (pair programming, TDD, CI)
   - Iteration completion
   - Release completion
   - Retrospective

### Tasks

1. Plan release
   - User story creation
   - Story estimation (story points)
   - Release scope definition
   - Velocity planning

3. Plan iteration
   - Select stories for iteration
   - Break stories into tasks
   - Task estimation (hours)
   - Team commitment

4. Pair programming facilitation
   - Pair assignment
   - Driver/navigator rotation
   - Pairing session tracking
   - Knowledge sharing metrics

5. TDD enforcement
   - Red-Green-Refactor cycle
   - Test coverage tracking
   - Fast test execution
   - Test quality metrics

6. CI pipeline
   - Frequent commits (multiple per day)
   - Automated build
   - Automated test execution
   - Immediate feedback
   - Fix broken builds immediately

7. Continuous refactoring
   - Code smell detection
   - Refactoring opportunities
   - Maintain test coverage during refactoring
   - Collective code ownership

8. Daily standup
   - Yesterday's progress
   - Today's plan
   - Impediments
   - Pair assignments

**Integration Points**:
- XP practices enhance any development methodology
- TDD practice is the same as TDD methodology
- Combine with spec-driven-development (XP provides implementation practices)
- Pair programming can be used during GSD execute phase
- Agent tasks for code smell detection
- CI automation via node/shell tasks

### Sources
- [Extreme Programming on Wikipedia](https://en.wikipedia.org/wiki/Extreme_programming)
- [Monday.com: Extreme Programming 2026](https://monday.com/blog/rnd/extreme-programming/)
- [XP Practices on Wikipedia](https://en.wikipedia.org/wiki/Extreme_programming_practices)
- [Agile Alliance: XP](https://agilealliance.org/glossary/xp/)

---

## 19. Scrum

**Creator**: Ken Schwaber and Jeff Sutherland
**Year**: Dominant Agile framework (1995-present)
**Priority**: ⭐ Medium
**Implementation Status**: ✅ Implemented
**Category**: Agile Sprint-Based Framework

### Overview
Scrum is an agile framework for developing, delivering, and sustaining complex products through iterative progress via sprints (timeboxed iterations, typically 2 weeks). It defines roles (Product Owner, Scrum Master, Development Team), artifacts (Product Backlog, Sprint Backlog, Increment), and events (Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective).

### Key Principles
- **Empiricism**: Decisions based on observation and experimentation
- **Transparency**: Significant aspects visible to those responsible for outcome
- **Inspection**: Regular inspection toward Sprint Goal
- **Adaptation**: Adjust process when inspection reveals unacceptable deviation
- **Fixed-length sprints**: No changes during sprint that endanger Sprint Goal
- **Cross-functional teams**: Team has all skills needed
- **Self-organizing teams**: Team chooses how to best accomplish work

**Three Roles**:
1. **Product Owner**: Maximizes product value, manages Product Backlog
2. **Scrum Master**: Facilitates Scrum, removes impediments
3. **Development Team**: Delivers potentially releasable Increment

**Five Events**:
1. **Sprint**: Container for all events (1-4 weeks, commonly 2 weeks)
2. **Sprint Planning**: Plan work for sprint (max 8 hours for 1-month sprint)
3. **Daily Scrum**: 15-minute daily synchronization
4. **Sprint Review**: Inspect Increment, adapt Product Backlog
5. **Sprint Retrospective**: Plan improvements for next sprint

### Implementation Plan

**Directory**: `methodologies/scrum/`

**Files to Create**:
1. **`scrum-process.js`** - Complete Scrum framework
   - Product backlog management
   - Sprint loop orchestration
   - Sprint planning
   - Daily scrums
   - Sprint review
   - Sprint retrospective
   - Increment delivery

### Tasks

1. Groom Product Backlog
   - Add detail to Product Backlog Items (PBIs)
   - Estimate PBIs (story points, t-shirt sizes)
   - Order backlog by value
   - Acceptance criteria definition

3. Plan sprint
   - Define Sprint Goal
   - Select PBIs for sprint
   - Forecast capacity
   - Create Sprint Backlog (tasks)
   - Commitment

4. Daily standup
   - What did I do yesterday?
   - What will I do today?
   - Any impediments?
   - Update burndown
   - Re-plan as needed

5. Review increment
   - Demo completed work
   - Stakeholder feedback
   - Discuss what is Done
   - Update Product Backlog
   - Review timeline and budget

6. Improve process
   - What went well?
   - What could be improved?
   - What will we commit to improve?
   - Create improvement backlog items

7. Track progress
   - Sprint burndown chart
   - Velocity tracking
   - Release burndown
   - Predictability metrics

8. Establish DoD
   - Code complete
   - Tests passing
   - Code reviewed
   - Documentation updated
   - Acceptance criteria met
   - Potentially shippable

**Integration Points**:
- Scrum can orchestrate any development methodology within sprints
- Use TDD/ATDD for development within sprint
- Use BDD for backlog refinement (PBIs become scenarios)
- Combine with Kanban (Scrumban) for flow optimization
- XP practices work well within Scrum sprints
- Agent tasks for backlog grooming and estimation
- Node tasks for burndown visualization

### Sources
- [Official Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Scrum on Wikipedia](https://en.wikipedia.org/wiki/Scrum_(project_management))
- [Scrum.org: What is Sprint Retrospective](https://www.scrum.org/resources/what-is-a-sprint-retrospective)
- [Asana: Scrum Template 2026](https://asana.com/templates/scrum)

---

## Cross-Methodology Compositions

Some powerful combinations:

### Specification & Testing Chains
1. **Example Mapping → BDD → ATDD/TDD**: Map examples → Generate Gherkin scenarios → Acceptance tests → TDD implementation
2. **DDD + Event Storming → BDD**: Domain discovery → Strategic design → Executable specifications
3. **V-Model + ATDD/TDD**: V-Model structure with test-first practices at each level

### Product Development Chains
4. **JTBD → Impact Mapping → Spec-Kit**: Discover jobs → Map impacts → Specify solution → Implement with quality gates
5. **Shape Up + Hypothesis-Driven + Example Mapping**: Shape with hypotheses → Bet on experiments → Map examples → Build and measure in 6-week cycles
6. **Double Diamond + DDD + FDD**: Discover problem → Define solution → DDD design → FDD implementation with parking lots

### Agile Combinations
7. **Scrum + XP Practices**: Sprint framework with pair programming, TDD, CI practices
8. **Scrum + Kanban (Scrumban)**: Sprint planning with continuous flow and WIP limits
9. **FDD + Kanban**: Feature breakdown with parking lots + Kanban board for detailed flow tracking

### Enterprise & Complex Systems
10. **RUP + DDD**: Use-case driven iterations with domain-driven strategic design
11. **Spiral Model + Hypothesis-Driven**: Risk-driven spirals with experimental validation
12. **Waterfall + V-Model**: Sequential phases with comprehensive verification/validation strategy

### Quality & Compliance
13. **Cleanroom + V-Model**: Formal methods with structured testing approach (ultra-high reliability)
14. **Spec-Kit + V-Model**: Constitution-driven specifications with V-Model testing rigor
15. **BDD + TDD + CI (XP)**: Living documentation with test-driven development and continuous integration

---

## Practical Composition Examples

Real-world scenarios showing how to combine methodologies for specific project types.

### Example 1: E-Commerce Platform Feature - "Smart Product Recommendations"

**Scenario**: Add AI-powered product recommendations to existing e-commerce platform

**Composition**: BDD + DDD + Hypothesis-Driven + Kanban

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **BDD Discovery**: Example Mapping workshop with product team
   - User story: "As a shopper, I want personalized recommendations so I can discover products I'll love"
   - Rules: Show recommendations based on browsing history, purchase history, similar users
   - Examples: New user (show trending), returning user (show related items), etc.
   - Questions: What's the cold start strategy? How do we measure success?

2. **DDD Strategic Design**: Identify bounded contexts
   - Recommendation Engine context (core domain)
   - User Profile context (supporting)
   - Product Catalog context (supporting)
   - Define context map and integration patterns

3. **Hypothesis-Driven Development**: Frame as experiment
   - Hypothesis: "We believe showing AI recommendations on product pages for logged-in users will increase average order value by 15%. We'll know we're right when we see AOV increase after 2 weeks."
   - Design A/B test (control vs. treatment)
   - Define metrics: AOV, click-through rate, conversion rate

4. **BDD Formulation**: Generate Gherkin scenarios
   ```gherkin
   Scenario: Logged-in user sees personalized recommendations
     Given I am a logged-in user
     And I am viewing a laptop product page
     When the page loads
     Then I should see "Recommended for you" section
     And I should see 4 related products
     And recommendations should be based on my browsing history
   ```

5. **Kanban Flow**: Track work through board
   - Columns: Backlog → Ready → In Progress (WIP=3) → Review → Testing → Done
   - Pull work as capacity available
   - Track cycle time and throughput

**Artifacts**:
- Example map (colored cards)
- Gherkin scenarios
- Context map diagram
- Hypothesis document
- A/B test plan
- Kanban board with metrics

**Why This Combination?**:
- BDD ensures clear, testable requirements
- DDD manages complexity of multiple contexts
- Hypothesis-Driven validates business value
- Kanban provides continuous flow (no sprints needed)

---

### Example 2: Healthcare Patient Portal - HIPAA Compliant

**Scenario**: Build patient portal for hospital system (greenfield)

**Composition**: V-Model + DDD + Cleanroom + Waterfall

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **Waterfall Requirements Phase**:
   - Comprehensive requirements gathering (HIPAA, security, functional)
   - Stakeholder interviews (doctors, nurses, patients, administrators)
   - Requirements Specification Document (SRS)
   - Formal approval gate

2. **DDD Strategic Design**:
   - Identify bounded contexts: Patient Management, Appointment Scheduling, Medical Records, Billing, Communication
   - Define ubiquitous language with domain experts
   - Context mapping (upstream/downstream relationships)
   - Identify core vs. supporting vs. generic subdomains

3. **V-Model Test Planning** (parallel to requirements/design):
   - Requirements → Acceptance test design (UAT scenarios)
   - System design → System test design (integration tests)
   - Architecture → Integration test design (API tests)
   - Module design → Unit test design (component tests)
   - Traceability matrix (requirements → tests)

4. **Cleanroom Formal Specification** (for critical components):
   - Authentication/Authorization module (formal specification)
   - Data encryption module (formal specification)
   - Audit logging module (formal specification)
   - Correctness verification through inspection
   - No unit testing by developers (formal verification instead)

5. **Waterfall Implementation Phase**:
   - Sequential development per approved design
   - Code reviews for each module
   - Documentation throughout

6. **V-Model Testing Phase** (right side of V):
   - Unit tests (execute pre-designed tests)
   - Integration tests (API and context boundaries)
   - System tests (end-to-end scenarios)
   - Acceptance tests (UAT with stakeholders)

7. **Cleanroom Statistical Testing**:
   - Usage model based on patient workflows
   - Statistical test case generation
   - Reliability certification (MTTF calculation)

**Artifacts**:
- SRS (Requirements Specification)
- SDD (System Design Document)
- Context maps and bounded context documentation
- Formal specifications (for critical modules)
- Complete test suite with traceability matrix
- Reliability certification report
- HIPAA compliance documentation

**Why This Combination?**:
- Waterfall appropriate for regulated environment
- V-Model ensures comprehensive testing at all levels
- DDD manages complex healthcare domain
- Cleanroom provides certifiable reliability for critical components
- Heavy documentation required for compliance

---

### Example 3: Startup MVP - "Fitness Tracking App"

**Scenario**: Build MVP for new fitness tracking mobile app (greenfield, fast-moving)

**Composition**: Shape Up + Example Mapping + TDD + Scrum

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **Shape Up: Shaping Phase** (pre-sprint):
   - Define appetite: 2-week shape (not 6-week due to startup pace)
   - Breadboarding: Core user flows (workout logging, progress charts)
   - Fat marker sketches: Low-fidelity UI concepts
   - Identify rabbit holes: "Don't build social features yet"
   - Write pitch document

2. **Shape Up: Betting Table**:
   - Founders and tech lead review pitch
   - Decision: Bet on it or pass
   - If bet → proceed to Scrum implementation

3. **Scrum Sprint Planning**:
   - Sprint Goal: "Users can log workouts and see progress"
   - Product Owner presents backlog items from Shape Up pitch
   - Break pitch into user stories
   - Team estimates with story points
   - Commitment to sprint scope

4. **Example Mapping** (backlog refinement):
   - For each user story, run 25-minute Example Mapping session
   - Blue card: "As a user, I want to log a workout"
   - Yellow cards: Rules (must have workout type, duration, date; optional notes)
   - Green cards: Examples (log run with distance, log yoga without distance, edit past workout)
   - Red cards: Questions (Can users delete workouts? What about offline mode?)

5. **TDD Implementation** (during sprint):
   - For each example, write failing acceptance test
   - Red-Green-Refactor cycle:
     - Red: Write failing test
     - Green: Implement minimum code to pass
     - Refactor: Clean up code
   - Continuous integration (run tests on every commit)

6. **Scrum Daily Standup**:
   - What I did yesterday
   - What I'm doing today
   - Impediments
   - Update burndown chart

7. **Scrum Sprint Review**:
   - Demo working software to stakeholders
   - Gather feedback
   - Adapt Product Backlog based on learnings

8. **Scrum Sprint Retrospective**:
   - What went well
   - What could improve
   - Action items for next sprint

9. **Shape Up: Cool-Down** (between shapes):
   - Fix bugs
   - Refactor
   - Explore next features
   - No formal commitments

**Artifacts**:
- Shape Up pitch document with breadboards and sketches
- Product Backlog
- Example maps for each story
- Sprint Backlog with tasks
- Test suite (acceptance and unit tests)
- Burndown chart
- Working software increment

**Why This Combination?**:
- Shape Up provides appetite-driven scoping (prevents over-engineering)
- Scrum provides sprint structure for team coordination
- Example Mapping clarifies requirements quickly
- TDD ensures quality without sacrificing speed
- Good balance of planning and agility for startup pace

---

### Example 4: Legacy Banking System Modernization

**Scenario**: Refactor monolithic banking system to microservices architecture (brownfield)

**Composition**: Event Storming + DDD + FDD + Strangler Fig Pattern + RUP

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **RUP Inception Phase**:
   - Define vision: Modernize core banking to microservices
   - Business case (reduce tech debt, enable new features faster)
   - Risk assessment (data migration, zero downtime requirement)
   - High-level project plan

2. **Event Storming: Big Picture**:
   - Workshop with domain experts, developers, operations
   - Map ALL domain events across entire banking system
   - Orange stickies: Account Opened, Funds Transferred, Loan Approved, Payment Processed, etc.
   - Timeline layout (chronological flow)
   - Identify hot spots (conflicts, questions, risks in red)

3. **DDD Strategic Design**:
   - From Event Storming, identify bounded contexts:
     - Account Management
     - Payment Processing
     - Loan Management
     - Customer Management
     - Fraud Detection
   - Define context map
   - Identify core vs. supporting domains
   - Plan anti-corruption layers (for legacy integration)

4. **RUP Elaboration Phase**:
   - Detail use cases for each bounded context
   - Architecture baseline: Microservices with event-driven communication
   - Detailed risk mitigation plan
   - Iteration plan for construction phase

5. **FDD: Develop Overall Model** (per bounded context):
   - Domain object model for Payment Processing context
   - Classes: Payment, PaymentMethod, Transaction, Account, etc.
   - Relationships and rules

6. **FDD: Build Features List**:
   - Feature format: <action> <result> <object>
   - Examples:
     - "Calculate the total of a payment transaction"
     - "Validate the payment method for a customer"
     - "Process a credit card payment"
     - "Record a payment transaction"
   - Group into feature sets for parking lot diagram

7. **FDD: Plan by Feature**:
   - Sequence features (dependencies)
   - Assign to Chief Programmers
   - 2-week iterations

8. **Strangler Fig Pattern** (throughout construction):
   - Identify seams in monolith
   - Route new features to microservices
   - Gradually migrate existing features
   - Run monolith and microservices in parallel
   - Eventually retire monolith

9. **FDD: Design by Feature & Build by Feature** (iterative):
   - Detailed design for feature
   - Code inspection
   - Build feature
   - Code inspection again
   - Unit tests
   - Integration with event bus
   - Promote to build

10. **FDD: Parking Lot Reporting**:
    - Visual dashboard showing feature set completion
    - Color coding: White (not started), Yellow (in progress), Green (complete), Red (blocked/late)
    - High-level view for stakeholders

11. **RUP Transition Phase**:
    - Beta testing with select customers
    - Gradual rollout (1% → 10% → 50% → 100%)
    - Training for operations team
    - Final production deployment
    - Post-deployment support

**Artifacts**:
- Event storm (timeline of domain events)
- Context maps and bounded context documentation
- Architecture baseline (microservices design)
- Use case models
- Domain object models per context
- Feature list with parking lot diagram
- Strangler fig migration roadmap
- Microservices per bounded context
- Event-driven communication layer
- Deployment pipeline

**Why This Combination?**:
- Event Storming reveals domain complexity and identifies contexts
- DDD strategic design organizes microservices architecture
- FDD provides feature-centric tracking (critical for large refactor)
- Strangler Fig enables safe incremental migration
- RUP provides phase structure for enterprise governance
- Parking lots provide executive visibility

---

### Example 5: SaaS Product New Feature - "Advanced Analytics Dashboard"

**Scenario**: Add analytics dashboard to existing SaaS product (brownfield, B2B customers)

**Composition**: JTBD + Impact Mapping + Spec-Kit + Kanban + XP Practices

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **JTBD Discovery**:
   - Customer interviews: What job are they hiring analytics for?
   - Job: "When I need to report to executives, I want to quickly understand product usage trends, so I can make data-driven decisions"
   - Forces analysis:
     - Push: Current reports are manual and time-consuming
     - Pull: Automated dashboard with key metrics
     - Anxiety: Will dashboard have metrics I need? Learning curve?
     - Habits: Comfortable with current Excel reports

2. **JTBD Job Stories**:
   - "When I'm preparing for executive meeting, I want to see monthly active users trend, so I can report on growth"
   - "When I notice a metric drop, I want to drill down by customer segment, so I can identify the cause"
   - "When I need to share insights, I want to export charts, so I can include in presentations"

3. **Impact Mapping**:
   - Goal: Increase customer retention by 10% through better insights
   - Actors:
     - Customer Success Managers (primary)
     - Product Managers (secondary)
     - Executives (tertiary)
   - Impacts:
     - CSMs identify at-risk customers earlier
     - PMs understand feature adoption
     - Executives have visibility into product health
   - Deliverables:
     - Usage trend dashboard
     - Cohort analysis view
     - Alert system for anomalies
     - Export functionality

4. **Spec-Kit: Constitution**:
   - Performance: Dashboard loads < 3 seconds, queries < 1 second
   - UX: Intuitive, no training required, mobile-responsive
   - Data: Real-time (< 5 min latency), accurate, secure (role-based access)
   - Quality: 90% test coverage, accessibility (WCAG AA)

5. **Spec-Kit: Specification**:
   - User stories derived from job stories and impact map
   - Detailed acceptance criteria per story
   - Data model for analytics
   - API specifications
   - UI mockups

6. **Spec-Kit: Quality Checklist**:
   - Checklist for specification:
     - ☐ All job stories addressed
     - ☐ Performance targets specified
     - ☐ Security requirements defined
     - ☐ Accessibility criteria included
     - ☐ Edge cases covered
   - Validation against checklist

7. **Spec-Kit: Plan**:
   - Phase 1: Data pipeline (collect and aggregate data)
   - Phase 2: Core dashboard UI
   - Phase 3: Drill-down and filtering
   - Phase 4: Alerts and exports
   - Dependencies identified

8. **Spec-Kit: Tasks**:
   - Break plan into implementable tasks
   - Task dependencies
   - Estimation

9. **Kanban Board Setup**:
   - Columns: Backlog → Design → Dev (WIP=3) → Code Review → QA → Done
   - Tasks flow through board
   - WIP limits enforced
   - Pull when capacity available

10. **XP Practices** (during implementation):
    - **Pair Programming**: Complex dashboard logic built in pairs
    - **TDD**: Write tests first for data aggregation logic
    - **Continuous Integration**: Automated tests run on every commit
    - **Refactoring**: Continuous improvement of codebase
    - **Coding Standards**: Consistent code style
    - **Collective Code Ownership**: Any developer can modify any code
    - **Small Releases**: Deploy to staging frequently, production weekly

11. **Kanban Metrics**:
    - Track cycle time (idea to production)
    - Lead time (customer perspective)
    - Throughput (tasks completed per week)
    - Identify bottlenecks

12. **Spec-Kit: Validation**:
    - Quality checklist validation at each phase
    - UAT with customers
    - Performance testing against constitution targets

**Artifacts**:
- JTBD research report with job stories
- Impact map (goal → actors → impacts → deliverables)
- Constitution document (performance, UX, data, quality standards)
- Detailed specification with mockups and API specs
- Quality checklists
- Implementation plan with phases
- Task breakdown
- Kanban board with flow metrics
- Test suite (TDD unit tests, integration tests, E2E tests)
- Working analytics dashboard

**Why This Combination?**:
- JTBD ensures feature solves real customer jobs
- Impact Mapping connects feature to business goal (retention)
- Spec-Kit provides structured approach with quality gates
- Kanban provides continuous flow (better for brownfield than sprints)
- XP practices ensure engineering excellence (critical for data accuracy)
- Constitution ensures performance and quality standards met

---

### Example 6: Aerospace Flight Control Software

**Scenario**: Develop flight control software for commercial aircraft (ultra-critical)

**Composition**: Waterfall + V-Model + Cleanroom + Formal Verification

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **Waterfall Requirements Phase**:
   - Comprehensive requirements gathering (DO-178C compliance)
   - Functional requirements (control surfaces, autopilot, etc.)
   - Non-functional requirements (safety, reliability, performance)
   - Requirements Review Board approval
   - Requirements Specification Document (thousands of pages)

2. **V-Model Left Side: Requirements Analysis**:
   - Simultaneously design acceptance test cases
   - Test cases for every requirement
   - Requirements-to-test traceability matrix

3. **Waterfall Design Phase**:
   - High-level architecture (redundant systems, fail-safe mechanisms)
   - Detailed module design
   - Interface specifications
   - Design Review Board approval

4. **V-Model Left Side: Design**:
   - System-level test design (integration scenarios)
   - Module-level test design (unit test specifications)
   - Design-to-test traceability

5. **Cleanroom Formal Specification**:
   - For each critical module:
     - Black box specification (behavior)
     - State box specification (state machine)
     - Clear box specification (procedures)
   - Mathematical notation (Z notation or similar)
   - Specification inspection and approval

6. **Cleanroom Design Verification**:
   - Structured programming (provably correct constructs)
   - Correctness arguments for each function
   - Formal verification through inspection
   - Design inspection team reviews correctness proofs
   - NO unit testing by developers (verification through proof)

7. **Waterfall Implementation Phase**:
   - Code strictly per formal specification
   - Coding standards (MISRA C or similar)
   - Code reviews after every module
   - Static analysis (no dynamic execution by developers)
   - Documentation of correctness arguments

8. **V-Model Right Side: Testing**:
   - Independent testing team (separate from developers)
   - Unit tests (execute pre-designed test cases)
   - Integration tests (interface testing, redundancy testing)
   - System tests (end-to-end scenarios)
   - Acceptance tests (regulatory compliance testing)

9. **Cleanroom Statistical Testing**:
   - Usage model based on operational profile:
     - Normal flight operations (80% probability)
     - Adverse weather (15% probability)
     - Emergency scenarios (5% probability)
   - Generate test cases from Markov chain model
   - Execute statistical tests
   - Calculate MTTF (Mean Time To Failure)
   - Reliability certification (e.g., 10^-9 failures per hour)

10. **Formal Verification** (for ultra-critical modules):
    - Model checking for state machines
    - Theorem proving for algorithms
    - Proof of absence of runtime errors
    - Proof of functional correctness

11. **Certification**:
    - DO-178C Level A compliance demonstration
    - Complete traceability (requirements → design → code → tests)
    - Tool qualification (compilers, analyzers)
    - Configuration management evidence
    - Regulatory approval

**Artifacts**:
- Requirements Specification (DO-178C compliant)
- Design documents (architecture, detailed design)
- Formal specifications (mathematical notation)
- Correctness proofs
- Traceability matrices (requirements ↔ design ↔ code ↔ tests)
- Static analysis reports
- Test plans and test results
- Usage models (Markov chains)
- Reliability certification report
- DO-178C compliance evidence
- Certification artifacts for regulatory approval

**Why This Combination?**:
- Waterfall appropriate for highly regulated, safety-critical domain
- V-Model ensures comprehensive testing with traceability
- Cleanroom provides defect prevention and certifiable reliability
- Formal verification proves correctness mathematically
- Statistical testing provides reliability metrics
- Heavy process and documentation required for certification
- Lives depend on this software - maximum rigor justified

---

### Example 7: Open Source Library - "Data Validation Framework"

**Scenario**: Build open source data validation library (greenfield, community-driven)

**Composition**: TDD + BDD + Kanban + XP + Continuous Deployment

**Implementation Status**: 📝 Not Implemented

**Process Flow**:
1. **Community Requirements Gathering**:
   - GitHub Discussions for feature proposals
   - Issues for specific validation rules needed
   - Vote on priorities

2. **BDD Specification**:
   - For each validation rule, write Gherkin scenario
   ```gherkin
   Feature: Email Validation
     Scenario: Valid email address
       Given a validator for email
       When I validate "user@example.com"
       Then it should pass validation

     Scenario: Invalid email without @
       Given a validator for email
       When I validate "userexample.com"
       Then it should fail validation
       And error message should be "Email must contain @"
   ```

3. **TDD Implementation**:
   - Red: Write failing test from BDD scenario
   ```javascript
   test('validates valid email', () => {
     expect(validateEmail('user@example.com')).toBe(true);
   });
   ```
   - Green: Implement minimum code to pass
   - Refactor: Clean up implementation
   - Repeat for each scenario

4. **XP Practices**:
   - **Collective Code Ownership**: Any contributor can modify any code
   - **Coding Standards**: ESLint rules, Prettier formatting
   - **Simple Design**: Don't add features speculatively
   - **Refactoring**: Continuous improvement
   - **Continuous Integration**: Tests run on every PR
   - **Small Releases**: Frequent npm releases (semantic versioning)

5. **Kanban Board** (GitHub Projects):
   - Columns: Backlog → In Progress → Review → Done
   - No WIP limit (open source, contributors work when available)
   - Issues flow through board
   - Labels: bug, feature, documentation, good-first-issue

6. **Pull Request Workflow**:
   - Fork repository
   - Create feature branch
   - TDD: Write tests first
   - Implement feature
   - BDD scenarios pass
   - CI checks pass (tests, linting, coverage)
   - Code review by maintainers
   - Merge to main

7. **Continuous Deployment**:
   - Merge to main triggers CI/CD
   - Run full test suite
   - Build library
   - Publish to npm (if version bumped)
   - Generate documentation
   - Deploy docs to GitHub Pages

8. **Living Documentation**:
   - BDD scenarios serve as examples in docs
   - Auto-generated API docs from JSDoc comments
   - README with quick start
   - CHANGELOG for every release

**Artifacts**:
- Gherkin scenarios (BDD specs)
- Test suite (100% coverage goal)
- Source code
- GitHub Issues and PRs
- Kanban board
- Living documentation (auto-generated)
- npm package
- CI/CD pipeline configuration

**Why This Combination?**:
- TDD ensures quality without formal QA team
- BDD scenarios serve as both tests and documentation
- Kanban accommodates variable contributor availability
- XP practices enable effective community collaboration
- Continuous deployment automates releases
- Lightweight process appropriate for open source

---

## Implementation Priority Rationale

### 🔥 High Priority (Process-Heavy like Spec-Kit)
- **BDD/Specification by Example**: Executable specifications with Gherkin, directly enhances requirements quality, similar structured approach to Spec-Kit
- **Domain-Driven Design (DDD)**: Strategic and tactical patterns provide comprehensive design framework, integrates with Event Storming and architectural planning
- **Feature-Driven Development (FDD)**: Feature-centric with clear 5-step process, parking lot diagrams provide excellent progress tracking
- **Example Mapping**: Quick workshop technique, directly improves spec quality, feeds into BDD
- **ATDD/TDD**: Test-driven approaches provide clear Red-Green-Refactor workflow, critical for quality
- **Hypothesis-Driven Development**: Critical for product validation, experimentation framework aligns with modern practices

### ⭐ Medium Priority (Modern Methodologies)
- **Shape Up**: Modern product development with appetite-driven scoping, betting table, hill charts
- **Kanban**: Continuous flow with WIP limits, excellent for operational work and flow optimization
- **Extreme Programming (XP)**: Engineering practices framework (pair programming, CI, refactoring), complements any methodology
- **Scrum**: Dominant agile framework, sprint-based, well-understood, extensive tooling available
- **Jobs to Be Done**: Strategic but requires domain expertise, excellent for understanding customer needs
- **Impact Mapping**: Goal-to-feature traceability, great for strategic alignment

### 📋 Classic Priority (Foundational Methodologies)
- **Waterfall**: Sequential SDLC, still relevant for regulated industries and stable requirements
- **RUP**: Iterative with 4 phases, architecture-centric, use-case driven, good for complex enterprise projects
- **Spiral Model**: Risk-driven iterative, excellent for high-risk projects, prototype-heavy
- **V-Model**: Verification and validation focus, critical for safety-critical systems (aerospace, medical, automotive)
- **Cleanroom**: Formal methods with statistical testing, niche but important for ultra-high reliability
- **Event Storming**: Domain modeling workshop, powerful but requires skilled facilitation
- **Double Diamond**: Design thinking framework, broad applicability but overlaps with other methodologies

---

## Trend Analysis (2025-2026)

**Hot Topics**:
- AI-assisted development workflows (augment existing methodologies with AI agents)
- Rapid experimentation platforms (Hypothesis-Driven + A/B testing)
- Developer experience (DX) optimization
- Platform engineering and DevOps practices
- Executable specifications (BDD/Specification by Example)

**Emerging Practices**:
- AI-augmented pair programming
- Continuous discovery (combines JTBD, Example Mapping, Hypothesis-Driven)
- Shape Up adoption increasing (more case studies, tools emerging)
- Domain-Driven Design renaissance (microservices driving renewed interest)
- Statistical testing and formal methods for AI safety

**Classics Still Relevant**:
- BDD/Example Mapping/Specification by Example (test automation foundation)
- TDD/ATDD (quality remains critical)
- Domain-Driven Design (complexity requires good domain modeling)
- Event Storming (domain complexity not going away)
- Waterfall and V-Model (regulated industries, safety-critical systems)
- Scrum and Kanban (dominant agile frameworks)

---

## Contributing

When implementing methodologies from this backlog:

1. Create directory: `methodologies/[name]/`
2. Follow the implementation plan outlined above
3. Include comprehensive examples in `methodologies/[name]/examples/`
4. Update main `README.md` with new methodology
5. Add comparison matrix entry
6. Document integration points with existing methodologies

---

## References

All methodologies include source links. Additional resources:

- [Martin Fowler's blog](https://martinfowler.com/)
- [ThoughtWorks Technology Radar](https://www.thoughtworks.com/radar)
- [InfoQ Software Development Trends](https://www.infoq.com/software-development-trends/)
- [Agile Alliance Resources](https://www.agilealliance.org/)
