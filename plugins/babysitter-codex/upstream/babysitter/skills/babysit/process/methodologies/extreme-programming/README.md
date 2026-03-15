# Extreme Programming (XP)

## Overview

Extreme Programming (XP) is an agile software development methodology that advocates frequent releases in short development cycles to improve productivity and responsiveness to changing requirements. XP emphasizes engineering practices and takes best practices to "extreme" levels.

**Creators**: Kent Beck, Ward Cunningham, Ron Jeffries
**Year**: 1996 (Established Agile methodology)

### Key Principles

**12 Core Practices grouped into four areas**:

**Fine-scale feedback**:
- Pair Programming - Two developers work together at one workstation
- Planning Game - Business and developers plan together
- Test-Driven Development - Write tests before code
- Whole Team - All necessary skills present on team

**Continuous Process**:
- Continuous Integration - Integrate and build multiple times per day
- Refactoring - Continuously improve code design
- Small Releases - Deliver working software frequently

**Shared Understanding**:
- Coding Standards - Team follows consistent coding conventions
- Collective Code Ownership - Anyone can improve any code anywhere
- Simple Design - Do the simplest thing that could possibly work
- System Metaphor - Shared story of how system works

**Programmer Welfare**:
- Sustainable Pace - Work 40-hour weeks, not overtime

## Methodology

### XP Process Flow

#### 1. Release Planning
Business and development team collaborate to:
- Define release goal and theme
- Create user stories in "As a... I want... So that..." format
- Estimate stories in story points (1, 2, 3, 5, 8, 13)
- Prioritize by business value and technical risk
- Calculate team velocity
- Plan iterations (typically 1-2 weeks)

#### 2. Iteration Planning
Team selects stories for iteration and:
- Break stories into engineering tasks
- Estimate tasks in ideal hours (4-16 hours each)
- Assign tasks to pairs (not individuals)
- Commit to iteration goal
- Build in slack time (~20%)

#### 3. Daily Iteration Execution
Each day includes:
- **Daily Standup** (15 min): Yesterday's progress, today's plan, impediments, pair assignments
- **Pair Programming**: Driver/navigator, rotate every 20-30 minutes
- **Test-Driven Development**: Red-Green-Refactor cycle
- **Continuous Integration**: Multiple commits per day, automated builds
- **Refactoring**: Continuous code improvement
- **Sustainable Pace**: 8-hour workdays, no heroics

#### 4. Iteration Completion
At end of iteration:
- Demo working software to stakeholders
- Verify acceptance criteria
- Calculate actual velocity
- Update release progress

#### 5. Retrospective
Team reflects on:
- What went well (keep doing)
- What didn't work (stop doing)
- What to improve (start doing)
- Action items for next iteration

#### 6. Release Completion
When all stories complete:
- Final acceptance and demo
- Deployment preparation
- Release notes and documentation
- Lessons learned for next release

## Process Workflow

```
Release Planning
    ↓
[Review Release Plan]
    ↓
┌─────────────────────────────────────┐
│  ITERATION LOOP (repeat N times)   │
│                                     │
│  Iteration Planning                 │
│      ↓                              │
│  [Review Iteration Plan]            │
│      ↓                              │
│  ┌──────────────────────────────┐  │
│  │  DAILY LOOP (5-10 days)      │  │
│  │                               │  │
│  │  Daily Standup                │  │
│  │      ↓                        │  │
│  │  Parallel Practices:          │  │
│  │  - Pair Programming           │  │
│  │  - TDD (Red-Green-Refactor)   │  │
│  │  - Continuous Integration     │  │
│  │  - Refactoring (periodic)     │  │
│  │      ↓                        │  │
│  │  [Mid-Iteration Check]        │  │
│  └──────────────────────────────┘  │
│      ↓                              │
│  Iteration Completion               │
│      ↓                              │
│  [Review Demo]                      │
│      ↓                              │
│  Retrospective                      │
│      ↓                              │
│  [Review Improvements]              │
└─────────────────────────────────────┘
    ↓
Release Completion
    ↓
Practice Metrics Analysis
    ↓
[Final Review]
```

## Usage

### Basic Usage

