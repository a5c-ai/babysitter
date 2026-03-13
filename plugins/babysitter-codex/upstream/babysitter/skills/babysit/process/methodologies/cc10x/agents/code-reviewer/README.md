# Code Reviewer Agent

Multi-dimensional quality assessor used in BUILD, DEBUG, and REVIEW workflows. Only reports issues with >=80% confidence.

## Review Dimensions

1. **Security**: injection, auth, secrets, input validation
2. **Quality**: naming, structure, patterns, error handling
3. **Performance**: complexity, leaks, caching
4. **Maintainability**: docs, tests, readability, tech debt

## Invocation

Used by processes: `methodologies/cc10x/cc10x-build`, `cc10x-debug`, `cc10x-review`
