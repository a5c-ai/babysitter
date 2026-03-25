# power-management-monitor

Monitor system power state and events.

## Quick Start

```javascript
const result = await invokeSkill('power-management-monitor', {
  projectPath: '/path/to/project',
  framework: 'electron',
  events: ['suspend', 'resume', 'on-battery', 'on-ac']
});
```

## Features

- Battery monitoring
- Sleep/wake events
- Prevent system sleep
- Power-aware features

## Related Skills

- `screen-capture-api`
- `system-services-integration` process
