---
name: accessibility-testing
description: Mobile accessibility testing skill for WCAG compliance, VoiceOver/TalkBack validation, dynamic type support, color contrast analysis, and accessibility auditing across iOS and Android platforms.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Accessibility Testing Skill

Comprehensive mobile accessibility testing and validation for iOS and Android platforms, ensuring WCAG 2.1/2.2 compliance and optimal screen reader compatibility.

## Overview

This skill provides capabilities for testing mobile application accessibility, including screen reader compatibility, dynamic type support, color contrast validation, and compliance with Web Content Accessibility Guidelines (WCAG) adapted for mobile platforms.

## Capabilities

### Screen Reader Testing
- Validate VoiceOver compatibility (iOS)
- Test TalkBack interaction (Android)
- Verify accessibility labels and hints
- Check reading order and focus navigation
- Test custom accessibility actions

### Dynamic Type Support
- Validate iOS Dynamic Type scaling
- Test Android font scaling preferences
- Check layout adaptation at extreme sizes
- Verify text truncation handling
- Test multiline text wrapping

### Color Contrast Analysis
- Measure contrast ratios (WCAG AA/AAA)
- Identify low-contrast text and UI elements
- Validate against light/dark mode themes
- Check color-blind accessibility
- Suggest compliant color alternatives

### Accessibility Audit
- Run iOS Accessibility Inspector audits
- Execute Android Accessibility Scanner
- Generate compliance reports
- Identify WCAG violations
- Prioritize remediation efforts

### Touch Target Validation
- Measure touch target sizes (minimum 44x44pt iOS, 48x48dp Android)
- Check spacing between interactive elements
- Validate gesture-based interactions
- Test single-tap alternatives for complex gestures

## Prerequisites

### iOS Development
```bash
# Accessibility testing tools
xcode-select --install

# UI testing with accessibility focus
pod 'ViewInspector'  # SwiftUI testing
```

### Android Development
```groovy
// build.gradle
dependencies {
    androidTestImplementation 'androidx.test.espresso:espresso-accessibility:3.5.1'
}
```

### Testing Tools
```bash
# Accessibility testing CLI tools
npm install -g @axe-core/cli
pip install accessibility-checker
```

## Usage Patterns

### iOS Accessibility Labels (SwiftUI)
```swift
import SwiftUI

struct AccessibleButton: View {
    var body: some View {
        Button(action: { /* action */ }) {
            Image(systemName: "heart.fill")
        }
        .accessibilityLabel("Add to favorites")
        .accessibilityHint("Double tap to add this item to your favorites list")
        .accessibilityAddTraits(.isButton)
    }
}

struct AccessibleList: View {
    var body: some View {
        List {
            ForEach(items) { item in
                ItemRow(item: item)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("\(item.title), \(item.subtitle)")
                    .accessibilityValue(item.isSelected ? "Selected" : "Not selected")
            }
        }
        .accessibilityIdentifier("items_list")
    }
}
```

### iOS Accessibility Labels (UIKit)
```swift
import UIKit

class AccessibleViewController: UIViewController {
    func configureAccessibility() {
        // Basic label
        button.accessibilityLabel = "Submit order"
        button.accessibilityHint = "Double tap to submit your order"

        // Grouped elements
        containerView.isAccessibilityElement = true
        containerView.accessibilityLabel = "Order summary: 3 items, total $45.99"

        // Custom actions
        cell.accessibilityCustomActions = [
            UIAccessibilityCustomAction(name: "Delete", target: self, selector: #selector(deleteItem)),
            UIAccessibilityCustomAction(name: "Edit", target: self, selector: #selector(editItem))
        ]
    }
}
```

### Android Accessibility (Jetpack Compose)
```kotlin
import androidx.compose.ui.semantics.*

@Composable
fun AccessibleButton() {
    IconButton(
        onClick = { /* action */ },
        modifier = Modifier.semantics {
            contentDescription = "Add to favorites"
            role = Role.Button
        }
    ) {
        Icon(Icons.Filled.Favorite, contentDescription = null)
    }
}

@Composable
fun AccessibleCard(item: Item) {
    Card(
        modifier = Modifier.semantics(mergeDescendants = true) {
            contentDescription = "${item.title}, ${item.subtitle}"
            stateDescription = if (item.isSelected) "Selected" else "Not selected"
        }
    ) {
        // Card content
    }
}
```

### Android Accessibility (XML Views)
```kotlin
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo

class AccessibleActivity : AppCompatActivity() {
    fun configureAccessibility() {
        // Basic content description
        imageButton.contentDescription = "Add to favorites"

        // Important for accessibility
        decorativeImage.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO

        // Live regions for dynamic content
        statusTextView.accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE

        // Custom accessibility delegate
        customView.accessibilityDelegate = object : View.AccessibilityDelegate() {
            override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfo) {
                super.onInitializeAccessibilityNodeInfo(host, info)
                info.addAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_CLICK)
                info.contentDescription = "Custom description"
            }
        }
    }
}
```

### Color Contrast Validation
```swift
// iOS - Check contrast ratio
import UIKit

func calculateContrastRatio(foreground: UIColor, background: UIColor) -> Double {
    let fgLuminance = relativeLuminance(foreground)
    let bgLuminance = relativeLuminance(background)

    let lighter = max(fgLuminance, bgLuminance)
    let darker = min(fgLuminance, bgLuminance)

    return (lighter + 0.05) / (darker + 0.05)
}

func relativeLuminance(_ color: UIColor) -> Double {
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0
    color.getRed(&r, green: &g, blue: &b, alpha: nil)

    let transform: (CGFloat) -> Double = { value in
        let v = Double(value)
        return v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4)
    }

    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b)
}

// Usage
let ratio = calculateContrastRatio(foreground: .label, background: .systemBackground)
let meetsWCAGAA = ratio >= 4.5  // Normal text
let meetsWCAGAAA = ratio >= 7.0 // Enhanced
```

