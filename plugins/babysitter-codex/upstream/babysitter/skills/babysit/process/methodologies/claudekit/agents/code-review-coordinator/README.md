# Code Review Coordinator Agent

Orchestrates the 6-agent parallel code review and produces a unified recommendation.

## Dimensions Coordinated

1. **Architecture** (20%): Module boundaries, dependency direction, design patterns
2. **Security** (25%): Injection, auth, secrets, input validation
3. **Performance** (15%): Algorithmic complexity, resource leaks, caching
4. **Testing** (15%): Coverage, edge cases, test quality
5. **Quality** (15%): Naming, structure, error handling, type safety
6. **Documentation** (10%): JSDoc, README updates, inline comments

## Invocation

Used by process: `methodologies/claudekit/claudekit-code-review`
