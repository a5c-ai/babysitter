# Developer Experience Documentation Specialist Agent

## Overview

The `dx-docs-specialist` agent provides expertise in developer experience for documentation, focusing on onboarding optimization, interactive documentation, time-to-first-success metrics, and documentation usability.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Developer Experience Lead |
| **Experience** | 6+ years in developer relations |
| **Background** | Software development, DevRel |
| **Philosophy** | "Best docs are the ones you don't need" |

## Core Expertise

1. **Onboarding** - Optimize getting started experience
2. **Interactive Docs** - Code playgrounds and tutorials
3. **TTFS** - Time-to-first-success optimization
4. **Usability** - Documentation UX design
5. **Feedback** - Measure and improve continuously

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(dxDocsTask, {
  agentName: 'dx-docs-specialist',
  prompt: {
    role: 'Developer Experience Lead',
    task: 'Optimize onboarding documentation',
    context: {
      currentDocs: docsContent,
      analytics: usageData,
      feedback: userFeedback
    },
    instructions: [
      'Analyze current TTFS',
      'Identify friction points',
      'Propose improvements',
      'Create optimized flow'
    ],
    outputFormat: 'Markdown'
  }
});
```

### Direct Invocation

```bash
# Analyze onboarding
/agent dx-docs-specialist analyze-onboarding \
  --docs-path ./docs/getting-started

# Optimize quickstart
/agent dx-docs-specialist optimize-quickstart \
  --target-ttfs "10 minutes"

# Create interactive tutorial
/agent dx-docs-specialist create-tutorial \
  --topic "authentication" \
  --interactive
```

## Common Tasks

### 1. Onboarding Analysis

```bash
/agent dx-docs-specialist analyze-onboarding \
  --docs-path ./docs/getting-started \
  --include-metrics
```

Output:
- Current TTFS estimate
- Friction points identified
- Improvement recommendations
- Optimized flow proposal

### 2. Quick Start Optimization

```bash
/agent dx-docs-specialist optimize-quickstart \
  --target-ttfs "5 minutes" \
  --include-playground
```

Output:
- Streamlined quickstart
- Interactive elements
- Copy-paste examples
- Success validation

### 3. Tutorial Creation

```bash
/agent dx-docs-specialist create-tutorial \
  --topic "webhooks" \
  --steps 5 \
  --interactive
```

Output:
- Step-by-step tutorial
- Progress indicators
- Checkpoints
- Interactive code blocks

## DX Metrics

### Time-to-First-Success (TTFS)

| Rating | Time | Description |
|--------|------|-------------|
| Excellent | < 5 min | Instant gratification |
| Good | 5-10 min | Quick win |
| Acceptable | 10-30 min | Standard |
| Poor | > 30 min | Needs work |

### Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| TTFS | < 10 min | Time to working code |
| Tutorial Completion | > 70% | Users finishing tutorials |
| Bounce Rate | < 30% | Single page visits |
| First-Run Errors | < 5% | Errors in first session |

## Documentation Patterns

### Optimized Quick Start

```markdown
# Quick Start

## No Setup Required
Try it in your browser now:

<Playground template="quickstart" />

## Install Locally
```bash
npm install @company/sdk
```

## Your First Call
```javascript
const result = await client.hello();
// Output: { message: "Hello!" }
```

<CopyButton />

## Next Steps
[Continue to Guides](/guides)
```

### Interactive Tutorial

```markdown
# Build Your First App

<Progress current={1} total={5} />

## Step 1: Setup
<Task>
Create a new project:
```bash
mkdir my-app && cd my-app
```
</Task>

<Checkpoint>
Verify you're in the new directory.
</Checkpoint>

<NextStep href="/tutorial/step-2" />
```

## Onboarding Checklist

### Prerequisites
- [ ] Minimal requirements (< 3)
- [ ] Links to install guides
- [ ] Version requirements clear

### First Success
- [ ] Under 10 minutes
- [ ] Copy-paste ready code
- [ ] Immediate feedback
- [ ] Clear success indicator

### Error Handling
- [ ] Common errors documented
- [ ] Helpful error messages
- [ ] Troubleshooting section
- [ ] Support links

### Next Steps
- [ ] Clear progression path
- [ ] Related resources
- [ ] Advanced topics linked

## Process Integration

| Process | Agent Role |
|---------|------------|
| `interactive-tutorials.js` | Design interactive content |
| `how-to-guides.js` | Usability review |
| `knowledge-base-setup.js` | DX-optimized structure |
| `sdk-doc-generation.js` | Quickstart optimization |

## Developer Journey

| Stage | Goal | DX Focus |
|-------|------|----------|
| Awareness | Understand value | Clear messaging |
| Evaluation | Assess fit | Interactive demos |
| Onboarding | First success | Minimal friction |
| Integration | Build production | Complete docs |
| Operation | Maintain | Troubleshooting |
| Advocacy | Recommend | Community |

## Feedback Collection

### Page-Level Feedback

```markdown
## Was this helpful?

<Feedback
  positive="Yes, thanks!"
  negative="No, needs improvement"
  followUp={true}
/>
```

### Feedback Categories

| Category | Signal | Action |
|----------|--------|--------|
| Missing Info | "can't find" | Add content |
| Confusing | "unclear" | Simplify |
| Broken Code | "doesn't work" | Fix examples |
| Outdated | "old version" | Update |

## Example Output

### Onboarding Analysis

```json
{
  "currentState": {
    "ttfs": "25 minutes",
    "steps": 8,
    "prerequisites": 5,
    "frictionPoints": [
      "Account creation before any value",
      "Complex SDK installation",
      "Missing code examples"
    ]
  },
  "recommendations": [
    {
      "action": "Add browser playground",
      "impact": "Reduce TTFS by 15 min",
      "effort": "Medium"
    },
    {
      "action": "Provide demo API key",
      "impact": "Remove sign-up friction",
      "effort": "Low"
    }
  ],
  "targetState": {
    "ttfs": "5 minutes",
    "steps": 3
  }
}
```

## References

- [Developer Experience](https://www.developerexperience.io/)
- [Time to First Hello World](https://www.twilio.com/blog/time-to-first-hello-world)
- [Documentation UX](https://www.writethedocs.org/)
- [Developer Relations](https://www.devrel.co/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-008
**Category:** Developer Experience
**Status:** Active
