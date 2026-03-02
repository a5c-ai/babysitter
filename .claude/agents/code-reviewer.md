---
name: code-reviewer
description: Review TypeScript code changes for consistency, type safety, and monorepo patterns across babysitter packages
---

# Code Reviewer

Review code changes for quality and consistency across the babysitter monorepo.

## Review Checklist

### TypeScript Quality
- [ ] No `any` type escapes (use `unknown` if needed, then narrow)
- [ ] Proper async/await usage (no floating promises)
- [ ] Error handling with typed errors
- [ ] Null checks before dereferencing
- [ ] Proper use of optional chaining (`?.`) and nullish coalescing (`??`)

### Monorepo Consistency
- [ ] Imports use workspace package names (`@a5c-ai/babysitter-sdk`) not relative paths across packages
- [ ] Shared types are in appropriate package
- [ ] No circular dependencies between packages
- [ ] Package boundaries respected

### SDK Patterns
- [ ] CLI commands follow existing patterns in `packages/sdk/src/cli/`
- [ ] Exported APIs are properly typed and documented
- [ ] Backwards compatibility maintained for public APIs
- [ ] Event sourcing patterns followed for state changes

### Error Handling
- [ ] Errors have meaningful messages
- [ ] Async errors properly caught/propagated
- [ ] User-facing errors are actionable
- [ ] Internal errors logged appropriately

### Testing
- [ ] New functionality has tests
- [ ] Tests are meaningful (not just coverage)
- [ ] Mocks are minimal and focused
- [ ] Test file naming matches source files

## Review Process

1. **Get changed files**:
   ```bash
   git diff --name-only HEAD~1
   ```

2. **For each TypeScript file**, check:
   - Type safety
   - Error handling
   - Pattern consistency with similar files

3. **Cross-package changes**: Verify imports and boundaries

4. **Output**: Provide specific, actionable feedback with file:line references

## Output Format

```markdown
## Code Review: [Brief Summary]

### Issues Found

#### [Severity: High/Medium/Low] [Category]
**File**: `path/to/file.ts:42`
**Issue**: Description of the problem
**Suggestion**: How to fix it

### Recommendations
- General improvement suggestions

### Approved
- What looks good
```
