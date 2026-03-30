---
name: xctest-ui-test-generator
description: Generate XCTest UI tests for macOS applications with accessibility identifiers and page object patterns
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [macos, xctest, uitesting, swift, testing]
---

# xctest-ui-test-generator

Generate XCTest UI tests for macOS applications. This skill creates UI test classes with accessibility identifiers, page object patterns, and proper test organization.

## Capabilities

- Generate XCUITest test classes
- Create page object pattern implementations
- Set up accessibility identifiers
- Generate test data factories
- Configure UI test schemes
- Create screenshot capture helpers
- Set up performance testing
- Generate test plans

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "targetViews": { "type": "array" },
    "usePageObjects": { "type": "boolean", "default": true },
    "generateAccessibilityIds": { "type": "boolean", "default": true }
  },
  "required": ["projectPath"]
}
```

## Generated Test Class

```swift
import XCTest

final class MainViewUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    func testMainViewLoads() throws {
        let mainView = app.windows["MainWindow"]
        XCTAssertTrue(mainView.waitForExistence(timeout: 5))

        let titleLabel = mainView.staticTexts["welcomeLabel"]
        XCTAssertTrue(titleLabel.exists)
        XCTAssertEqual(titleLabel.label, "Welcome")
    }

    func testNavigationToSettings() throws {
        app.menuItems["Preferences…"].click()
        let settingsWindow = app.windows["SettingsWindow"]
        XCTAssertTrue(settingsWindow.waitForExistence(timeout: 2))
    }
}
```

## Related Skills

- `swiftui-view-generator`
- `desktop-ui-testing` process
