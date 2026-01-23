# Jobs to Be Done (JTBD) Methodology

**Creator**: Clayton Christensen (popularized by Intercom, Alan Klement)
**Year**: Modern framework (2016-present)
**Category**: Product Strategy / Requirements Discovery

## Overview

Jobs to Be Done (JTBD) is a framework that focuses on understanding the progress customers are trying to make in their lives rather than on products, features, or user personas. The central insight is captured in the famous quote: "People don't want a quarter-inch drill, they want a quarter-inch hole."

This process implements the JTBD framework through the Babysitter SDK orchestration framework, providing agent-driven job discovery, forces analysis, job story generation, and solution mapping workflows.

## Key Concepts

### Progress Over Products

JTBD shifts focus from what products do to what progress customers want to make:

- **Jobs**: The fundamental goals customers are trying to achieve
- **Progress**: Moving from a current state to a desired state
- **Hiring**: Customers "hire" products to help them make progress on jobs
- **Firing**: Customers "fire" solutions that don't help them make progress

### The Four Forces

JTBD uses a forces diagram to understand switching behavior:

1. **Push Forces** (Current Problems): What pushes customers away from current solution?
2. **Pull Forces** (New Solution Appeal): What attracts customers to new solution?
3. **Anxiety Forces** (Concerns): What concerns do customers have about new solution?
4. **Habits Forces** (Comfort): What keeps them comfortable with current solution?

Push and Pull forces favor switching. Anxiety and Habits resist switching.

### Job Stories Over User Stories

JTBD replaces persona-based user stories with context-based job stories:

**Format**: `When [situation], I want to [motivation], so I can [outcome]`

**Example**:
- Good: "When I'm preparing for a client meeting, I want to quickly find relevant case studies, so I can build credibility"
- Bad: "As a sales rep, I want a search feature with filters"

### Job Dimensions

Jobs have three dimensions:

- **Functional**: The practical task to accomplish
- **Emotional**: How customers want to feel
- **Social**: How customers want to be perceived

## Process Workflow

The JTBD process follows a four-phase workflow:

### Phase 1: Job Discovery

**Goal**: Identify customer jobs focusing on progress they want to make

Tasks:
1. Analyze customer research data (interviews, surveys, feedback)
2. Identify struggles, workarounds, and switching triggers
3. Define main jobs (primary progress) and related jobs (secondary progress)
4. Cluster similar jobs together
5. Document circumstances and context where jobs arise

**Key Questions**:
- What job did you hire this product to do?
- What progress are you trying to make?
- What are you struggling with?
- What workarounds have you tried?

### Phase 2: Forces Analysis

**Goal**: Analyze forces affecting job completion using forces diagram

For each main job:
1. Identify push forces (current solution problems)
2. Identify pull forces (new solution appeal)
3. Identify anxiety forces (concerns about switching)
4. Identify habit forces (comfort with current solution)
5. Assess force balance and switching likelihood
6. Identify switching triggers

### Phase 3: Job Story Generation

**Goal**: Convert jobs to job stories format

For each job:
1. Write job stories in "When/I want to/So I can" format
2. Focus on situation, motivation, and desired outcome
3. Avoid implementation details and personas
4. Create multiple stories for different triggering situations
5. Ensure stories are implementation-agnostic

### Phase 4: Solution Mapping

**Goal**: Map features to jobs and define success criteria

Tasks:
1. Map potential features to specific jobs
2. Prioritize features that help with main jobs
3. Address forces through features (reduce anxiety, overcome habits)
4. Define progress measurements for each job
5. Define success criteria ("job well done")
6. Identify underserved jobs (opportunities)

## Usage

### Full JTBD Workflow

```javascript
import { orchestrate } from '@a5c-ai/babysitter-sdk';

const result = await orchestrate({
  process: 'methodologies/jobs-to-be-done',
  inputs: {
    projectName: 'Project Management Tool',
    context: 'B2B SaaS for remote teams...',
    researchData: 'Customer interviews revealed...',
    phase: 'full'
  }
});
```

### Job Discovery Only

```javascript
const result = await orchestrate({
  process: 'methodologies/jobs-to-be-done',
  inputs: {
    projectName: 'Project Management Tool',
    context: 'B2B SaaS for remote teams...',
    researchData: 'Customer interviews...',
    phase: 'discovery'
  }
});
```

### Forces Analysis (with existing jobs)

