---
name: Fastlane/Mobile CI-CD
description: Automated mobile build, test, and deployment with Fastlane
version: 1.0.0
category: Mobile DevOps
slug: fastlane-cicd
status: active
---

# Fastlane/Mobile CI-CD Skill

## Overview

This skill provides comprehensive capabilities for mobile CI/CD automation using Fastlane. It enables automated builds, testing, code signing, beta distribution, and app store deployments for both iOS and Android platforms.

## Allowed Tools

- `bash` - Execute Fastlane commands, Ruby, and bundler
- `read` - Analyze Fastfile, Appfile, and configuration files
- `write` - Generate Fastlane configurations and lanes
- `edit` - Update existing Fastlane configurations
- `glob` - Search for Fastlane and CI configuration files
- `grep` - Search for patterns in CI/CD configurations

## Capabilities

### Fastlane Configuration

1. **Fastfile Setup**
   - Create platform-specific lanes
   - Configure before_all and after_all hooks
   - Implement error handling with error blocks
   - Set up environment variables
   - Configure lane options and parameters

2. **Appfile Configuration**
   - Configure app identifiers
   - Set up Apple ID and team settings
   - Configure Google Play credentials
   - Set environment-specific values

### iOS Code Signing

3. **Match (Code Signing)**
   - Configure Git-based certificate storage
   - Set up development, adhoc, and appstore profiles
   - Implement automatic certificate renewal
   - Handle multiple team configurations
   - Configure readonly mode for CI

4. **Manual Code Signing**
   - Import certificates with cert action
   - Generate provisioning profiles with sigh
   - Configure entitlements
   - Handle enterprise distribution

### Build Automation

5. **iOS Builds**
   - Configure gym for archive creation
   - Set up build configurations
   - Handle bitcode settings
   - Configure export options
   - Implement build number automation

6. **Android Builds**
   - Configure gradle action
   - Build APK and AAB files
   - Handle signing configurations
   - Configure build variants
   - Implement version code automation

### Testing

7. **Test Automation**
   - Run scan for iOS testing
   - Configure test schemes and destinations
   - Handle test parallelization
   - Generate test reports
   - Implement retry logic

8. **Android Testing**
   - Run gradle test tasks
   - Configure instrumented tests
   - Integrate with Firebase Test Lab
   - Generate coverage reports

### Beta Distribution

9. **TestFlight**
   - Configure pilot for TestFlight uploads
   - Manage test groups
   - Handle changelog updates
   - Configure external testing
   - Implement waiting for processing

10. **Firebase App Distribution**
    - Configure firebase_app_distribution
    - Manage tester groups
    - Handle release notes
    - Configure Android and iOS distribution

### App Store Deployment

11. **App Store Connect**
    - Configure deliver for metadata
    - Upload screenshots with snapshot
    - Submit for review
    - Handle phased releases
    - Manage app versions

12. **Google Play Store**
    - Configure supply for Play Store
    - Manage release tracks
    - Upload AAB files
    - Handle staged rollouts
    - Configure in-app updates

### CI Integration

13. **GitHub Actions**
    - Configure workflow files
    - Set up secrets management
    - Implement caching strategies
    - Configure matrix builds
    - Handle artifacts

14. **Other CI Platforms**
    - Bitrise integration
    - CircleCI configuration
    - Jenkins pipeline setup
    - Azure DevOps integration

## Target Processes

This skill integrates with the following processes:

- `mobile-cicd-fastlane.js` - CI/CD pipeline setup
- `automated-release-management.js` - Release automation
- `ios-appstore-submission.js` - iOS deployment
- `android-playstore-publishing.js` - Android deployment
- `beta-testing-setup.js` - Beta distribution

## Dependencies

### Required

- Ruby 3.0+
- Bundler
- Fastlane
- Xcode (for iOS)
- Android SDK (for Android)

### Optional

- Firebase CLI
- GitHub CLI
- AWS CLI (for S3 storage)

## Configuration

### Project Structure

```
project-root/
├── fastlane/
│   ├── Fastfile
│   ├── Appfile
│   ├── Matchfile
│   ├── Pluginfile
│   ├── Gymfile
│   ├── Scanfile
│   ├── Deliverfile
│   ├── metadata/
│   │   ├── en-US/
│   │   │   ├── description.txt
│   │   │   ├── keywords.txt
│   │   │   └── release_notes.txt
│   │   └── review_information/
│   └── screenshots/
├── Gemfile
└── Gemfile.lock
```

### Gemfile

```ruby
# Gemfile
source "https://rubygems.org"

gem "fastlane"
gem "cocoapods" # For iOS

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
```

