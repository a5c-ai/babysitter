# Hypothesis-Driven Development Examples

This directory contains example inputs for the Hypothesis-Driven Development methodology demonstrating various experiment types and use cases.

## Example Files

### 1. one-click-checkout.json
**Scenario**: Mobile e-commerce conversion optimization

Test whether one-click checkout increases mobile conversion rate by reducing friction in the purchase flow.

**Key Learning Goals**:
- Does reducing checkout steps overcome mobile abandonment?
- Are users comfortable with one-click on mobile?
- What are the counter-metric risks (accidental purchases, decreased AOV)?

**Experiment Type**: Feature addition (new capability)

---

### 2. personalized-recommendations.json
**Scenario**: ML-powered engagement and revenue optimization

Test whether personalized product recommendations increase click-through rate and revenue per session for returning customers.

**Key Learning Goals**:
- Can ML model accurately predict user preferences?
- Does personalization increase engagement and revenue?
- Are there filter bubble or privacy concerns?

**Experiment Type**: ML feature (complex implementation)

**Note**: Requires ML infrastructure and model training. Consider starting with simpler collaborative filtering.

---

### 3. social-proof-badges.json
**Scenario**: First-time visitor conversion through social proof

Test whether displaying "Popular," "Trending," and "X viewing now" badges increases conversion for new visitors.

**Key Learning Goals**:
- Does social proof reduce decision anxiety for new users?
- Are badges perceived as credible or manipulative?
- Do non-badged items suffer (negative contrast effect)?

**Experiment Type**: UI enhancement (lightweight implementation)

**Special Consideration**: Multi-arm test to isolate static vs. real-time social proof effects.

---

### 4. free-shipping-threshold.json
**Scenario**: Unit economics optimization (price/threshold change)

Test whether raising free shipping threshold from $50 to $75 increases average order value without significantly hurting conversion rate.

**Key Learning Goals**:
- Will customers add items to reach new threshold?
- What is the conversion rate vs. AOV tradeoff?
- Which customer segments are most affected?

**Experiment Type**: Pricing/threshold change (high-risk)

**Special Consideration**: Includes economic analysis and segmentation strategy. Break-even calculations critical.

---

## Common Patterns Across Examples

### Hypothesis Structure
All examples follow the standard format:
```
"We believe [feature] for [audience] will achieve [outcome].
We'll know we're right when [measurable signal]."
```

### Metric Categories
Each example defines:
- **Primary metrics**: Direct hypothesis validation
- **Secondary metrics**: Supporting indicators
- **Counter metrics**: Watch for negative side effects

### Context-Driven
All examples include business context:
- Current baseline metrics
- Target audience size
- Economic constraints
- Risk factors

### Segmentation
Examples demonstrate different segmentation strategies:
- Mobile vs. desktop (one-click-checkout)
- New vs. returning visitors (social-proof-badges)
- Customer value tiers (free-shipping-threshold)

## How to Use These Examples

### Run an Example
```bash
# Using babysitter CLI
babysitter run methodologies/hypothesis-driven-development \
  --input examples/one-click-checkout.json

# Using SDK
import { run } from '@a5c-ai/babysitter-sdk';
const example = require('./examples/one-click-checkout.json');
const result = await run('methodologies/hypothesis-driven-development', example.inputs);
```

### Adapt for Your Use Case
1. Copy an example similar to your scenario
2. Update `projectName`, `featureIdea`, and `targetAudience`
3. Provide your current metrics in `context`
4. Adjust `experimentDuration` based on traffic volume
5. Review expected hypothesis and metrics for relevance

### Planning Mode
All examples can run in planning mode (skip implementation):
```javascript
const planningInputs = {
  ...example.inputs,
  skipImplementation: true
};
```

## Example Selection Guide

| Your Scenario | Use This Example | Why |
|---------------|------------------|-----|
| Reduce friction/steps | one-click-checkout | Tests process simplification |
| Personalization/ML | personalized-recommendations | Complex feature with ML considerations |
| Increase trust/credibility | social-proof-badges | Social proof and influence tactics |
| Pricing/economic optimization | free-shipping-threshold | Revenue vs. conversion tradeoff |
| New feature validation | Any | All demonstrate feature hypothesis testing |

## Real-World Considerations

### Sample Size Requirements
- **one-click-checkout**: High traffic needed (mobile product pages)
- **personalized-recommendations**: Moderate traffic (returning visitors only)
- **social-proof-badges**: Highest traffic needed (first-time visitors)
- **free-shipping-threshold**: Moderate traffic (all customers)

### Implementation Complexity
- **Simplest**: social-proof-badges (UI-only)
- **Moderate**: one-click-checkout, free-shipping-threshold
- **Complex**: personalized-recommendations (requires ML infrastructure)

### Business Risk
- **Low**: social-proof-badges (easy to rollback)
- **Medium**: one-click-checkout, personalized-recommendations
- **High**: free-shipping-threshold (pricing changes are risky)

## Common Experiment Patterns

### Feature Addition
- Example: one-click-checkout, personalized-recommendations, social-proof-badges
- Pattern: Control = existing experience, Treatment = existing + new feature
- Risk: Lower (additive change)

### Feature Change
- Example: free-shipping-threshold
- Pattern: Control = current setting, Treatment = new setting
- Risk: Higher (substitutive change)

### Multi-Arm Tests
- Example: social-proof-badges (static vs. real-time)
- Pattern: Control + multiple treatment variants
- Benefit: Isolate effects of different variations

## Tips for Writing Good Hypotheses

### From These Examples

1. **Be Specific** (one-click-checkout)
   - Bad: "Make mobile checkout better"
   - Good: "Add one-click checkout for users with saved payment info"

2. **Quantify Outcomes** (free-shipping-threshold)
   - Bad: "Increase revenue"
   - Good: "Increase AOV to $64+ without >5% conversion drop"

3. **Define Success Metrics** (personalized-recommendations)
   - Bad: "Improve engagement"
   - Good: "Increase recommendation CTR from 5% to 8%"

4. **Identify Counter Metrics** (social-proof-badges)
   - Example: "Watch for decreased trust score or non-badged item performance"
   - Why: Prevent tunnel vision on primary metric

5. **State Assumptions** (all examples)
   - List what must be true for hypothesis to work
   - Example: "Users trust one-click on mobile" (one-click-checkout)

## Next Steps

After running these examples:
1. Review the generated artifacts (hypothesis, experiment design, measurement plan)
2. Compare expected vs. actual hypothesis formulation
3. Examine the statistical analysis approach
4. Study the decision framework (PERSEVERE/PIVOT/STOP)
5. Adapt the patterns to your own product experiments

## Further Reading

- See main README.md for methodology overview
- See hypothesis-driven-development.js for implementation details
- See backlog.md for methodology research and best practices
