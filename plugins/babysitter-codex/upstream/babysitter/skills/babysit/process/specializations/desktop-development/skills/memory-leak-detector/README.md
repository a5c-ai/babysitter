# memory-leak-detector

Detect memory leaks through heap analysis.

## Quick Start

```javascript
const result = await invokeSkill('memory-leak-detector', {
  projectPath: '/path/to/project',
  framework: 'electron',
  duration: 60
});
```

## Features

- Heap snapshot comparison
- Growth pattern detection
- Common leak identification
- Fix suggestions

## Related Skills

- `electron-memory-profiler`
- `startup-time-profiler`
