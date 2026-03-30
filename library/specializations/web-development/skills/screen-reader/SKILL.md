---
name: screen-reader
description: Screen reader compatibility, testing, and optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Screen Reader Skill

Expert assistance for screen reader compatibility.

## Capabilities

- Test with screen readers
- Optimize reading order
- Handle announcements
- Manage focus
- Write accessible content

## Testing Tools

- NVDA (Windows)
- VoiceOver (macOS/iOS)
- JAWS (Windows)
- TalkBack (Android)

## Best Practices

```tsx
// Visually hidden but screen reader accessible
<span className="sr-only">Close dialog</span>

// Skip links
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// Reading order
// Ensure DOM order matches visual order
```

## Target Processes

- screen-reader-testing
- accessibility-optimization
- user-testing
