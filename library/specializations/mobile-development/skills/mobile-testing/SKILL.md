---
name: Mobile Testing Frameworks
description: Comprehensive mobile testing framework expertise
version: 1.0.0
category: Quality Assurance
slug: mobile-testing
status: active
---

# Mobile Testing Frameworks Skill

## Overview

This skill provides comprehensive expertise in mobile testing frameworks across platforms. It enables E2E testing with Detox and Maestro, native testing with XCUITest and Espresso, and cross-platform testing with Appium.

## Allowed Tools

- `bash` - Execute test commands and framework CLIs
- `read` - Analyze test files and configurations
- `write` - Generate test cases and configurations
- `edit` - Update existing tests
- `glob` - Search for test files
- `grep` - Search for patterns in test code

## Capabilities

### Detox (React Native)

1. **Configuration**
   - Set up Detox configurations
   - Configure iOS and Android builds
   - Set up device/simulator targets
   - Configure test runners (Jest)

2. **Test Writing**
   - Write element matchers
   - Implement actions (tap, type, scroll)
   - Configure expectations
   - Handle synchronization

3. **Advanced Features**
   - Mock native modules
   - Handle permissions
   - Configure network mocking
   - Implement visual regression

### Maestro

4. **Flow Configuration**
   - Write YAML test flows
   - Configure app launch
   - Set up device targets
   - Handle environment variables

5. **Actions and Assertions**
   - Tap, type, swipe gestures
   - Assert element visibility
   - Take screenshots
   - Run JavaScript assertions

### XCUITest (iOS)

6. **Test Setup**
   - Configure test schemes
   - Set up test plans
   - Configure device targets
   - Handle launch arguments

7. **UI Testing**
   - Element queries with XCUIElement
   - Actions (tap, swipe, pinch)
   - Accessibility identifier usage
   - Keyboard handling

### Espresso (Android)

8. **Test Configuration**
   - Set up instrumentation tests
   - Configure test runner
   - Handle Hilt injection
   - Configure Compose testing

9. **UI Testing**
   - ViewMatchers and ViewActions
   - Compose semantics testing
   - IdlingResources for async
   - Intent verification

### Appium

10. **Cross-Platform Testing**
    - Configure capabilities
    - Set up driver sessions
    - Handle multiple platforms
    - Configure cloud testing

### Device Farms

11. **Cloud Testing**
    - AWS Device Farm integration
    - Firebase Test Lab setup
    - BrowserStack configuration
    - Test distribution

## Target Processes

This skill integrates with the following processes:

- `mobile-testing-strategy.js` - Testing strategy implementation
- `mobile-accessibility-implementation.js` - Accessibility testing
- `mobile-security-implementation.js` - Security testing

## Dependencies

### Required

- Node.js (for Detox, Maestro)
- Xcode (for XCUITest)
- Android Studio (for Espresso)
- Platform-specific SDKs

### Optional

- Appium
- Device farm accounts
- CI/CD platform

## Configuration

### Detox Configuration

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15 Pro' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
```

## Usage Examples

### Detox Test

```typescript
// e2e/login.test.ts
import { device, element, by, expect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on first launch', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await expect(element(by.id('error-message'))).toBeVisible();
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });

  it('should navigate to home on successful login', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('welcome-message'))).toBeVisible();
  });

  it('should handle scroll in long list', async () => {
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Scroll to bottom of list
    await element(by.id('item-list')).scrollTo('bottom');
    await expect(element(by.id('item-50'))).toBeVisible();

    // Scroll back to top
    await element(by.id('item-list')).scrollTo('top');
    await expect(element(by.id('item-1'))).toBeVisible();
  });
});
```

### Maestro Flow

```yaml
# flows/login.yaml
appId: com.example.myapp
---
- launchApp:
    clearState: true

- assertVisible: "Welcome"

- tapOn: "Email"
- inputText: "test@example.com"

- tapOn: "Password"
- inputText: "password123"

- tapOn: "Sign In"

- assertVisible: "Home"
- takeScreenshot: "home_after_login"

# Test logout flow
- tapOn: "Profile"
- tapOn: "Sign Out"
- assertVisible: "Welcome"
```

### XCUITest

```swift
// MyAppUITests/LoginTests.swift
import XCTest

