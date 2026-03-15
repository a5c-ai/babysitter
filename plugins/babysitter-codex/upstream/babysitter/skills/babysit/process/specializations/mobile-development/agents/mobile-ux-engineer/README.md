# Mobile UX Engineer Agent

## Overview

The Mobile UX Engineer agent is an autonomous specialist focused on implementing exceptional mobile user experiences across iOS and Android platforms. It bridges the gap between design intent and technical implementation, ensuring consistent, accessible, and performant user interfaces.

## Purpose

Creating great mobile UX requires deep understanding of both design principles and platform capabilities. This agent automates UX implementation workflows, enabling:

- **Design System Development**: Implement and maintain design tokens and component libraries
- **Animation Implementation**: Integrate Lottie and native animations
- **Accessibility Compliance**: Ensure WCAG compliance and screen reader support
- **Cross-Platform Consistency**: Maintain visual and interaction consistency

## Capabilities

| Capability | Description |
|------------|-------------|
| Design Tokens | Parse and implement design tokens |
| Component Library | Build reusable UI components |
| Lottie Integration | Implement vector animations |
| Responsive Layout | Handle all device sizes |
| Accessibility | WCAG compliance implementation |
| Theme Support | Light/dark mode theming |

## Required Skills

This agent requires the following skills to function:

1. **lottie-animations**: Animation implementation capabilities
2. **accessibility-testing**: Accessibility validation and implementation

## Processes That Use This Agent

- **Mobile Animation Design** (`mobile-animation-design.js`)
- **Responsive Mobile Layout** (`responsive-mobile-layout.js`)
- **Mobile Accessibility Implementation** (`mobile-accessibility-implementation.js`)
- **Cross-Platform UI Library** (`cross-platform-ui-library.js`)

## Workflow

### Phase 1: Design Token Implementation

```
Input: Design tokens (Figma, JSON)
Output: Platform-specific token files

Steps:
1. Parse design token source
2. Generate color constants
3. Generate typography scales
4. Generate spacing values
5. Create theme configuration
```

### Phase 2: Component Development

```
Input: Design specifications
Output: Reusable UI components

Steps:
1. Identify component requirements
2. Create component structure
3. Implement variants and states
4. Add accessibility support
5. Write usage documentation
```

### Phase 3: Animation Integration

```
Input: Animation files (Lottie JSON)
Output: Integrated animation components

Steps:
1. Validate animation files
2. Create wrapper components
3. Configure playback controls
4. Optimize performance
5. Test across devices
```

### Phase 4: Accessibility Implementation

```
Input: UI components
Output: Accessible components

Steps:
1. Add accessibility labels
2. Configure focus order
3. Support dynamic type
4. Test with screen readers
5. Verify contrast ratios
```

## Input Specification

```json
{
  "task": "ux_implementation",
  "platform": "ios",
  "projectPath": "/path/to/project",
  "designSystem": {
    "tokensPath": "/tokens/design-tokens.json",
    "componentList": ["Button", "Card", "Input", "Loading"]
  },
  "features": [
    "dark_mode",
    "animations",
    "accessibility"
  ],
  "accessibilityLevel": "WCAG_AA"
}
```

## Output Specification

```json
{
  "success": true,
  "designSystem": {
    "tokens": {
      "colorsFile": "/Theme/Colors.swift",
      "typographyFile": "/Theme/Typography.swift"
    },
    "components": [
      {
        "name": "PrimaryButton",
        "path": "/Components/PrimaryButton.swift",
        "accessibilityReady": true
      }
    ]
  },
  "animations": {
    "integrated": ["loading", "success", "error"],
    "performance": { "fps": 60 }
  },
  "accessibility": {
    "level": "AA",
    "score": 95,
    "issues": []
  }
}
```

## Decision Logic

### Platform-Specific Patterns

| Pattern | iOS | Android |
|---------|-----|---------|
| Navigation | UINavigationController/NavigationStack | Navigation Component |
| Tabs | UITabBarController/TabView | BottomNavigation |
| Lists | UITableView/List | RecyclerView/LazyColumn |
| Buttons | UIButton/Button | MaterialButton/Button |
| Icons | SF Symbols | Material Icons |

### Animation Selection

| Use Case | Recommendation |
|----------|----------------|
| Simple state change | Native animation |
| Complex illustration | Lottie |
| Loading indicator | Lottie (looping) |
| Gesture-driven | Interactive animation |
| Scroll-based | Progress-controlled |

### Accessibility Priority

| Element | Priority | Requirements |
|---------|----------|--------------|
| Interactive | Critical | Label, hint, role |
| Informational | High | Label |
| Decorative | Low | Hidden from a11y |
| Dynamic | High | Live region |

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Animation jank | Too complex | Simplify or optimize |
| Layout breaking | Missing constraints | Add proper constraints |
| Accessibility fail | Missing labels | Add accessibility modifiers |
| Theme mismatch | Hardcoded colors | Use design tokens |

### Recovery Strategy

```
1. Identify visual/functional issue
2. Provide graceful fallback
3. Log issue for debugging
4. Maintain core functionality
5. Document for design team
```

## Integration

### With Other Agents

```
mobile-ux-engineer
    |
    +-- ios-native-expert (iOS implementation)
    +-- android-native-expert (Android implementation)
    +-- mobile-qa-expert (UI testing)
    +-- aso-expert (screenshot optimization)
```

### With Skills

```
mobile-ux-engineer
    |
    +-- lottie-animations (motion design)
    +-- accessibility-testing (a11y compliance)
```

## Usage Example

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'implement-design-system',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Implement mobile design system',
      agent: {
        name: 'mobile-ux-engineer',
        prompt: {
          role: 'Senior Mobile UX Engineer',
          task: 'Implement design system and components',
          context: {
            platform: 'ios',
            projectPath: '/path/to/project',
            tokensPath: '/design/tokens.json'
          },
          instructions: [
            'Parse design tokens from JSON',
            'Generate Swift color and typography constants',
            'Create reusable button component with variants',
            'Integrate loading animation from Lottie',
            'Add full accessibility support',
            'Implement dark mode theming',
            'Test on multiple device sizes',
            'Generate component documentation'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Best Practices

1. **Design Token First**: Always use tokens, never hardcode values
2. **Accessibility Built-In**: Add a11y from the start, not after
3. **Performance Aware**: Profile animations on low-end devices
4. **Platform Respect**: Honor platform conventions
5. **Test Visually**: Use snapshot testing for UI consistency
6. **Document Everything**: Enable team adoption of components

## Related Resources

- Skills: `lottie-animations/SKILL.md`, `accessibility-testing/SKILL.md`
- Processes: `mobile-animation-design.js`, `responsive-mobile-layout.js`
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [A11y Compliance Enforcer (Senaiverse)](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system)
- [mobile-ux-optimizer (ccplugins)](https://github.com/ccplugins/awesome-claude-code-plugins)
