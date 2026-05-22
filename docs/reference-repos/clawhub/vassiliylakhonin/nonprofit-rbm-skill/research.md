# clawhub/vassiliylakhonin/nonprofit-rbm-skill

- **Archetype**: Domain-specific process skill (nonprofit grant writing)
- **Stars**: 2 (GitHub) / Unknown ClawHub stats
- **Last pushed**: 2026-03-19
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: clawhub-skills (GitHub search for ClawHub skills with MIT license)
- **Skills found**: 1

## Summary

A highly structured ClawHub skill for generating donor-ready nonprofit project packages. Implements Results-Based Management (RBM) methodology with a rigorous 8-step workflow covering:

1. Parse and scope (location, target group, problem, impact, budget, duration)
2. Strategic context (drivers, stakeholders, risks, donor-fit extraction)
3. Program logic (RBM chain, Theory of Change, logframe, SMART indicators)
4. MEAL + GESI + SDG (monitoring, evaluation, accountability, gender/inclusion, SDG mapping)
5. Safeguarding/Do No Harm (PSEA, conflict sensitivity, privacy, environmental screening)
6. Budget logic (personnel/travel/equipment with red-flag checks)
7. Draft/adapt (donor-aligned framing)
8. Readiness check (risk matrix, compliance score, confidence report)

Delivers a 22-item package from Elevator Pitch through JSON Export Block. Includes evidence/source policy with confidence labels, compliance scoring, and source-limited fallback mode.

## Assessment

**MEDIUM VALUE** -- While only 155 lines, this is one of the most well-structured domain-specific process definitions found in the ClawHub ecosystem. It demonstrates excellent patterns for:

1. **Evidence rigor**: Confidence labels (HIGH/MEDIUM/UNVERIFIED) with source requirements and fallback mode when sources aren't available
2. **Compliance scoring**: Quantified readiness assessment (XX/100) with pass/warn/fail indicators
3. **Multi-mode invocation**: Express, concept, LOI, CFP, review, peer-review, donor-fit, JSON modes
4. **Validation sprint**: Built-in 2-week validation with stop/go triggers

This is a good example of a "specialization" process that could live in babysitter's process library under `specializations/domains/social-sciences-humanities/nonprofit-development/`.

## Extraction Priority

**P1 -- Extract as a domain specialization**

### Processes

1. **Nonprofit Grant Package Generator** (specializations/domains/social-sciences-humanities/nonprofit-development/): Full RBM-based grant writing process with Theory of Change, logframe, MEAL plan, GESI analysis, safeguarding review, budget, and compliance scoring. An excellent template for other domain-specific proposal/analysis processes.

2. **Evidence-Graded Research Pattern** (methodologies/ or shared/): The evidence confidence labeling pattern (HIGH/MEDIUM/UNVERIFIED) with source-limited fallback mode is reusable across many domain processes.

### Plugin Ideas

None -- this is purely process content, no plugin architecture patterns.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Nonprofit Grant Package Generator | NEW | Full RBM-based grant writing with Theory of Change, logframe, MEAL, GESI, and compliance scoring | - | specializations/business/nonprofit-grant-package-generator.js |
| Evidence-Graded Research Pattern | NEW | Confidence labeling pattern (HIGH/MEDIUM/UNVERIFIED) with source-limited fallback mode | - | specializations/shared/evidence-graded-research-pattern.js |
| Results-Based Management Framework | NEW | RBM chain implementation with strategic context, program logic, and validation sprint | - | specializations/business/results-based-management-framework.js |
| Compliance Scoring Methodology | NEW | Quantified readiness assessment with pass/warn/fail indicators and confidence reporting | - | specializations/shared/compliance-scoring-methodology.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No plugin ideas identified - purely process content, no plugin architecture patterns | - | N/A |