final class LoginTests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    func testLoginScreenElements() throws {
        XCTAssertTrue(app.textFields["email-input"].exists)
        XCTAssertTrue(app.secureTextFields["password-input"].exists)
        XCTAssertTrue(app.buttons["login-button"].exists)
    }

    func testSuccessfulLogin() throws {
        let emailField = app.textFields["email-input"]
        let passwordField = app.secureTextFields["password-input"]
        let loginButton = app.buttons["login-button"]

        emailField.tap()
        emailField.typeText("test@example.com")

        passwordField.tap()
        passwordField.typeText("password123")

        loginButton.tap()

        // Wait for home screen
        let homeScreen = app.otherElements["home-screen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 5))
    }

    func testInvalidCredentials() throws {
        app.textFields["email-input"].tap()
        app.textFields["email-input"].typeText("invalid@example.com")

        app.secureTextFields["password-input"].tap()
        app.secureTextFields["password-input"].typeText("wrong")

        app.buttons["login-button"].tap()

        XCTAssertTrue(app.staticTexts["Invalid credentials"].waitForExistence(timeout: 3))
    }

    func testScrollBehavior() throws {
        // Navigate to list screen
        app.buttons["list-tab"].tap()

        let list = app.tables["item-list"]
        let lastItem = app.cells["item-cell-50"]

        // Scroll down
        while !lastItem.isHittable {
            list.swipeUp()
        }

        XCTAssertTrue(lastItem.exists)

        // Scroll back up
        let firstItem = app.cells["item-cell-1"]
        while !firstItem.isHittable {
            list.swipeDown()
        }

        XCTAssertTrue(firstItem.exists)
    }
}
```

### Espresso Test

```kotlin
// app/src/androidTest/java/com/example/myapp/LoginTest.kt
package com.example.myapp

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class LoginTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @Test
    fun loginScreen_displaysAllElements() {
        composeRule.onNodeWithTag("email-input").assertIsDisplayed()
        composeRule.onNodeWithTag("password-input").assertIsDisplayed()
        composeRule.onNodeWithTag("login-button").assertIsDisplayed()
    }

    @Test
    fun login_withValidCredentials_navigatesToHome() {
        composeRule.onNodeWithTag("email-input")
            .performTextInput("test@example.com")

        composeRule.onNodeWithTag("password-input")
            .performTextInput("password123")

        composeRule.onNodeWithTag("login-button")
            .performClick()

        composeRule.waitUntil(5000) {
            composeRule.onAllNodesWithTag("home-screen")
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeRule.onNodeWithTag("home-screen").assertIsDisplayed()
    }

    @Test
    fun login_withInvalidCredentials_showsError() {
        composeRule.onNodeWithTag("email-input")
            .performTextInput("invalid@example.com")

        composeRule.onNodeWithTag("password-input")
            .performTextInput("wrong")

        composeRule.onNodeWithTag("login-button")
            .performClick()

        composeRule.onNodeWithText("Invalid credentials")
            .assertIsDisplayed()
    }

    @Test
    fun list_scrollsBehavior() {
        // Login first
        composeRule.onNodeWithTag("email-input")
            .performTextInput("test@example.com")
        composeRule.onNodeWithTag("password-input")
            .performTextInput("password123")
        composeRule.onNodeWithTag("login-button")
            .performClick()

        composeRule.waitUntil(5000) {
            composeRule.onAllNodesWithTag("item-list")
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Scroll to item 50
        composeRule.onNodeWithTag("item-list")
            .performScrollToNode(hasTestTag("item-50"))

        composeRule.onNodeWithTag("item-50").assertIsDisplayed()
    }
}
```

### Firebase Test Lab

```yaml
# .github/workflows/android-test.yml
name: Android Tests

on: [push, pull_request]

jobs:
  instrumented-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build APKs
        run: |
          ./gradlew assembleDebug assembleDebugAndroidTest

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Run tests on Firebase Test Lab
        run: |
          gcloud firebase test android run \
            --type instrumentation \
            --app app/build/outputs/apk/debug/app-debug.apk \
            --test app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk \
            --device model=Pixel6,version=33 \
            --device model=Pixel7,version=34 \
            --timeout 15m \
            --results-bucket gs://my-test-results
```

## Quality Gates

### Test Coverage

- Unit test coverage > 80%
- Integration test coverage > 60%
- E2E critical path coverage 100%

### Test Reliability

- Flaky test rate < 2%
- Test execution time < 15 minutes
- Retry logic for network tests

### Accessibility Testing

- VoiceOver/TalkBack verification
- Color contrast validation
- Touch target size verification

## Related Skills

- `accessibility-testing` - Accessibility-focused testing
- `mobile-perf` - Performance testing
- `fastlane-cicd` - CI/CD integration

## Version History

- 1.0.0 - Initial release with major framework support
