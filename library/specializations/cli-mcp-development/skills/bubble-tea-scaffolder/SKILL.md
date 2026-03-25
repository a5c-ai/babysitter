---
name: bubble-tea-scaffolder
description: Generate Bubble Tea (Go) TUI application structure with models, commands, and views using the Elm architecture.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Bubble Tea Scaffolder

Generate Bubble Tea TUI applications with Go and Elm architecture.

## Capabilities

- Generate Bubble Tea project structure
- Create models with Init, Update, View
- Set up commands and messages
- Implement component composition
- Create styling with Lip Gloss
- Set up testing patterns

## Usage

Invoke this skill when you need to:
- Build terminal UIs in Go
- Create interactive CLI with Elm architecture
- Implement complex TUI applications
- Set up Bubble Tea project structure

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Project name |
| modulePath | string | Yes | Go module path |
| components | array | No | Component definitions |

## Generated Patterns

### Main Application

```go
package main

import (
    "fmt"
    "os"

    tea "github.com/charmbracelet/bubbletea"
)

func main() {
    p := tea.NewProgram(initialModel(), tea.WithAltScreen())
    if _, err := p.Run(); err != nil {
        fmt.Printf("Error: %v", err)
        os.Exit(1)
    }
}
```

### Model Definition

```go
package main

import (
    "github.com/charmbracelet/bubbles/list"
    "github.com/charmbracelet/bubbles/textinput"
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
)

type model struct {
    list       list.Model
    textInput  textinput.Model
    err        error
    quitting   bool
}

func initialModel() model {
    ti := textinput.New()
    ti.Placeholder = "Enter search term..."
    ti.Focus()

    items := []list.Item{
        item{title: "Option 1", desc: "First option"},
        item{title: "Option 2", desc: "Second option"},
    }

    l := list.New(items, list.NewDefaultDelegate(), 0, 0)
    l.Title = "Select an option"

    return model{
        textInput: ti,
        list:      l,
    }
}

func (m model) Init() tea.Cmd {
    return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "ctrl+c", "q":
            m.quitting = true
            return m, tea.Quit
        case "enter":
            // Handle selection
            return m, nil
        }
    case tea.WindowSizeMsg:
        m.list.SetSize(msg.Width, msg.Height-4)
    }

    var cmd tea.Cmd
    m.list, cmd = m.list.Update(msg)
    return m, cmd
}

func (m model) View() string {
    if m.quitting {
        return "Goodbye!\n"
    }

    return lipgloss.JoinVertical(
        lipgloss.Left,
        m.textInput.View(),
        m.list.View(),
    )
}
```

### List Item

```go
package main

type item struct {
    title string
    desc  string
}

func (i item) Title() string       { return i.title }
func (i item) Description() string { return i.desc }
func (i item) FilterValue() string { return i.title }
```

### Styles

```go
package main

import "github.com/charmbracelet/lipgloss"

var (
    titleStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("205")).
        MarginBottom(1)

    selectedStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("170")).
        Bold(true)

    normalStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("252"))

    helpStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("241"))
)
```

## Dependencies

```go
require (
    github.com/charmbracelet/bubbletea v0.25.0
    github.com/charmbracelet/bubbles v0.17.0
    github.com/charmbracelet/lipgloss v0.9.0
)
```

## Target Processes

- tui-application-framework
- dashboard-monitoring-tui
- interactive-form-implementation
