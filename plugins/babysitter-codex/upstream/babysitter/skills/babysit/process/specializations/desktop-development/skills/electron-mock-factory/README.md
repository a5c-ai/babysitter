# electron-mock-factory

Generate mocks for Electron APIs for unit testing.

## Quick Start

```javascript
const result = await invokeSkill('electron-mock-factory', {
  projectPath: '/path/to/electron-app',
  testFramework: 'jest',
  modulesToMock: ['ipcMain', 'ipcRenderer', 'dialog', 'app']
});
```

## Features

- IPC mocks
- Dialog mocks
- BrowserWindow mocks
- Jest/Vitest support

## Related Skills

- `playwright-electron-config`
- `desktop-unit-testing` process
