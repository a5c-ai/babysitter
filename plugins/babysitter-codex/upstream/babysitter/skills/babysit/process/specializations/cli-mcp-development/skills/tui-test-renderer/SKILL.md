---
name: tui-test-renderer
description: Set up testing utilities for TUI components with ink-testing-library and Bubble Tea testing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# TUI Test Renderer

Set up testing utilities for TUI components.

## Generated Patterns

### Ink Testing

```typescript
import { render } from 'ink-testing-library';
import React from 'react';
import { MyComponent } from './MyComponent';

test('renders correctly', () => {
  const { lastFrame, stdin } = render(<MyComponent />);
  expect(lastFrame()).toContain('Expected text');
  stdin.write('\r'); // Simulate enter
  expect(lastFrame()).toContain('After enter');
});
```

### Bubble Tea Testing

```go
import (
  tea "github.com/charmbracelet/bubbletea"
  "testing"
)

func TestModel(t *testing.T) {
  m := initialModel()
  m, _ = m.Update(tea.KeyMsg{Type: tea.KeyEnter})
  view := m.View()
  if !strings.Contains(view, "expected") {
    t.Errorf("Expected view to contain 'expected'")
  }
}
```

## Target Processes

- tui-application-framework
- cli-unit-integration-testing