## Usage Examples

### Basic Fastfile

```ruby
# fastlane/Fastfile
default_platform(:ios)

before_all do
  ensure_git_status_clean
  git_pull
end

platform :ios do
  desc "Run tests"
  lane :test do
    scan(
      scheme: "MyApp",
      devices: ["iPhone 15 Pro"],
      code_coverage: true,
      output_directory: "./fastlane/test_output"
    )
  end

  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "MyApp.xcodeproj")
    match(type: "appstore", readonly: true)
    gym(
      scheme: "MyApp",
      export_method: "app-store",
      output_directory: "./build"
    )
    pilot(
      skip_waiting_for_build_processing: true,
      changelog: "Bug fixes and improvements"
    )
    commit_version_bump(
      message: "Bump build number [skip ci]",
      xcodeproj: "MyApp.xcodeproj"
    )
    push_to_git_remote
  end

  desc "Deploy to App Store"
  lane :release do
    capture_screenshots
    increment_version_number(bump_type: "patch")
    increment_build_number
    match(type: "appstore", readonly: true)
    gym(scheme: "MyApp", export_method: "app-store")
    deliver(
      submit_for_review: true,
      automatic_release: false,
      force: true,
      precheck_include_in_app_purchases: false
    )
  end

  error do |lane, exception|
    slack(
      message: "Lane #{lane} failed: #{exception.message}",
      success: false
    )
  end
end

platform :android do
  desc "Run tests"
  lane :test do
    gradle(task: "testDebugUnitTest")
  end

  desc "Build and upload to Firebase App Distribution"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    firebase_app_distribution(
      app: ENV["FIREBASE_APP_ID"],
      groups: "internal-testers",
      release_notes: "Bug fixes and improvements"
    )
  end

  desc "Deploy to Play Store"
  lane :release do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    supply(
      track: "production",
      aab: "./app/build/outputs/bundle/release/app-release.aab",
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end
```

### Matchfile

```ruby
# fastlane/Matchfile
git_url("git@github.com:organization/certificates.git")
storage_mode("git")

type("appstore")

app_identifier(["com.example.myapp", "com.example.myapp.widget"])
username("developer@example.com")

# For CI environments
readonly(is_ci)

# Platform
platform("ios")
```

### Appfile

```ruby
# fastlane/Appfile
# iOS
app_identifier("com.example.myapp")
apple_id("developer@example.com")
team_id("XXXXXXXXXX")
itc_team_id("XXXXXXXXXX")

# Android
json_key_file("./fastlane/play-store-key.json")
package_name("com.example.myapp")

# Environment-specific
for_platform :ios do
  for_lane :beta do
    app_identifier("com.example.myapp.beta")
  end
end
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ios-deploy.yml
name: iOS Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Install dependencies
        run: bundle install

      - name: Set up certificates
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_AUTH }}
        run: bundle exec fastlane match appstore --readonly

      - name: Build and deploy
        env:
          APP_STORE_CONNECT_API_KEY_ID: ${{ secrets.ASC_KEY_ID }}
          APP_STORE_CONNECT_API_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY: ${{ secrets.ASC_KEY }}
        run: |
          if [[ $GITHUB_REF == refs/tags/* ]]; then
            bundle exec fastlane ios release
          else
            bundle exec fastlane ios beta
          fi

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            ./build/*.ipa
            ./fastlane/test_output/
```

### Android GitHub Actions

```yaml
# .github/workflows/android-deploy.yml
name: Android Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > app/release.keystore

      - name: Create key.properties
        run: |
          echo "storeFile=release.keystore" >> android/key.properties
          echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" >> android/key.properties
          echo "keyAlias=${{ secrets.KEY_ALIAS }}" >> android/key.properties
          echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> android/key.properties

      - name: Create Play Store key
        run: echo '${{ secrets.PLAY_STORE_KEY }}' > fastlane/play-store-key.json

      - name: Build and deploy
        run: |
          if [[ $GITHUB_REF == refs/tags/* ]]; then
            bundle exec fastlane android release
          else
            bundle exec fastlane android beta
          fi
```

## Quality Gates

### Build Verification

- All tests pass before deployment
- Code coverage meets threshold
- No compiler warnings
- Static analysis passes

### Release Criteria

- Version number incremented
- Changelog updated
- Screenshots current
- Metadata complete

### Security

- Certificates stored securely
- Secrets not in repository
- API keys rotated regularly

## Related Skills

- `app-store-connect` - App Store management
- `google-play-console` - Play Store management
- `mobile-testing` - Test automation

## Version History

- 1.0.0 - Initial release with Fastlane 2.x support
