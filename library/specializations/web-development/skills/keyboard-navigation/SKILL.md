---
name: keyboard-navigation
description: Keyboard accessibility, focus management, and shortcuts.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Keyboard Navigation Skill

Expert assistance for keyboard accessibility.

## Capabilities

- Implement keyboard navigation
- Manage focus
- Create keyboard shortcuts
- Handle focus trapping
- Test keyboard access

## Focus Management

```tsx
// Focus trap for modals
function useFocusTrap(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
}
```

## Target Processes

- keyboard-accessibility
- focus-management
- accessibility-implementation