```javascript
import { runProcess } from '@a5c-ai/babysitter-sdk';

const result = await runProcess('methodologies/extreme-programming', {
  projectName: 'E-commerce Platform',
  releaseGoal: 'Complete checkout and payment processing',
  iterationLength: 2,
  teamSize: 4,
  enablePairProgramming: true,
  enableTDD: true,
  enableCI: true,
  enableRefactoring: true
});
```

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Project name |
| `releaseGoal` | string | Yes | - | Release goal or theme |
| `iterationLength` | number | No | `2` | Iteration length in weeks |
| `teamSize` | number | No | `4` | Development team size |
| `velocity` | number | No | auto-calc | Estimated velocity in story points |
| `practices` | array | No | all 12 | XP practices to focus on |
| `userStories` | array | No | auto-gen | Pre-defined user stories |
| `enablePairProgramming` | boolean | No | `true` | Enable pair programming |
| `enableTDD` | boolean | No | `true` | Enable TDD practice |
| `enableCI` | boolean | No | `true` | Enable continuous integration |
| `enableRefactoring` | boolean | No | `true` | Enable continuous refactoring |

### Output Structure

```javascript
{
  success: boolean,
  projectName: string,
  releaseGoal: string,
  releasePlan: {
    userStories: [{ id, title, asA, iWant, soThat, storyPoints, priority, acceptanceCriteria }],
    velocity: number,
    iterationCount: number,
    totalStoryPoints: number,
    releaseRoadmap: [],
    acceptanceCriteria: [],
    risks: []
  },
  iterations: [{
    iterationNumber: number,
    plan: { selectedStories, tasks, totalStoryPoints, totalHours, iterationGoal },
    dailyResults: [{
      day: number,
      standup: { yesterdayProgress, todaysTasks, impediments, pairAssignments },
      pairProgramming: { pairSessions, completedWork, knowledgeSharing },
      tdd: { tests, coverage, codeSmells, tddMetrics },
      ci: { builds, commits, buildStatus, ciMetrics },
      refactoring: { refactorings, qualityImprovements, metrics }
    }],
    completion: { completedStories, actualVelocity, demoScript, metrics },
    retrospective: { keepers, improvements, actionItems, teamSentiment }
  }],
  releaseCompletion: {
    completedStories: number,
    finalVelocity: number,
    releaseReady: boolean,
    releaseNotes: {},
    deploymentReadiness: {},
    releaseMetrics: {},
    lessonsLearned: []
  },
  practiceMetrics: {
    practiceMetrics: { pairProgramming, tdd, continuousIntegration, refactoring },
    overallAdherence: number,
    effectiveness: {},
    recommendations: []
  },
  summary: {
    iterationsCompleted: number,
    storiesCompleted: number,
    storiesPlanned: number,
    completionRate: string,
    initialVelocity: number,
    finalVelocity: number,
    velocityImprovement: string,
    practiceAdherence: number
  },
  artifacts: {
    release: 'artifacts/xp/release/',
    iterations: 'artifacts/xp/iterations/',
    practices: 'artifacts/xp/practices/',
    metrics: 'artifacts/xp/metrics/'
  }
}
```

## Examples

### Example 1: Web Application Feature Release

```javascript
const result = await runProcess('methodologies/extreme-programming', {
  projectName: 'TaskManager Pro',
  releaseGoal: 'Real-time collaboration features',
  iterationLength: 2,
  teamSize: 6,
  enablePairProgramming: true,
  enableTDD: true,
  enableCI: true,
  enableRefactoring: true
});
```

**Release Plan**:
- 15 user stories created (45 story points total)
- Estimated velocity: 15 points per iteration
- 3 iterations planned
- Key features: real-time editing, presence indicators, conflict resolution

**Iteration Results**:
- Iteration 1: 14 points delivered (5 stories)
- Iteration 2: 16 points delivered (5 stories)
- Iteration 3: 15 points delivered (5 stories)
- Final velocity: 15 points (stable)
- All acceptance criteria met

**Practice Metrics**:
- Pair Programming: 92% adherence, excellent knowledge transfer
- TDD: 95% test coverage, fast test execution
- CI: 97% build success rate, 4.2 commits/day
- Refactoring: 38 code smells resolved, 25% maintainability improvement

### Example 2: API Development with Small Team

```javascript
const result = await runProcess('methodologies/extreme-programming', {
  projectName: 'Payment Gateway API',
  releaseGoal: 'Multi-currency payment processing',
  iterationLength: 1,
  teamSize: 2,
  velocity: 8,
  enablePairProgramming: true,
  enableTDD: true,
  enableCI: true
});
```

**Release Plan**:
- 8 user stories (24 story points)
- 1-week iterations
- 3 iterations planned
- Focus: Currency conversion, transaction processing, webhooks

