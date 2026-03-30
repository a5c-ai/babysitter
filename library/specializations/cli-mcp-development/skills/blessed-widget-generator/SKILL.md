---
name: blessed-widget-generator
description: Generate blessed widgets for Node.js terminal UIs with boxes, lists, forms, and dashboard layouts.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Blessed Widget Generator

Generate blessed widgets for Node.js terminal UIs.

## Capabilities

- Generate blessed widget definitions
- Create dashboard layouts
- Set up interactive forms
- Implement custom components
- Configure styling and borders
- Create event handling patterns

## Usage

Invoke this skill when you need to:
- Build terminal dashboards with Node.js
- Create complex TUI layouts
- Implement monitoring interfaces
- Set up blessed project structure

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Project name |
| layout | string | No | Layout type (dashboard, form, list) |
| widgets | array | No | Widget definitions |

## Generated Patterns

### Dashboard Layout

```javascript
const blessed = require('blessed');
const contrib = require('blessed-contrib');

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'System Dashboard',
});

// Create grid layout
const grid = new contrib.grid({
  rows: 12,
  cols: 12,
  screen: screen,
});

// CPU Line Chart
const cpuLine = grid.set(0, 0, 4, 6, contrib.line, {
  style: { line: 'yellow', text: 'green', baseline: 'black' },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  label: 'CPU Usage',
});

// Memory Gauge
const memGauge = grid.set(0, 6, 4, 6, contrib.gauge, {
  label: 'Memory Usage',
  stroke: 'green',
  fill: 'white',
});

// Log Box
const logBox = grid.set(4, 0, 4, 12, contrib.log, {
  fg: 'green',
  selectedFg: 'green',
  label: 'Logs',
});

// Process Table
const processTable = grid.set(8, 0, 4, 12, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: 'Processes',
  columnSpacing: 4,
  columnWidth: [10, 30, 10, 10],
});

// Update data
function updateDashboard() {
  // CPU data
  cpuLine.setData([{
    title: 'CPU',
    x: ['1', '2', '3', '4', '5'],
    y: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
  }]);

  // Memory
  memGauge.setPercent(Math.random() * 100);

  // Logs
  logBox.log(`[${new Date().toISOString()}] System event`);

  // Processes
  processTable.setData({
    headers: ['PID', 'Name', 'CPU', 'MEM'],
    data: [
      ['1234', 'node', '2.5%', '150MB'],
      ['5678', 'chrome', '15.2%', '500MB'],
    ],
  });

  screen.render();
}

// Key bindings
screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

// Update interval
setInterval(updateDashboard, 1000);
updateDashboard();

screen.render();
```

### Form Widget

```javascript
const blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Configuration Form',
});

const form = blessed.form({
  parent: screen,
  keys: true,
  left: 'center',
  top: 'center',
  width: 60,
  height: 20,
  border: { type: 'line' },
  style: { border: { fg: 'blue' } },
});

// Input field
blessed.text({
  parent: form,
  top: 1,
  left: 2,
  content: 'Username:',
});

const usernameInput = blessed.textbox({
  parent: form,
  name: 'username',
  top: 1,
  left: 12,
  height: 1,
  width: 40,
  inputOnFocus: true,
  style: { fg: 'white', bg: 'black' },
});

// Password field
blessed.text({
  parent: form,
  top: 3,
  left: 2,
  content: 'Password:',
});

const passwordInput = blessed.textbox({
  parent: form,
  name: 'password',
  top: 3,
  left: 12,
  height: 1,
  width: 40,
  censor: true,
  inputOnFocus: true,
  style: { fg: 'white', bg: 'black' },
});

// Submit button
const submitBtn = blessed.button({
  parent: form,
  name: 'submit',
  content: ' Submit ',
  top: 6,
  left: 'center',
  shrink: true,
  style: {
    fg: 'white',
    bg: 'blue',
    focus: { bg: 'green' },
  },
});

submitBtn.on('press', () => {
  form.submit();
});

form.on('submit', (data) => {
  console.log('Form data:', data);
  process.exit(0);
});

screen.key(['escape', 'q'], () => process.exit(0));
screen.render();
```

## Dependencies

```json
{
  "dependencies": {
    "blessed": "^0.1.81",
    "blessed-contrib": "^4.10.1"
  }
}
```

## Target Processes

- tui-application-framework
- dashboard-monitoring-tui
- interactive-form-implementation
