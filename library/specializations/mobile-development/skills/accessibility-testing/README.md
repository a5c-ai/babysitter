# Accessibility Testing Skill

## Overview

The Accessibility Testing skill provides comprehensive accessibility validation capabilities for iOS and Android applications. It enables automated WCAG compliance checking, screen reader testing, color contrast analysis, and accessibility auditing to ensure mobile apps are usable by everyone.

## Purpose

Mobile accessibility is both a legal requirement and ethical imperative. This skill automates accessibility testing workflows, enabling:

- **WCAG Compliance**: Validate against WCAG 2.1/2.2 Level A, AA, and AAA
- **Screen Reader Testing**: Verify VoiceOver (iOS) and TalkBack (Android) compatibility
- **Visual Accessibility**: Check color contrast, dynamic type, and visual adaptations
- **Motor Accessibility**: Validate touch targets and gesture alternatives

## Use Cases

### 1. Pre-Release Accessibility Audit
Run comprehensive accessibility audit before app store submission.

### 2. Continuous Accessibility Testing
Integrate accessibility checks into CI/CD pipelines.

### 3. Screen Reader Optimization
Improve VoiceOver/TalkBack experience with proper labels and navigation.

### 4. Dynamic Type Validation
Ensure layouts adapt properly to user font size preferences.

### 5. Color Contrast Remediation
Identify and fix low-contrast text and UI elements.

## Processes That Use This Skill

- **Mobile Accessibility Implementation** (`mobile-accessibility-implementation.js`)
- **Mobile Testing Strategy** (`mobile-testing-strategy.js`)
- **Cross-Platform UI Library** (`cross-platform-ui-library.js`)

## Installation

### iOS Tools

```bash
# Xcode Command Line Tools (includes Accessibility Inspector)
xcode-select --install

# SwiftUI testing library
pod 'ViewInspector'
```

### Android Tools

```groovy
// build.gradle
dependencies {
    androidTestImplementation 'androidx.test.espresso:espresso-accessibility:3.5.1'
}
```

### Cross-Platform Tools

```bash
# Axe accessibility testing
npm install -g @axe-core/cli

# Color contrast checker
npm install -g color-contrast-checker
```

## Configuration

### Enabling Accessibility in CI/CD

```yaml
# GitHub Actions example
- name: Run Accessibility Tests
  run: |
    # iOS
    xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'

    # Android
    ./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.example.AccessibilityTest
```

### Espresso Accessibility Checks

```kotlin
// Enable in test setup
@Before
fun setUp() {
    AccessibilityChecks.enable()
        .setRunChecksFromRootView(true)
        .setSuppressingResultMatcher(
            // Suppress known issues if needed
            anyOf(
                matchesCheckNames(containsString("TouchTargetSizeCheck"))
            )
        )
}
```

## Capabilities

| Capability | iOS | Android | Description |
|------------|-----|---------|-------------|
| Screen Reader Testing | VoiceOver | TalkBack | Verify labels and navigation |
| Contrast Analysis | Yes | Yes | WCAG AA/AAA validation |
| Dynamic Type | Yes | Font Scaling | Text size adaptation |
| Touch Target Check | 44x44pt | 48x48dp | Minimum touch size |
| Focus Order | Yes | Yes | Logical navigation order |
| Live Regions | Yes | Yes | Dynamic content announcements |

## Example Workflows

### Running iOS Accessibility Inspector

```bash
# Open Accessibility Inspector (Xcode must be installed)
open -a "Accessibility Inspector"

# Run accessibility audit from command line
xcrun simctl io booted recordVideo --type=fcp accessibility_audit.mov
```

### Running Android Accessibility Scanner

```bash
# Install Accessibility Scanner from Play Store on emulator
adb shell am start -n com.google.android.apps.accessibility.auditor/.ui.MainActivity

# Or use Espresso tests with accessibility checks
./gradlew connectedAndroidTest
```

### Automated Contrast Checking

```javascript
// Node.js script for color contrast validation
const { getContrastRatio } = require('color-contrast-checker');

const colors = [
  { fg: '#333333', bg: '#FFFFFF', name: 'Body text' },
  { fg: '#666666', bg: '#F5F5F5', name: 'Secondary text' },
];

colors.forEach(({ fg, bg, name }) => {
  const ratio = getContrastRatio(fg, bg);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;

  console.log(`${name}: ${ratio.toFixed(2)}:1 - AA: ${passesAA ? 'PASS' : 'FAIL'}, AAA: ${passesAAA ? 'PASS' : 'FAIL'}`);
});
```

## Common Accessibility Patterns

### SwiftUI Accessibility

```swift
// Proper image accessibility
Image("product_photo")
    .accessibilityLabel("Red running shoes")
    .accessibilityAddTraits(.isImage)

// Hiding decorative elements
Image(systemName: "circle.fill")
    .accessibilityHidden(true)

// Grouping related elements
VStack {
    Text("Price")
    Text("$99.99")
}
.accessibilityElement(children: .combine)
.accessibilityLabel("Price: $99.99")
```

### Jetpack Compose Accessibility

```kotlin
// Proper button accessibility
IconButton(
    onClick = { /* action */ },
    modifier = Modifier.semantics {
        contentDescription = "Add to cart"
    }
) {
    Icon(Icons.Default.Add, contentDescription = null)
}

// Hiding decorative elements
Image(
    painter = painterResource(R.drawable.decoration),
    contentDescription = null,
    modifier = Modifier.semantics { invisibleToUser() }
)

// Announcing state changes
var count by remember { mutableStateOf(0) }
Text(
    text = "Items: $count",
    modifier = Modifier.semantics {
        liveRegion = LiveRegionMode.Polite
    }
)
```

## Integration with Other Skills

- **mobile-security**: Accessible secure input handling
- **lottie-animations**: Accessible animation controls
- **cross-platform-ui-library**: Reusable accessible components

## Troubleshooting

### Common Issues

1. **Missing Accessibility Labels**: Ensure all interactive elements have labels
2. **Incorrect Reading Order**: Check focus order matches visual layout
3. **Low Contrast Errors**: Use color contrast analyzer tools
4. **Touch Target Too Small**: Increase button/touch area sizes

### Debug Commands

```bash
# iOS - Enable accessibility shortcut
# Settings > Accessibility > Accessibility Shortcut > VoiceOver

# Android - Enable TalkBack
adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService

# Check app accessibility tree (iOS Simulator)
xcrun simctl accessibility booted dump
```

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple Accessibility Programming Guide](https://developer.apple.com/accessibility/)
- [Android Accessibility Developer Guide](https://developer.android.com/guide/topics/ui/accessibility)
- [Axiom iOS Accessibility](https://github.com/CharlesWiltgen/Axiom)
- [accessibility-tester (VoltAgent)](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/04-quality-security/accessibility-tester.md)
