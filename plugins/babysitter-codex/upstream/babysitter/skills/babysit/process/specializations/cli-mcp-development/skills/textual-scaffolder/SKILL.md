---
name: textual-scaffolder
description: Generate Textual (Python) TUI application structure with widgets, screens, and CSS styling.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Textual Scaffolder

Generate Textual TUI applications with Python and modern async patterns.

## Capabilities

- Generate Textual project structure
- Create custom widgets and screens
- Set up CSS-based styling
- Implement reactive attributes
- Create component composition
- Set up testing with textual.testing

## Usage

Invoke this skill when you need to:
- Build terminal UIs in Python
- Create interactive CLI with CSS styling
- Implement multi-screen TUI applications
- Set up Textual project structure

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Project name |
| screens | array | No | Screen definitions |
| widgets | array | No | Custom widget definitions |

## Generated Patterns

### Main Application

```python
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Static, Button, Input
from textual.containers import Container, Horizontal, Vertical
from textual.screen import Screen

class MainScreen(Screen):
    """Main application screen."""

    CSS = """
    MainScreen {
        layout: grid;
        grid-size: 2;
        grid-gutter: 1;
    }

    #sidebar {
        width: 30;
        background: $surface;
        border: solid $primary;
    }

    #content {
        background: $surface;
        border: solid $secondary;
    }
    """

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static("Sidebar", id="sidebar"),
            Static("Content", id="content"),
        )
        yield Footer()


class MyApp(App):
    """Main TUI application."""

    BINDINGS = [
        ("q", "quit", "Quit"),
        ("d", "toggle_dark", "Toggle dark mode"),
    ]

    CSS_PATH = "styles.tcss"

    def on_mount(self) -> None:
        self.push_screen(MainScreen())

    def action_toggle_dark(self) -> None:
        self.dark = not self.dark


if __name__ == "__main__":
    app = MyApp()
    app.run()
```

### Custom Widget

```python
from textual.widget import Widget
from textual.reactive import reactive
from textual.message import Message

class Counter(Widget):
    """A counter widget with increment/decrement."""

    value = reactive(0)

    class Changed(Message):
        """Counter value changed."""
        def __init__(self, value: int) -> None:
            self.value = value
            super().__init__()

    def render(self) -> str:
        return f"Count: {self.value}"

    def increment(self) -> None:
        self.value += 1
        self.post_message(self.Changed(self.value))

    def decrement(self) -> None:
        self.value -= 1
        self.post_message(self.Changed(self.value))
```

### CSS Styles (styles.tcss)

```css
Screen {
    background: $surface;
}

Header {
    dock: top;
    background: $primary;
}

Footer {
    dock: bottom;
    background: $primary;
}

Button {
    margin: 1;
}

Button:hover {
    background: $primary-lighten-1;
}

Input {
    margin: 1;
    border: tall $secondary;
}

Input:focus {
    border: tall $primary;
}

.error {
    color: $error;
}

.success {
    color: $success;
}
```

### Data Table Widget

```python
from textual.widgets import DataTable
from textual.app import ComposeResult

class DataScreen(Screen):
    def compose(self) -> ComposeResult:
        yield DataTable()

    def on_mount(self) -> None:
        table = self.query_one(DataTable)
        table.add_columns("Name", "Email", "Role")
        table.add_rows([
            ("Alice", "alice@example.com", "Admin"),
            ("Bob", "bob@example.com", "User"),
            ("Charlie", "charlie@example.com", "User"),
        ])
```

## Dependencies

```toml
[project]
dependencies = [
    "textual>=0.40.0",
]

[project.optional-dependencies]
dev = [
    "textual-dev>=1.0.0",
]
```

## Target Processes

- tui-application-framework
- interactive-form-implementation
- dashboard-monitoring-tui
