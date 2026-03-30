---
name: aria
description: WAI-ARIA implementation, roles, states, and properties.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# ARIA Skill

Expert assistance for WAI-ARIA implementation.

## Capabilities

- Implement ARIA roles
- Manage states and properties
- Create accessible widgets
- Handle live regions
- Test with screen readers

## Common Patterns

```tsx
// Modal dialog
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Title</h2>
  <p id="dialog-desc">Description</p>
</div>

// Live region
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Tab panel
<div role="tablist">
  <button role="tab" aria-selected={selected} aria-controls="panel-1">
    Tab 1
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Content
</div>
```

## Target Processes

- aria-implementation
- accessibility-improvement
- screen-reader-support