### Accessibility Testing (XCTest)
```swift
import XCTest

class AccessibilityTests: XCTestCase {
    func testVoiceOverNavigation() {
        let app = XCUIApplication()
        app.launch()

        // Verify accessibility elements exist
        XCTAssertTrue(app.buttons["Submit order"].exists)
        XCTAssertTrue(app.staticTexts["Order total"].exists)

        // Check accessibility traits
        let submitButton = app.buttons["Submit order"]
        XCTAssertTrue(submitButton.isEnabled)

        // Navigate with VoiceOver gestures (simulated)
        let elements = app.descendants(matching: .any).allElementsBoundByAccessibilityElement
        XCTAssertGreaterThan(elements.count, 0)
    }

    func testDynamicTypeSupport() {
        let app = XCUIApplication()
        app.launchArguments = ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXL"]
        app.launch()

        // Verify layout doesn't break at large text sizes
        XCTAssertTrue(app.staticTexts["Title"].exists)
        XCTAssertFalse(app.staticTexts["Title"].frame.isEmpty)
    }
}
```

### Accessibility Testing (Espresso)
```kotlin
import androidx.test.espresso.accessibility.AccessibilityChecks
import org.junit.BeforeClass

class AccessibilityTest {
    companion object {
        @BeforeClass
        @JvmStatic
        fun enableAccessibilityChecks() {
            AccessibilityChecks.enable()
                .setRunChecksFromRootView(true)
        }
    }

    @Test
    fun testScreenAccessibility() {
        onView(withId(R.id.main_layout))
            .check(matches(isDisplayed()))

        // Automatic accessibility checks run on every view interaction
        onView(withId(R.id.submit_button))
            .perform(click())
    }
}
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const accessibilityTestTask = defineTask({
  name: 'accessibility-testing',
  description: 'Test mobile app accessibility compliance',

  inputs: {
    platform: { type: 'string', required: true, enum: ['ios', 'android', 'both'] },
    wcagLevel: { type: 'string', required: true, enum: ['A', 'AA', 'AAA'] },
    projectPath: { type: 'string', required: true },
    testScreens: { type: 'array', items: { type: 'string' } }
  },

  outputs: {
    complianceReport: { type: 'object' },
    violations: { type: 'array' },
    recommendations: { type: 'array' },
    score: { type: 'number' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Test ${inputs.wcagLevel} accessibility for ${inputs.platform}`,
      skill: {
        name: 'accessibility-testing',
        context: {
          operation: 'audit',
          platform: inputs.platform,
          wcagLevel: inputs.wcagLevel,
          projectPath: inputs.projectPath,
          screens: inputs.testScreens
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

## MCP Server Integration

### Using Axiom Accessibility (iOS)
```json
{
  "mcpServers": {
    "axiom": {
      "command": "npx",
      "args": ["axiom-mcp"],
      "env": {
        "XCODE_PROJECT": "/path/to/project.xcodeproj"
      }
    }
  }
}
```

### Available MCP Tools
- `a11y_audit_ios` - Run iOS Accessibility Inspector audit
- `a11y_audit_android` - Run Android Accessibility Scanner
- `check_contrast_ratio` - Validate color contrast
- `validate_touch_targets` - Check touch target sizes
- `test_screen_reader` - Simulate screen reader navigation
- `generate_a11y_report` - Create compliance report

## WCAG 2.1 Mobile Checklist

### Perceivable
- [ ] Text alternatives for non-text content (1.1.1)
- [ ] Captions for audio content (1.2.2)
- [ ] Color not sole means of conveying info (1.4.1)
- [ ] Contrast ratio >= 4.5:1 for normal text (1.4.3)
- [ ] Text resizable up to 200% (1.4.4)
- [ ] Reflow without horizontal scrolling (1.4.10)

### Operable
- [ ] Touch targets >= 44x44pt/48x48dp (2.5.5)
- [ ] Single pointer gestures available (2.5.1)
- [ ] Motion not required for operation (2.5.4)
- [ ] Orientation not locked (1.3.4)
- [ ] Focus visible for keyboard users (2.4.7)

### Understandable
- [ ] Language of page programmatically determined (3.1.1)
- [ ] Consistent navigation patterns (3.2.3)
- [ ] Error identification clear (3.3.1)
- [ ] Labels or instructions for user input (3.3.2)

### Robust
- [ ] Valid markup for assistive technologies (4.1.1)
- [ ] Name, role, value available (4.1.2)
- [ ] Status messages announced to screen readers (4.1.3)

## Best Practices

1. **Test with Real Users**: Include users with disabilities in testing
2. **Use Native Controls**: Leverage platform accessibility features
3. **Test at Extremes**: Check largest Dynamic Type and font scaling
4. **Verify Reading Order**: Ensure logical focus navigation
5. **Provide Text Alternatives**: Label all images and icons
6. **Support Multiple Input Methods**: Touch, voice, switch control

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility Programming Guide](https://developer.apple.com/accessibility/ios/)
- [Android Accessibility Guide](https://developer.android.com/guide/topics/ui/accessibility)
- [Axiom Accessibility Skills](https://github.com/CharlesWiltgen/Axiom)
- [A11y Compliance Enforcer](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system)