**Practice Focus**:
- Pair programming critical for small team knowledge sharing
- TDD ensures API reliability and contract compliance
- CI with comprehensive integration tests
- Simple design with clear separation of concerns

### Example 3: Legacy System Refactoring

```javascript
const result = await runProcess('methodologies/extreme-programming', {
  projectName: 'Inventory Management',
  releaseGoal: 'Modernize inventory tracking module',
  iterationLength: 2,
  teamSize: 4,
  enablePairProgramming: true,
  enableTDD: true,
  enableCI: true,
  enableRefactoring: true,
  practices: ['tdd', 'refactoring', 'continuous-integration', 'collective-ownership', 'simple-design']
});
```

**Focus Areas**:
- Heavy refactoring of legacy code
- TDD to add test coverage to legacy code
- Collective ownership to spread knowledge
- Continuous integration to catch regressions
- Sustainable pace to avoid burnout

## Tasks

### Release Planning Task
**Purpose**: Plan release with user stories, estimation, and velocity
**Outputs**: User stories, story points, velocity, iteration count, roadmap
**Approach**: Collaborative planning game, business value prioritization

### Iteration Planning Task
**Purpose**: Select stories and break into tasks for iteration
**Outputs**: Selected stories, tasks with hour estimates, iteration goal
**Approach**: Velocity-based selection, task breakdown, team commitment

### Daily Standup Task
**Purpose**: Coordinate daily work and pair assignments
**Outputs**: Progress updates, today's plan, impediments, pair assignments
**Approach**: 15-minute timeboxed standup, focus on coordination

### Pair Programming Task
**Purpose**: Facilitate pair programming with rotation
**Outputs**: Pair sessions, completed work, knowledge sharing metrics
**Approach**: Driver/navigator rotation, track effectiveness

### TDD Practice Task
**Purpose**: Enforce test-driven development
**Outputs**: Tests written, coverage metrics, code smells
**Approach**: Red-Green-Refactor cycle, fast test execution

### Continuous Integration Task
**Purpose**: Automate build and test on every commit
**Outputs**: Build results, commit frequency, build status
**Approach**: Multiple commits per day, immediate feedback, fix breaks immediately

### Refactoring Task
**Purpose**: Continuously improve code design
**Outputs**: Refactorings performed, quality improvements
**Approach**: Incremental refactoring, maintain test coverage

### Iteration Completion Task
**Purpose**: Complete iteration with demo and metrics
**Outputs**: Completed stories, actual velocity, demo script
**Approach**: Demo preparation, acceptance verification, velocity calculation

### Retrospective Task
**Purpose**: Team reflection and improvement
**Outputs**: Keepers, improvements, action items, team sentiment
**Approach**: Safe environment, actionable improvements, track sustainability

### Release Completion Task
**Purpose**: Complete release and prepare deployment
**Outputs**: Release notes, deployment readiness, lessons learned
**Approach**: Final verification, documentation, readiness assessment

### Practice Metrics Task
**Purpose**: Analyze XP practice adherence and effectiveness
**Outputs**: Practice metrics, adherence scores, recommendations
**Approach**: Correlation analysis, effectiveness assessment, benchmarking

## XP Practices in Detail

### 1. Pair Programming
**What**: Two developers, one workstation
**How**:
- Driver: Types and implements
- Navigator: Reviews, thinks ahead, suggests
- Rotate every 20-30 minutes
- Rotate pairs every 1-2 days

**Benefits**:
- Higher code quality
- Knowledge sharing
- Reduced defects
- Built-in code review

### 2. Test-Driven Development (TDD)
**What**: Write tests before production code
**How**:
- Red: Write failing test
- Green: Make test pass (simplest way)
- Refactor: Improve code while keeping tests green
- Repeat

**Benefits**:
- Better design
- Higher test coverage
- Regression protection
- Living documentation

### 3. Continuous Integration (CI)
**What**: Integrate code multiple times per day
**How**:
- Commit frequently (3-4 times per day minimum)
- Automated build on every commit
- Run all tests automatically
- Fix broken builds immediately (< 10 minutes)

**Benefits**:
- Early integration issue detection
- Always releasable
- Reduced integration risk
- Fast feedback

### 4. Refactoring
**What**: Continuously improve code design
**How**:
- Identify code smells
- Apply refactoring patterns
- Keep tests passing
- Small, incremental changes

**Benefits**:
- Sustainable codebase
- Reduced technical debt
- Better maintainability
- Supports changing requirements

