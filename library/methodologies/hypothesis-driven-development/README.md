# Hypothesis-Driven Development

> Treat every feature as an experiment with measurable outcomes

## Overview

Hypothesis-Driven Development (HDD) is a Lean Startup methodology that treats product features as scientific experiments. Instead of building what users ask for, teams formulate testable hypotheses about outcomes and measure whether features achieve them through rigorous A/B testing and data analysis.

**Key Philosophy**: Build to learn, not to launch. Fail fast, validate assumptions, and let data guide decisions.

## Methodology Origin

- **Popularized by**: Eric Ries (The Lean Startup, 2011)
- **Practiced at**: Microsoft, Amazon, Booking.com, Netflix
- **Foundation**: Scientific method applied to product development
- **Core Principle**: Every feature is an experiment; every experiment is a learning opportunity

## Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  HYPOTHESIS-DRIVEN DEVELOPMENT               │
└─────────────────────────────────────────────────────────────┘

1. FORMULATE HYPOTHESIS
   "We believe [feature] for [audience] will achieve [outcome].
    We'll know we're right when [measurable signal]."
   │
   ├─ Define feature, audience, outcome, success metric
   ├─ List assumptions being tested
   └─ Identify risks if wrong

2. DESIGN EXPERIMENT
   │
   ├─ Define control group (baseline experience)
   ├─ Define treatment group (new feature)
   ├─ Calculate sample size (statistical power analysis)
   ├─ Determine duration
   └─ Set guardrail metrics

3. SPECIFY MVP
   │
   ├─ Core functionality (minimum to test hypothesis)
   ├─ Cut all non-essential scope
   └─ Define instrumentation requirements

4. MEASUREMENT PLAN
   │
   ├─ Primary metrics (hypothesis success criteria)
   ├─ Secondary metrics (supporting indicators)
   ├─ Counter metrics (watch for negative effects)
   └─ Statistical tests and significance criteria

5. BUILD & DEPLOY
   │
   ├─ Implement MVP with instrumentation
   ├─ Validate all events tracking correctly
   └─ Deploy with A/B test assignment

6. RUN EXPERIMENT
   │
   ├─ Monitor data collection
   ├─ Check for instrumentation errors
   └─ Watch guardrail metrics

7. ANALYZE RESULTS
   │
   ├─ Statistical analysis (t-tests, confidence intervals)
   ├─ Effect size estimation
   ├─ Segment analysis
   └─ Qualitative feedback synthesis

8. MAKE DECISION
   │
   ├─ PERSEVERE: Hypothesis validated → scale feature
   ├─ PIVOT: Hypothesis partially validated → change direction
   └─ STOP: Hypothesis invalidated → abandon approach

9. CAPTURE LEARNINGS
   │
   ├─ Document validated/invalidated assumptions
   ├─ Record unexpected discoveries
   ├─ Update mental models
   └─ Formulate next hypothesis

   └─→ Loop back to step 1 with new hypothesis
```

## Hypothesis Format

**Standard Format**:
```
We believe [building this feature]
for [these people]
will achieve [this outcome].
We'll know we're right when [measurable signal].
```

**Example**:
```
We believe adding one-click checkout
for mobile users on product pages
will increase mobile conversion rate by 15%.
We'll know we're right when mobile purchase completion
increases from 2.5% to 2.9% (statistically significant at p<0.05).
```

## Usage

### Basic Usage

```javascript
import { run } from '@a5c-ai/babysitter-sdk';

const result = await run('methodologies/hypothesis-driven-development', {
  projectName: 'one-click-mobile-checkout',
  featureIdea: 'Add one-click checkout button on mobile product pages',
  targetAudience: 'mobile users browsing product pages',
  experimentDuration: 14, // days
  significanceLevel: 0.05
});
```

### With Planning Only (Skip Implementation)

```javascript
const result = await run('methodologies/hypothesis-driven-development', {
  projectName: 'personalized-recommendations',
  featureIdea: 'Show ML-powered personalized product recommendations',
  targetAudience: 'returning customers',
  skipImplementation: true, // Plan experiment without building
  experimentDuration: 21
});
```

### Complete Example

```javascript
const result = await run('methodologies/hypothesis-driven-development', {
  projectName: 'social-proof-badges',
  featureIdea: 'Display "Popular" badges on trending items',
  targetAudience: 'first-time visitors',
  context: {
    currentConversionRate: 0.023,
    averageOrderValue: 75.50,
    monthlyVisitors: 500000
  },
  experimentDuration: 14,
  significanceLevel: 0.05,
  skipImplementation: false
});

