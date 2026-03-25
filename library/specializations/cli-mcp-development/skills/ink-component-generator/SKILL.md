---
name: ink-component-generator
description: Generate Ink (React for CLI) components for terminal UIs with hooks, state management, and layout components.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Ink Component Generator

Generate Ink (React) components for terminal UIs.

## Capabilities

- Generate Ink React components
- Create custom hooks for CLI state
- Set up layout components (Box, Text)
- Implement input handling
- Create loading and progress components
- Set up testing with ink-testing-library

## Usage

Invoke this skill when you need to:
- Build terminal UIs with React patterns
- Create interactive CLI components
- Implement stateful terminal interfaces
- Set up Ink project structure

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Project name |
| components | array | Yes | Component definitions |
| includeHooks | boolean | No | Generate custom hooks |

### Component Structure

```json
{
  "components": [
    {
      "name": "SelectList",
      "type": "interactive",
      "props": ["items", "onSelect"],
      "state": ["selectedIndex"]
    }
  ]
}
```

## Generated Patterns

### Select List Component

```tsx
import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

interface SelectListProps {
  items: string[];
  onSelect: (item: string, index: number) => void;
}

export const SelectList: React.FC<SelectListProps> = ({ items, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(items[selectedIndex], selectedIndex);
    } else if (input === 'q' || key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={item}>
          <Text color={index === selectedIndex ? 'green' : undefined}>
            {index === selectedIndex ? '> ' : '  '}
            {item}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select, q to quit</Text>
      </Box>
    </Box>
  );
};
```

### Text Input Component

```tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface TextInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  mask?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder = '',
  onSubmit,
  mask,
}) => {
  const [value, setValue] = useState('');
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
      setCursor((prev) => Math.max(0, prev - 1));
      return;
    }
    if (!key.ctrl && !key.meta && input) {
      setValue((prev) => prev + input);
      setCursor((prev) => prev + 1);
    }
  });

  const displayValue = mask ? mask.repeat(value.length) : value;

  return (
    <Box>
      <Text>
        {displayValue || <Text dimColor>{placeholder}</Text>}
        <Text backgroundColor="white"> </Text>
      </Text>
    </Box>
  );
};
```

### Spinner Component

```tsx
import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface SpinnerProps {
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ label }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text>
      <Text color="green">{frames[frame]}</Text>
      {label && <Text> {label}</Text>}
    </Text>
  );
};
```

### Custom Hook - useAsync

```tsx
import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: any[] = []
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}
```

## Dependencies

```json
{
  "dependencies": {
    "ink": "^4.0.0",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "ink-testing-library": "^3.0.0"
  }
}
```

## Target Processes

- tui-application-framework
- interactive-form-implementation
- dashboard-monitoring-tui
