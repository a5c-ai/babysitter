# startup-time-profiler

Profile and optimize application startup time.

## Quick Start

```javascript
const result = await invokeSkill('startup-time-profiler', {
  projectPath: '/path/to/project',
  framework: 'electron',
  iterations: 5
});
```

## Features

- Cold/warm start measurement
- Module loading analysis
- Bottleneck identification
- Optimization recommendations

## Related Skills

- `memory-leak-detector`
- `bundle-size-analyzer`
