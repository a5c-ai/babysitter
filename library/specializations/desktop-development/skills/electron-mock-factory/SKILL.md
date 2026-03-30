---
name: electron-mock-factory
description: Generate mocks for Electron APIs (ipcMain, ipcRenderer, dialog, etc.) for unit testing
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, testing, mocks, unit-testing, jest]
---

# electron-mock-factory

Generate mocks for Electron APIs to enable unit testing of main and renderer process code without running Electron.

## Capabilities

- Mock ipcMain/ipcRenderer
- Mock dialog module
- Mock BrowserWindow
- Mock shell, clipboard, app
- Generate Jest/Vitest mocks
- Create test utilities

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "testFramework": { "enum": ["jest", "vitest", "mocha"] },
    "modulesToMock": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Generated Mocks

```javascript
// __mocks__/electron.js
module.exports = {
  app: {
    getPath: jest.fn(name => `/mock/${name}`),
    getVersion: jest.fn(() => '1.0.0'),
    quit: jest.fn(),
    on: jest.fn()
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
    removeHandler: jest.fn()
  },
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn(() => Promise.resolve({ filePaths: [] })),
    showSaveDialog: jest.fn(() => Promise.resolve({ filePath: undefined })),
    showMessageBox: jest.fn(() => Promise.resolve({ response: 0 }))
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: { send: jest.fn(), on: jest.fn() }
  }))
};
```

## Usage

```javascript
jest.mock('electron');
const { ipcRenderer } = require('electron');

test('sends message', () => {
  myModule.sendMessage('hello');
  expect(ipcRenderer.send).toHaveBeenCalledWith('channel', 'hello');
});
```

## Related Skills

- `playwright-electron-config`
- `desktop-unit-testing` process
