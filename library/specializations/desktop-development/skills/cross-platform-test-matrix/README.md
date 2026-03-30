# cross-platform-test-matrix

Generate CI test matrix for multi-platform testing.

## Quick Start

```javascript
const result = await invokeSkill('cross-platform-test-matrix', {
  projectPath: '/path/to/project',
  ciPlatform: 'github-actions',
  platforms: ['windows', 'macos', 'linux'],
  architectures: ['x64', 'arm64']
});
```

## Features

- GitHub Actions/Azure DevOps
- Platform/architecture matrix
- Parallel execution
- Artifact collection

## Related Skills

- `playwright-electron-config`
- `desktop-ci-architect` agent