// Result includes:
// - hypothesis (formulated hypothesis statement)
// - experimentDesign (A/B test plan with sample sizes)
// - mvp (minimum viable product spec)
// - measurementPlan (metrics and instrumentation)
// - analysis (statistical analysis results)
// - decision (PERSEVERE, PIVOT, or STOP)
// - learnings (documented insights and next hypothesis)
```

## Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Name of the feature/experiment |
| `featureIdea` | string | No | '' | High-level description of feature or change |
| `targetAudience` | string | No | 'all users' | Target user segment |
| `experimentDuration` | number | No | 14 | Experiment duration in days |
| `significanceLevel` | number | No | 0.05 | Statistical significance threshold (p-value) |
| `skipImplementation` | boolean | No | false | Skip build phase (planning only) |
| `context` | object | No | null | Additional context (current metrics, constraints) |

## Outputs

```typescript
{
  success: boolean;
  projectName: string;
  hypothesis: {
    hypothesisStatement: string;
    feature: string;
    targetAudience: string;
    expectedOutcome: string;
    successMetric: string;
    assumptions: string[];
    risks: string[];
  };
  experimentDesign: {
    controlGroup: { description, experience, percentage };
    treatmentGroup: { description, experience, percentage };
    sampleSize: { perGroup, total, calculationMethod };
    duration: number;
    randomizationStrategy: string;
  };
  mvp: {
    coreFunctionality: string[];
    scopeCuts: string[];
    instrumentationRequirements: string[];
    successCriteria: string[];
  };
  measurementPlan: {
    primaryMetrics: Array<{ name, description, calculation, targetImprovement }>;
    secondaryMetrics: Array<{ name, description, calculation }>;
    counterMetrics: Array<{ name, description, threshold }>;
    instrumentationEvents: Array<{ eventName, trigger, properties }>;
  };
  analysis: {
    hypothesisValidated: boolean;
    statisticallySignificant: boolean;
    primaryMetricResults: { controlMean, treatmentMean, relativeChange, pValue };
  };
  decision: 'PERSEVERE' | 'PIVOT' | 'STOP';
  learnings: {
    keyLearnings: string[];
    validatedAssumptions: string[];
    invalidatedAssumptions: string[];
    nextHypothesis: { statement, rationale };
  };
}
```

## Key Principles

### 1. Hypothesis Format
- **Specific**: Clear, concrete feature description
- **Measurable**: Quantifiable success metric
- **Falsifiable**: Can be proven wrong
- **Outcome-focused**: Business/user value, not output

### 2. Experimentation
- **Rigorous design**: Statistical power analysis, proper sample sizes
- **Controlled**: A/B testing with randomization
- **Guardrails**: Monitor for negative side effects
- **Data quality**: Validate instrumentation thoroughly

### 3. Minimum Viable Product
- **Build to learn**: Minimum to test hypothesis
- **Ruthless scope cuts**: Remove everything non-essential
- **Instrumentation first**: Tracking is non-negotiable
- **Speed over polish**: Fast iteration beats perfection

### 4. Metrics
- **Primary metric**: Direct measure of hypothesis success
- **Secondary metrics**: Supporting indicators
- **Counter metrics**: Watch for negative impacts (cannibalization, churn, etc.)
- **Guardrail metrics**: Hard limits on acceptable harm

### 5. Decision Framework
- **PERSEVERE**: Hypothesis validated, statistically significant positive result → Ship and scale
- **PIVOT**: Hypothesis partially validated or mixed results → Change direction, test variant
- **STOP**: Hypothesis invalidated, negative or no effect → Abandon, try different approach

### 6. Learning Loop
- Document all learnings (even from "failed" experiments)
- Update mental models and assumptions
- Formulate next hypothesis based on insights
- Continuous experimentation cycle

## Integration Points

### Compose with Spec-Driven Development
Hypothesis informs the constitution and specification:
```javascript
// 1. Use HDD to validate high-level feature hypothesis
const hddResult = await run('methodologies/hypothesis-driven-development', {
  projectName: 'advanced-search-filters',
  skipImplementation: true // Planning only
});

// 2. If decision is PERSEVERE, use spec-driven for full implementation
if (hddResult.decision === 'PERSEVERE') {
  const specResult = await run('methodologies/spec-driven-development', {
    projectName: 'advanced-search-filters',
    initialRequirements: hddResult.mvp.coreFunctionality.join('\n'),
    constitutionPrinciples: [`Primary success metric: ${hddResult.hypothesis.successMetric}`]
  });
}
```

### Compose with Agile Sprints
Use HDD for sprint planning and validation:
```javascript
// Hypothesis per sprint goal
const sprintHypothesis = await run('methodologies/hypothesis-driven-development', {
  projectName: 'sprint-15-checkout-improvements',
  featureIdea: sprintBacklog.goal,
  experimentDuration: 7, // One sprint
  skipImplementation: true
});
```

## Best Practices

### DO
- ✅ Start with clear, measurable hypotheses
- ✅ Calculate proper sample sizes (avoid underpowered experiments)
- ✅ Run experiments long enough (account for weekly patterns)
- ✅ Validate instrumentation before launching
- ✅ Monitor guardrail metrics continuously
- ✅ Accept negative results (they provide learning)
- ✅ Document all learnings

### DON'T
- ❌ Skip the hypothesis (building without assumptions)
- ❌ P-hack or cherry-pick metrics after seeing results
- ❌ Stop experiments early without statistical justification
- ❌ Ignore counter metrics (tunnel vision on primary metric)
- ❌ Build too much before testing (violates MVP principle)
- ❌ Confuse correlation with causation
- ❌ Run too many concurrent experiments (interaction effects)

## Common Pitfalls

1. **Sample Ratio Mismatch (SRM)**: Control and treatment groups have different sizes than expected → indicates instrumentation bug
2. **Novelty Effect**: Users engage more with new feature just because it's new → run longer experiments
3. **Multiple Testing Problem**: Testing many metrics increases false positives → use Bonferroni correction
4. **Simpson's Paradox**: Aggregate results differ from segment results → always do segment analysis
5. **Underpowered Experiments**: Too small sample size → can't detect real effects
6. **Peeking**: Checking results before experiment ends → inflates false positive rate

## Statistical Considerations

### Sample Size Calculation
```
n = (Z_α/2 + Z_β)² × 2σ² / δ²

