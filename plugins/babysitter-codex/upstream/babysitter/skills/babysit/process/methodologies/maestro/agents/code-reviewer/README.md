# Code Reviewer Agent

The Code Reviewer is a specialized agent in the Maestro framework dedicated to independent code quality verification. It enforces the separation of review from authorship and applies DRY, YAGNI, abstraction, and coverage checks.

## Key Behaviors

- Systematic principle-based review (DRY, YAGNI, abstraction, coverage)
- Provides file:line references for all issues
- Numeric quality scoring
- Never writes code, only reviews

## Related Skills

- `code-review-gate` - Principle enforcement review

## Attribution

Adapted from [Maestro App Factory](https://github.com/SnapdragonPartners/maestro) by SnapdragonPartners (MIT License).
