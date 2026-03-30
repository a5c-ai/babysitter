---
name: unity-ui-toolkit
description: Unity UI Toolkit skill for runtime UI development, USS styling, UXML templates, and custom visual elements.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity UI Toolkit Skill

UI Toolkit development for Unity runtime and editor interfaces.

## Overview

This skill provides capabilities for building user interfaces using Unity's UI Toolkit, including UXML templates, USS styling, and custom visual elements.

## Capabilities

### UXML Templates
- Create UXML document structure
- Define reusable templates
- Implement data binding
- Handle template inheritance

### USS Styling
- Write USS stylesheets
- Implement responsive layouts
- Create theme variants
- Handle hover/focus states

### Visual Elements
- Build custom visual elements
- Implement manipulators
- Handle input events
- Create animations

### Data Binding
- Bind to data sources
- Implement MVVM patterns
- Handle list views and collections
- Create reactive UI

## Prerequisites

- Unity 2021.3+
- UI Toolkit package (built-in)

## Usage Patterns

### UXML Template

```xml
<ui:UXML xmlns:ui="UnityEngine.UIElements">
    <ui:VisualElement class="container">
        <ui:Label name="health-label" text="Health: 100" />
        <ui:ProgressBar name="health-bar" value="100" />
        <ui:Button name="heal-button" text="Heal" />
    </ui:VisualElement>
</ui:UXML>
```

### USS Stylesheet

```css
.container {
    flex-direction: column;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.8);
}

#health-bar {
    height: 20px;
    margin: 5px 0;
}

#heal-button:hover {
    background-color: #4CAF50;
}
```

### C# Binding

```csharp
public class HealthUI : MonoBehaviour
{
    [SerializeField] private UIDocument uiDocument;
    private ProgressBar healthBar;

    void Start()
    {
        var root = uiDocument.rootVisualElement;
        healthBar = root.Q<ProgressBar>("health-bar");
        root.Q<Button>("heal-button").clicked += OnHealClicked;
    }

    void OnHealClicked() { /* Handle heal */ }
}
```

## Best Practices

1. Use USS for styling over inline styles
2. Create reusable UXML templates
3. Implement proper event handling
4. Test across resolutions
5. Use UI Builder for visual editing

## References

- [UI Toolkit Documentation](https://docs.unity3d.com/Manual/UIElements.html)