where:
- Z_α/2 = 1.96 for 95% confidence (two-tailed)
- Z_β = 0.84 for 80% power
- σ = standard deviation
- δ = minimum detectable effect
```

### Statistical Tests
- **Proportions** (conversion rates): Two-proportion z-test
- **Continuous** (revenue per user): Two-sample t-test or Mann-Whitney U
- **Multiple metrics**: Bonferroni or Benjamini-Hochberg correction

### Significance Criteria
- **Alpha (α)**: 0.05 (5% false positive rate)
- **Beta (β)**: 0.20 (80% statistical power)
- **Minimum detectable effect**: Depends on business impact vs. cost tradeoff

## Real-World Examples

### Example 1: Microsoft - Highlighting Search Ads
**Hypothesis**: We believe highlighting search ad backgrounds in yellow for search users will increase ad click-through rate by 10%. We'll know we're right when ad CTR increases from 3.5% to 3.85%.

**Result**: CTR increased, but user satisfaction decreased and organic search engagement dropped. Counter metrics saved Microsoft from shipping harmful change.

**Decision**: STOP - Hypothesis technically validated but counter metrics violated.

### Example 2: Booking.com - Scarcity Messaging
**Hypothesis**: We believe showing "Only 2 rooms left!" messages for hotel listings will increase booking conversion by 5%. We'll know we're right when conversion rate increases from 4.2% to 4.4%.

**Result**: Conversion increased 8% (exceeded target), no negative counter metrics.

**Decision**: PERSEVERE - Shipped to 100% of users, became standard practice.

### Example 3: Netflix - Autoplay Previews
**Hypothesis**: We believe autoplaying video previews on hover for browse page thumbnails will increase content discovery and viewing hours by 10%. We'll know we're right when hours watched per user increases.

**Result**: Mixed - Some segments loved it (increased engagement), others hated it (complained). Segment analysis revealed age/preference differences.

**Decision**: PIVOT - Added user preference toggle, shipped with opt-out option.

## References

### Books
- [The Lean Startup](http://theleanstartup.com/) by Eric Ries
- [Lean Analytics](https://leananalyticsbook.com/) by Alistair Croll & Benjamin Yoskovitz
- [Trustworthy Online Controlled Experiments](https://experimentguide.com/) by Kohavi, Tang, Xu

### Articles & Papers
- [Microsoft's Experimentation Platform](https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/)
- [Booking.com's A/B Testing Practices](https://booking.design/)
- [Netflix's Experimentation Platform](https://netflixtechblog.com/its-all-a-bout-testing-the-netflix-experimentation-platform-4e1ca458c15)
- [Ronny Kohavi's Papers on Experimentation](https://exp-platform.com/publications/)

### Tools
- **Experimentation Platforms**: Optimizely, LaunchDarkly, Split.io
- **Statistical Analysis**: R, Python (scipy.stats), statsmodels
- **Sample Size Calculators**: Evan's Awesome A/B Tools, Optimizely Calculator

## Tasks

This methodology defines the following tasks:

1. **formulate-hypothesis** - Formulate testable hypothesis with success criteria
2. **design-experiment** - Design A/B test with sample size calculation
3. **specify-mvp** - Specify minimum viable product for testing
4. **create-measurement-plan** - Define metrics and instrumentation
5. **implement-mvp** - Build MVP with complete instrumentation
6. **validate-instrumentation** - Verify all events are tracked correctly
7. **run-experiment** - Execute experiment and monitor data collection
8. **analyze-results** - Perform statistical analysis
9. **make-decision** - Decide whether to persevere, pivot, or stop
10. **capture-learnings** - Document learnings and next hypothesis

All tasks are defined in the main process file and use agent-based execution.

## License

Part of the Babysitter SDK Methodologies collection.

---

**Remember**: The goal is not to validate your hypothesis. The goal is to learn the truth about your users and market. Negative results are valuable results.
