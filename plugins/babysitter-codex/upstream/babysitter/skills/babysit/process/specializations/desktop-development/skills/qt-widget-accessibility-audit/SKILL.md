---
name: qt-widget-accessibility-audit
description: Audit Qt Widget applications for accessibility compliance using QAccessible interface and platform accessibility APIs
allowed-tools: Read, Grep, Glob, Bash
tags: [qt, accessibility, wcag, a11y, audit]
---

# qt-widget-accessibility-audit

Audit Qt Widget and Qt Quick applications for accessibility compliance. This skill checks QAccessible interface implementations, keyboard navigation, screen reader compatibility, and WCAG guidelines adherence.

## Capabilities

- Audit QAccessible interface implementations
- Check keyboard navigation and focus handling
- Verify screen reader compatibility
- Validate high contrast and color accessibility
- Check text scaling support
- Review accessible names and descriptions
- Test with platform accessibility tools
- Generate accessibility compliance reports

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Qt project"
    },
    "auditLevel": {
      "enum": ["basic", "wcag-a", "wcag-aa", "wcag-aaa"],
      "default": "wcag-aa"
    },
    "targetPlatform": {
      "enum": ["windows", "macos", "linux"],
      "description": "Platform to focus accessibility checks"
    },
    "checkCategories": {
      "type": "array",
      "items": {
        "enum": ["keyboard", "screen-reader", "visual", "focus", "labels", "navigation"]
      },
      "default": ["keyboard", "screen-reader", "visual", "focus", "labels"]
    },
    "includeQml": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "complianceLevel": {
      "enum": ["none", "wcag-a", "wcag-aa", "wcag-aaa"]
    },
    "score": {
      "type": "number",
      "description": "Accessibility score 0-100"
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "severity": { "enum": ["critical", "major", "minor"] },
          "category": { "type": "string" },
          "wcagCriteria": { "type": "string" },
          "description": { "type": "string" },
          "file": { "type": "string" },
          "widget": { "type": "string" },
          "recommendation": { "type": "string" }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success", "issues"]
}
```

## Accessibility Checks

### QAccessible Interface

```cpp
// Check: Widget has accessible name
bool hasAccessibleName(QWidget* widget) {
    return !widget->accessibleName().isEmpty() ||
           !widget->accessibleDescription().isEmpty();
}

// Check: Custom widget implements QAccessibleInterface
class CustomWidget : public QWidget {
    // Must implement for screen readers
    QAccessibleInterface* accessibleInterface() {
        return QAccessible::queryAccessibleInterface(this);
    }
};
```

### Keyboard Navigation

```cpp
// Check: All interactive widgets are focusable
void auditFocusPolicy(QWidget* widget) {
    if (isInteractive(widget)) {
        if (widget->focusPolicy() == Qt::NoFocus) {
            reportIssue("Interactive widget not focusable", widget);
        }
    }
}

// Check: Tab order is logical
void auditTabOrder(QWidget* container) {
    QList<QWidget*> tabOrder = getTabOrder(container);
    // Verify left-to-right, top-to-bottom order
}
```

### Visual Accessibility

```cpp
// Check: Sufficient color contrast
bool hasAdequateContrast(QColor foreground, QColor background) {
    double ratio = calculateContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA for normal text
}

// Check: Text is scalable
void auditFontScaling(QWidget* widget) {
    QFont font = widget->font();
    if (font.pixelSize() > 0) {
        reportIssue("Use point size instead of pixel size", widget);
    }
}
```

## Common Issues

### Missing Accessible Names

```cpp
// BAD: No accessible name
QPushButton* btn = new QPushButton(QIcon(":/save.png"), "");

// GOOD: Has accessible name
QPushButton* btn = new QPushButton(QIcon(":/save.png"), "");
btn->setAccessibleName(tr("Save"));
btn->setAccessibleDescription(tr("Save the current document"));
```

### Non-Focusable Controls

```cpp
// BAD: Custom control not focusable
CustomControl* ctrl = new CustomControl();
ctrl->setFocusPolicy(Qt::NoFocus);

// GOOD: Focusable with keyboard support
CustomControl* ctrl = new CustomControl();
ctrl->setFocusPolicy(Qt::StrongFocus);
```

### Insufficient Contrast

```cpp
// BAD: Low contrast text
label->setStyleSheet("color: #888888; background: white;");

// GOOD: WCAG AA compliant contrast
label->setStyleSheet("color: #595959; background: white;");
```

## QML Accessibility

```qml
// Accessible QML component
Button {
    text: qsTr("Submit")

    Accessible.name: qsTr("Submit form")
    Accessible.description: qsTr("Submit the registration form")
    Accessible.role: Accessible.Button

    // Keyboard handling
    Keys.onReturnPressed: clicked()
    Keys.onEnterPressed: clicked()
}

// Accessible image
Image {
    source: "chart.png"

    Accessible.name: qsTr("Sales chart for Q4 2024")
    Accessible.role: Accessible.Graphic
}

// Focus indicator
Rectangle {
    border.color: parent.activeFocus ? "blue" : "transparent"
    border.width: 2
}
```

## Platform Tools Integration

### Windows (UI Automation)

```cpp
// Verify with Windows Narrator
// Use Accessibility Insights tool
void testWithUIAutomation() {
    // Check UI Automation tree
    // Verify all controls have automation IDs
}
```

### macOS (VoiceOver)

```cpp
// Verify with VoiceOver
// Check NSAccessibility compliance
void testWithVoiceOver() {
    // Check accessibility hierarchy
    // Verify labels are announced correctly
}
```

### Linux (Orca/AT-SPI)

```cpp
// Verify with Orca screen reader
// Use Accerciser for AT-SPI inspection
void testWithATSPI() {
    // Check AT-SPI tree
    // Verify accessible events
}
```

## WCAG Guidelines Mapping

| WCAG Criterion | Qt Implementation |
|----------------|-------------------|
| 1.1.1 Non-text Content | setAccessibleName() for images/icons |
| 1.4.3 Contrast | QPalette with sufficient contrast |
| 2.1.1 Keyboard | setFocusPolicy(), key handlers |
| 2.4.3 Focus Order | setTabOrder() |
| 2.4.7 Focus Visible | Focus indicators in stylesheet |
| 4.1.2 Name, Role, Value | QAccessible interface |

## Best Practices

1. **Set accessible names**: All interactive widgets need names
2. **Use semantic roles**: Proper QAccessible::Role
3. **Support keyboard**: All features accessible via keyboard
4. **Visible focus**: Clear focus indicators
5. **Color independence**: Don't rely on color alone
6. **Scalable text**: Use point sizes, support scaling

## Related Skills

- `accessibility-test-runner` - Automated testing
- `qt-qml-component-generator` - Accessible components
- `desktop-accessibility` process - Full workflow

## Related Agents

- `accessibility-compliance-auditor` - Compliance expertise
- `qt-cpp-specialist` - Qt implementation guidance