### 5. Simple Design
**What**: Do the simplest thing that could possibly work
**How**:
- Pass all tests
- Reveal intention
- No duplication
- Fewest elements (YAGNI - You Aren't Gonna Need It)

**Benefits**:
- Easy to understand
- Easy to change
- Reduced complexity
- Faster development

### 6. Collective Code Ownership
**What**: Anyone can improve any code anywhere
**How**:
- No code "owners"
- Anyone can fix bugs or add features anywhere
- Share knowledge through pairing
- Coding standards ensure consistency

**Benefits**:
- Reduced bottlenecks
- Shared knowledge
- Better team flexibility
- Improved code quality

### 7. Coding Standards
**What**: Team follows consistent conventions
**How**:
- Agree on standards
- Use automated formatting
- Enforce in code review
- Keep standards lightweight

**Benefits**:
- Consistent codebase
- Easier collaboration
- Reduced cognitive load
- Supports collective ownership

### 8. Sustainable Pace
**What**: Work 40-hour weeks, not overtime
**How**:
- 8-hour workdays
- No heroics or death marches
- Plan realistic workloads
- Monitor team energy and morale

**Benefits**:
- Prevents burnout
- Maintains quality
- Sustainable productivity
- Team retention

### 9. Planning Game
**What**: Business and development plan together
**How**:
- Business writes stories and priorities
- Developers estimate and assess risk
- Negotiate scope vs. time
- Collaborate on release and iteration plans

**Benefits**:
- Shared understanding
- Realistic plans
- Business value focus
- Adaptive planning

### 10. Small Releases
**What**: Deliver working software frequently
**How**:
- Short iterations (1-2 weeks)
- Release to production regularly
- Incremental features
- Continuous deployment

**Benefits**:
- Fast feedback
- Reduced risk
- Business value delivered sooner
- Easier to change direction

### 11. Whole Team
**What**: All necessary skills present on team
**How**:
- Cross-functional team
- Include customer/business rep
- Co-located if possible
- Dedicated team members

**Benefits**:
- Fast decision making
- No handoffs
- Shared understanding
- Continuous collaboration

### 12. System Metaphor
**What**: Shared story of how system works
**How**:
- Create simple metaphor
- Use in conversations
- Inform naming conventions
- Guide architecture decisions

**Benefits**:
- Shared understanding
- Consistent naming
- Easier communication
- Guided design decisions

## Integration Points

### With Spec-Driven Development
XP provides implementation practices for spec-driven development:
```javascript
// First: Create specification
const spec = await runProcess('methodologies/spec-driven-development', {
  projectName: 'TaskManager',
  specification: '...'
});

// Then: Implement using XP practices
const xp = await runProcess('methodologies/extreme-programming', {
  projectName: 'TaskManager',
  releaseGoal: spec.specification.goals[0],
  userStories: spec.specification.userStories
});
```

### With BDD/Specification by Example
XP TDD complements BDD acceptance tests:
```javascript
// BDD for acceptance tests
const bdd = await runProcess('methodologies/bdd-specification-by-example', {
  feature: 'User checkout'
});

// XP for implementation with TDD
const xp = await runProcess('methodologies/extreme-programming', {
  releaseGoal: 'Implement checkout feature',
  userStories: bdd.discovery.story,
  enableTDD: true
});
```

### With Feature-Driven Development
XP practices enhance FDD implementation:
```javascript
// FDD for feature planning
const fdd = await runProcess('methodologies/feature-driven-development', {
  projectName: 'CRM'
});

// XP for engineering practices during implementation
const xp = await runProcess('methodologies/extreme-programming', {
  releaseGoal: fdd.features[0].name,
  enablePairProgramming: true,
  enableTDD: true
});
```

## Best Practices

### Release Planning
1. Keep stories small (completable in one iteration)
2. Estimate in relative story points, not hours
3. Prioritize by business value AND technical risk
4. Build velocity history over 2-3 iterations
5. Re-plan every iteration based on actual velocity
6. Include slack time for unexpected work

### Iteration Planning
1. Don't over-commit (plan for 80% capacity)
2. Break stories into tasks collaboratively
3. Estimate tasks in ideal hours (4-16 hours)
4. Assign tasks to pairs, not individuals
5. Identify dependencies early
6. Plan for sustainable pace

### Pair Programming
1. Rotate pairs frequently (every 1-2 days)
2. Rotate driver/navigator often (20-30 minutes)
3. Both partners stay engaged
4. Navigator thinks strategically, driver tactically
5. Take breaks together
6. Respect different working styles
7. Ensure everyone pairs with everyone

### Test-Driven Development
1. Write test first, always
2. Write smallest test that fails
3. Make test pass with simplest code
4. Refactor while tests are green
5. Keep tests fast (< 10 seconds for unit tests)
6. Run all tests before committing
7. Maintain test quality as production code

### Continuous Integration
1. Commit multiple times per day (3-4+)
2. Never commit on broken build
3. Fix broken builds within 10 minutes
4. Run full test suite on every commit
5. Keep build fast (< 10 minutes)
6. Automate everything
7. Make build status visible

### Refactoring
1. Refactor continuously, not in phases
2. Keep tests passing during refactoring
3. Make small, incremental changes
4. Use automated refactoring tools
5. Review refactorings in pairs
6. Balance new features with refactoring
7. Track technical debt reduction

### Sustainable Pace
1. Plan for 40-hour weeks
2. No overtime (emergency only)
3. Monitor team energy and morale
4. Take regular breaks
5. Respect work-life balance
6. Address burnout signals immediately
7. Celebrate successes

## Metrics to Track

### Velocity Metrics
- **Story Points Completed per Iteration**: Primary velocity metric
- **Velocity Trend**: Increasing, stable, or decreasing over time
- **Planned vs. Actual Velocity**: Track estimation accuracy
- **Burndown Chart**: Remaining work over time

### Quality Metrics
- **Test Coverage**: Percentage of code covered by tests
- **Defect Rate**: Defects found per story point
- **Build Success Rate**: Percentage of successful builds
- **Code Smell Count**: Technical debt indicators
- **Maintainability Index**: Code quality score

### Practice Adherence Metrics
- **Pair Programming Hours**: Percentage of time pairing
- **TDD Adherence**: Percentage of code developed test-first
- **Commit Frequency**: Commits per developer per day
- **Build Frequency**: Builds per day
- **Refactoring Frequency**: Refactorings per iteration

### Team Health Metrics
- **Team Sentiment**: Team happiness and satisfaction
- **Sustainable Pace**: Hours worked per week
- **Knowledge Distribution**: Skills spread across team
- **Rotation Frequency**: How often pairs rotate

### Business Value Metrics
- **Features Delivered**: Story points completed
- **Release Frequency**: Releases per month
- **Time to Market**: Idea to production time
- **Customer Satisfaction**: Stakeholder happiness

## Common Challenges

### Challenge: Resistance to Pair Programming
**Solution**:
- Start with part-time pairing (50%)
- Pair on complex/risky tasks first
- Track and share benefits (defect reduction, knowledge sharing)
- Ensure compatible work environment (desk space, monitors)
- Respect introverts' need for solo time

### Challenge: TDD Feels Slow
**Solution**:
- Invest in fast test infrastructure
- Keep tests focused and isolated
- Use test doubles (mocks, stubs) effectively
- Track long-term velocity gains
- Celebrate test-caught defects

### Challenge: Low Initial Velocity
**Solution**:
- Give team 2-3 iterations to stabilize
- Don't pressure for higher estimates
- Focus on sustainable improvements
- Invest in practices (pairing, TDD, CI)
- Track velocity trend, not absolute value

### Challenge: Broken Builds
**Solution**:
- Make fixing builds highest priority
- Implement "stop the line" culture
- Keep builds fast for quick feedback
- Add pre-commit hooks
- Celebrate build stability

### Challenge: Unstable Requirements
**Solution**:
- Embrace change (XP's strength)
- Keep stories small for flexibility
- Prioritize continuously
- Use short iterations
- Maintain close customer collaboration

### Challenge: Sustainable Pace Violations
**Solution**:
- Make velocity realistic
- Track hours worked
- Address causes of overtime
- Celebrate saying "no"
- Monitor team morale

## Troubleshooting

### Low Velocity
- Check team size and capacity assumptions
- Verify story point estimates
- Look for impediments and blockers
- Assess practice adherence
- Consider technical debt impact

### Poor Code Quality
- Increase TDD adherence
- Schedule refactoring time
- Review coding standards
- Increase pair programming
- Address code smells promptly

### Integration Issues
- Increase commit frequency
- Improve test coverage
- Speed up build time
- Fix broken builds immediately
- Review branching strategy

### Team Burnout
- Enforce sustainable pace
- Remove overtime pressure
- Address impediments
- Celebrate achievements
- Review workload and velocity

### Low Stakeholder Satisfaction
- Improve demo quality
- Clarify acceptance criteria
- Increase customer involvement
- Deliver smaller increments
- Improve communication

## Tools and Automation

### Development Tools
- **Version Control**: Git with trunk-based development
- **CI/CD**: Jenkins, GitHub Actions, GitLab CI, CircleCI
- **Test Frameworks**: JUnit, Jest, pytest, RSpec
- **Code Coverage**: JaCoCo, Istanbul, Coverage.py
- **Static Analysis**: SonarQube, ESLint, Pylint

### Project Management
- **Story Tracking**: Jira, Trello, Linear, Pivotal Tracker
- **Burndown Charts**: Built into most agile tools
- **Velocity Tracking**: Jira Velocity Charts, custom dashboards

### Communication
- **Daily Standups**: In-person or Zoom/Teams
- **Pair Programming**: Screen sharing, VS Code Live Share, tuple
- **Team Communication**: Slack, Teams, Discord

### Quality Assurance
- **Automated Testing**: Continuous test execution
- **Code Review**: Pull request reviews (lightweight)
- **Refactoring Tools**: IDE refactoring support

## Artifacts Generated

### Release Level
- `artifacts/xp/release/release-plan.md` - Release plan with stories and roadmap
- `artifacts/xp/release/user-stories.json` - All user stories with estimates
- `artifacts/xp/release/velocity-chart.md` - Velocity planning and trends
- `artifacts/xp/release/release-summary.md` - Final release summary
- `artifacts/xp/release/practice-metrics.md` - Overall practice adherence
- `artifacts/xp/release/velocity-trend.md` - Velocity improvement over time

### Iteration Level
- `artifacts/xp/iterations/iteration-N/plan.md` - Iteration plan
- `artifacts/xp/iterations/iteration-N/tasks.json` - Task breakdown
- `artifacts/xp/iterations/iteration-N/daily/day-N-summary.md` - Daily summaries
- `artifacts/xp/iterations/iteration-N/completion-report.md` - Iteration results
- `artifacts/xp/iterations/iteration-N/demo-script.md` - Demo preparation
- `artifacts/xp/iterations/iteration-N/retrospective.md` - Retrospective outcomes
- `artifacts/xp/iterations/iteration-N/action-items.md` - Improvement actions

### Practice Level
- `artifacts/xp/practices/pair-programming/` - Pairing metrics and sessions
- `artifacts/xp/practices/tdd/` - Test coverage and TDD metrics
- `artifacts/xp/practices/ci/` - Build history and integration metrics
- `artifacts/xp/practices/refactoring/` - Refactoring log and quality improvements

### Metrics
- `artifacts/xp/metrics/velocity-history.json` - Iteration velocity data
- `artifacts/xp/metrics/practice-adherence.json` - Practice metrics
- `artifacts/xp/metrics/quality-trends.json` - Code quality over time
- `artifacts/xp/metrics/team-health.json` - Team sentiment and sustainability

## References

### Official Resources
- [Extreme Programming on Wikipedia](https://en.wikipedia.org/wiki/Extreme_programming)
- [XP Practices on Wikipedia](https://en.wikipedia.org/wiki/Extreme_programming_practices)
- [Agile Alliance: XP](https://agilealliance.org/glossary/xp/)

### Books
- **"Extreme Programming Explained"** by Kent Beck (1st ed. 1999, 2nd ed. 2004)
- **"Planning Extreme Programming"** by Kent Beck & Martin Fowler
- **"Extreme Programming Installed"** by Ron Jeffries, Ann Anderson, Chet Hendrickson
- **"Test Driven Development: By Example"** by Kent Beck
- **"Refactoring: Improving the Design of Existing Code"** by Martin Fowler
- **"Pair Programming Illuminated"** by Laurie Williams & Robert Kessler

### Articles & Guides
- [Monday.com: Extreme Programming 2026](https://monday.com/blog/rnd/extreme-programming/)
- [Extreme Programming Values and Principles](http://www.extremeprogramming.org/)
- [Martin Fowler: Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)
- [Kent Beck's Original Wiki](http://wiki.c2.com/?ExtremeProgramming)

### Practice-Specific Resources
- [Test-Driven Development Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Pair Programming Guide](https://martinfowler.com/articles/on-pair-programming.html)
- [Refactoring Catalog](https://refactoring.com/catalog/)
- [Simple Design Rules](https://martinfowler.com/bliki/BeckDesignRules.html)

## License

Part of the Babysitter SDK orchestration framework.