```javascript
const result = await orchestrate({
  process: 'methodologies/jobs-to-be-done',
  inputs: {
    projectName: 'Project Management Tool',
    phase: 'forces',
    existingJobs: './artifacts/jtbd/jobs.json'
  }
});
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Name of the product/project |
| `context` | string | No | '' | Business context and current situation |
| `researchData` | string | No | '' | Customer research data (interviews, surveys, feedback) |
| `phase` | string | No | 'full' | Starting phase: 'discovery', 'forces', 'stories', 'full' |
| `existingJobs` | string | No | null | Path to existing job analysis (for refinement) |

## Output Artifacts

The process generates comprehensive JTBD artifacts:

### Job Discovery
- `artifacts/jtbd/JOBS.md` - Discovered customer jobs
- `artifacts/jtbd/job-clusters.json` - Job clustering analysis
- `artifacts/jtbd/struggles.md` - Customer struggles and workarounds

### Forces Analysis
- `artifacts/jtbd/FORCES.md` - Forces analysis for all jobs
- `artifacts/jtbd/forces-diagram.json` - Machine-readable forces diagrams
- `artifacts/jtbd/switching-triggers.md` - Identified switching triggers

### Job Stories
- `artifacts/jtbd/JOB_STORIES.md` - Generated job stories
- `artifacts/jtbd/job-stories.json` - Machine-readable job stories
- `artifacts/jtbd/stories-by-job.md` - Stories organized by job

### Solution Mapping
- `artifacts/jtbd/SOLUTION_MAP.md` - Feature-to-job mapping
- `artifacts/jtbd/feature-job-map.json` - Machine-readable mapping
- `artifacts/jtbd/success-metrics.md` - Progress measurements and success criteria

### Summary
- `artifacts/jtbd/JTBD_SUMMARY.md` - Complete JTBD analysis summary

## Return Value

```javascript
{
  success: boolean,
  projectName: string,
  phase: string,
  jobs: {
    mainJobs: [ ... ],
    relatedJobs: [ ... ],
    struggles: [ ... ],
    jobClusters: [ ... ],
    switchingTriggers: [ ... ]
  },
  forces: {
    jobForces: [ ... ]
  },
  jobStories: {
    stories: [ ... ]
  },
  solutions: {
    featureJobMap: [ ... ],
    progressMeasurements: [ ... ],
    successCriteria: [ ... ],
    underservedJobs: [ ... ]
  },
  validation: { ... },
  artifacts: { ... },
  metadata: { ... }
}
```

## Integration with Other Methodologies

### With Spec-Driven Development
JTBD provides customer jobs and job stories as input to spec-driven development. Job stories become requirements that specs must satisfy.

### With Brownfield Analysis
Use JTBD to understand why current solution exists and what jobs it's hired to do. Identify underserved jobs as improvement opportunities.

### With BDD/Specification by Example
Job stories inform BDD scenarios. Convert job stories to Gherkin scenarios for executable specifications.

### With Hypothesis-Driven Development
Jobs and forces analysis inform hypotheses about customer needs. Test hypotheses with MVPs focused on specific jobs.

### With Impact Mapping
Jobs become the "impacts" in impact mapping. Map features to jobs to ensure alignment with customer progress.

## JTBD Interview Techniques

### The Switch Interview

Focus on customers who recently switched to your product:

**Key Questions**:
1. When did you first realize you needed something?
2. What was going on in your life/work?
3. What did you try before our product?
4. What problems did those solutions have?
5. How did you hear about our product?
6. What made you decide to try it?
7. What concerns did you have?
8. What happened after you started using it?

### The Struggle

Look for "struggle moments" - when current solution isn't working:

- "Tell me about a time when [current solution] didn't work"
- "What were you trying to accomplish?"
- "What made it difficult?"
- "What did you try instead?"

### The Hiring Moment

Understand when and why they "hired" your product:

- "What triggered you to look for something new?"
- "What were you hoping to achieve?"
- "Why did you choose this solution over others?"

## Best Practices

### Job Discovery
1. Focus on progress, not product features
2. Look for functional, emotional, and social dimensions
3. Document the context and circumstances
4. Cluster similar jobs to find patterns
5. Avoid solution thinking - stay at the problem level

### Forces Analysis
1. All four forces must be considered
2. Look for specific examples from customer research
3. Identify which forces are strongest
4. Consider timing - when do forces trigger switching?
5. Use forces to inform product strategy

### Job Stories
1. Start with "When" (situation/context), not "As a" (persona)
2. Focus on causality - what triggers the need?
3. Avoid implementation details
4. Keep stories implementation-agnostic
5. Write multiple stories for different situations

### Solution Mapping
1. Prioritize features that help with main jobs
2. Focus on job completion, not feature lists
3. Measure progress, not just usage
4. Define what "job well done" looks like
5. Identify underserved jobs as opportunities

## Common Pitfalls

### Focusing on Solutions Too Early
Bad: "We need a better search feature"
Good: "When I'm preparing for meetings, I struggle to find relevant information quickly"

### Confusing Jobs with Activities
Bad: "Job: Use the search bar"
Good: "Job: Find relevant information to build credibility"

### Writing Persona-Based Stories
Bad: "As a sales rep, I want..."
Good: "When I'm preparing for a client meeting, I want to..."

### Ignoring Forces
Don't just discover jobs - understand what prevents customers from making progress.

### Making Jobs Too Broad
Bad: "Be successful at work"
Good: "Prepare compelling presentations for client meetings"

## Example: Project Management Tool

### Jobs Discovered

**Main Job**:
- "Keep distributed team aligned on project progress without constant meetings"

**Related Jobs**:
- "Quickly communicate blockers to stakeholders"
- "Track individual contributions for performance reviews"
- "Reduce time spent in status update meetings"

### Forces Analysis

**Push Forces** (away from current solution):
- Too many meetings eating up productive time
- Email threads become impossible to follow
- Information scattered across multiple tools

**Pull Forces** (toward new solution):
- Single source of truth for project status
- Async communication reduces meeting overhead
- Visual progress tracking at a glance

**Anxiety Forces** (concerns about new solution):
- Learning curve for team adoption
- Yet another tool to maintain
- Worry about notification overload

**Habit Forces** (comfort with current):
- Team comfortable with current email workflow
- Meetings provide face-to-face connection
- Excel spreadsheets are familiar

### Job Stories

1. "When project deadlines are approaching, I want to see all blockers across teams at a glance, so I can quickly intervene before delays cascade"

2. "When team members are in different time zones, I want to communicate updates asynchronously, so I can maintain momentum without scheduling meetings"

3. "When stakeholders ask for status updates, I want to share a real-time view of progress, so I don't spend time creating custom reports"

### Solution Mapping

**Feature**: Async status updates with @mentions
- **Jobs Addressed**: Keep team aligned, reduce meetings
- **Forces**: Push (email chaos), Pull (async communication), Anxiety reduction (structured format)
- **Priority**: Must-have
- **Success Criteria**: 50% reduction in status meetings within 1 month

**Feature**: Visual project timeline with blockers highlighted
- **Jobs Addressed**: Communicate blockers, track progress
- **Forces**: Push (scattered information), Pull (at-a-glance status)
- **Priority**: Must-have
- **Success Criteria**: Stakeholder questions answered without manual reports

## References

### Books
- **Competing Against Luck** by Clayton Christensen (2016) - The foundational JTBD book
- **The Jobs to Be Done Playbook** by Jim Kalbach (2020) - Practical JTBD implementation
- **When Coffee and Kale Compete** by Alan Klement (2018) - Progress-focused JTBD approach

### Online Resources
- [Intercom on Jobs to Be Done](https://www.intercom.com/resources/books/intercom-jobs-to-be-done)
- [JTBD.info](https://jtbd.info/) - Comprehensive JTBD resource
- [Jobs to Be Done Theory](https://jobstobedone.org/)
- [Re-Wired Group](https://www.rewiringamerica.org/) - Bob Moesta's JTBD resources

### Videos and Courses
- [Clayton Christensen on Jobs to Be Done](https://www.youtube.com/watch?v=sfGtw2C95Ms)
- [JTBD Masterclass by Bob Moesta](https://www.rewiringamerica.org/courses)
- [Intercom's JTBD Workshop](https://www.intercom.com/blog/jobs-to-be-done-workshop/)

### Case Studies
- [Intercom's Product Strategy](https://www.intercom.com/blog/product-strategy-means-saying-no/)
- [Basecamp's JTBD Approach](https://basecamp.com/gettingreal/02.1-whats-the-big-idea)
- [Snickers "You're Not You When You're Hungry"](https://hbr.org/2016/09/know-your-customers-jobs-to-be-done) - JTBD in marketing

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
**Methodology**: Jobs to Be Done
**Framework**: Babysitter SDK
