---
name: App Store Connect
description: Apple App Store submission and management expertise
version: 1.0.0
category: iOS Distribution
slug: app-store-connect
status: active
---

# App Store Connect Skill

## Overview

This skill provides comprehensive capabilities for Apple App Store submission and management. It enables interaction with App Store Connect API, metadata management, TestFlight distribution, and app lifecycle management.

## Allowed Tools

- `bash` - Execute xcrun, altool, and Transporter commands
- `read` - Analyze app metadata and configuration files
- `write` - Generate metadata files and API configurations
- `edit` - Update app store metadata
- `glob` - Search for metadata and screenshot files
- `grep` - Search for patterns in configurations

## Capabilities

### App Store Connect API

1. **API Authentication**
   - Configure API keys and JWT tokens
   - Implement token refresh logic
   - Handle rate limiting
   - Configure team and issuer IDs

2. **App Management**
   - Create and manage app records
   - Configure app capabilities
   - Manage bundle IDs
   - Handle app transfers

### Build Management

3. **Build Upload**
   - Upload builds via Transporter
   - Configure altool uploads
   - Handle build processing status
   - Manage build metadata
   - Configure App Store connect upload

4. **Build Information**
   - Track build processing
   - Configure build usage compliance
   - Manage export compliance
   - Handle build expiration

### TestFlight

5. **Beta Distribution**
   - Configure internal testing groups
   - Manage external beta testers
   - Set up beta build distribution
   - Handle beta app review
   - Configure test information

6. **Beta Feedback**
   - Collect crash reports
   - Manage feedback submissions
   - Track tester engagement
   - Analyze beta metrics

### Metadata Management

7. **App Information**
   - Configure app name and subtitle
   - Set primary and secondary categories
   - Manage age ratings
   - Configure privacy policy URLs
   - Set support and marketing URLs

8. **Version Metadata**
   - Write descriptions and keywords
   - Manage what's new text
   - Configure promotional text
   - Handle copyright information

9. **Media Assets**
   - Upload app screenshots
   - Configure app previews
   - Manage app icons
   - Handle different device sizes

### In-App Purchases

10. **IAP Configuration**
    - Create consumable products
    - Configure subscriptions
    - Set up subscription groups
    - Handle promotional offers
    - Configure introductory pricing

### Submission

11. **Review Submission**
    - Submit for App Review
    - Handle review notes
    - Configure demo account
    - Manage review attachments
    - Track review status

12. **Release Management**
    - Configure release options
    - Set up phased releases
    - Handle manual releases
    - Manage version releases

## Target Processes

This skill integrates with the following processes:

- `ios-appstore-submission.js` - App Store submission
- `beta-testing-setup.js` - TestFlight configuration
- `app-store-optimization.js` - ASO metadata
- `automated-release-management.js` - Release automation

## Dependencies

### Required

- Apple Developer account
- App Store Connect access
- Xcode (for Transporter)
- Valid signing certificates

### Optional

- Fastlane
- App Store Connect API key
- Transporter app

## Configuration

### API Key Setup

```bash
# Generate API key in App Store Connect
# Users and Access > Keys > App Store Connect API

# Key file structure
AuthKey_XXXXXXXXXX.p8
```

### Environment Variables

```bash
# App Store Connect API
export APP_STORE_CONNECT_API_KEY_ID="XXXXXXXXXX"
export APP_STORE_CONNECT_API_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export APP_STORE_CONNECT_API_KEY_PATH="./AuthKey_XXXXXXXXXX.p8"

# Alternative: Base64 encoded key
export APP_STORE_CONNECT_API_KEY="$(cat AuthKey.p8 | base64)"
```

## Usage Examples

### Upload Build with xcrun

```bash
# Validate IPA
xcrun altool --validate-app \
  --file ./build/MyApp.ipa \
  --type ios \
  --apiKey XXXXXXXXXX \
  --apiIssuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Upload IPA
xcrun altool --upload-app \
  --file ./build/MyApp.ipa \
  --type ios \
  --apiKey XXXXXXXXXX \
  --apiIssuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Fastlane Deliver Configuration

```ruby
# fastlane/Deliverfile
app_identifier("com.example.myapp")
username("developer@example.com")

# Metadata
name({
  "en-US" => "My Awesome App",
  "es-ES" => "Mi Aplicacion Increible"
})

subtitle({
  "en-US" => "The best app ever",
  "es-ES" => "La mejor app del mundo"
})

# Keywords (comma-separated)
keywords({
  "en-US" => "productivity,tasks,notes,todo",
  "es-ES" => "productividad,tareas,notas"
})

# URLs
support_url("https://example.com/support")
marketing_url("https://example.com")
privacy_url("https://example.com/privacy")

# App Review Information
app_review_information(
  first_name: "John",
  last_name: "Doe",
  phone_number: "+1 555 555 5555",
  email_address: "review@example.com",
  demo_user: "demo@example.com",
  demo_password: "demo123",
  notes: "Demo account is pre-configured with sample data"
)

# Submission
submit_for_review(false)
automatic_release(false)
phased_release(true)

# Precheck
precheck_include_in_app_purchases(false)
```

### Metadata Directory Structure

```
fastlane/metadata/
├── en-US/
│   ├── name.txt
│   ├── subtitle.txt
│   ├── description.txt
│   ├── keywords.txt
│   ├── release_notes.txt
│   ├── promotional_text.txt
│   ├── support_url.txt
│   ├── marketing_url.txt
│   └── privacy_url.txt
├── es-ES/
│   └── ... (same structure)
├── review_information/
│   ├── first_name.txt
│   ├── last_name.txt
│   ├── phone_number.txt
│   ├── email_address.txt
│   ├── demo_user.txt
│   ├── demo_password.txt
│   └── notes.txt
├── copyright.txt
├── primary_category.txt
├── secondary_category.txt
└── trade_representative_contact_information/
```

### Screenshots Directory

```
fastlane/screenshots/
├── en-US/
│   ├── iPhone 15 Pro Max-1_home.png
│   ├── iPhone 15 Pro Max-2_feature.png
│   ├── iPhone 15 Pro Max-3_settings.png
│   ├── iPhone 15 Pro-1_home.png
│   ├── iPad Pro (12.9-inch)-1_home.png
│   └── ...
└── es-ES/
    └── ...
```

### App Store Connect API Usage

```swift
// Example: Fetching apps using App Store Connect API
import Foundation

struct AppStoreConnectClient {
    let keyId: String
    let issuerId: String
    let privateKey: String

    func generateToken() -> String {
        // Generate JWT token
        let header = ["alg": "ES256", "kid": keyId, "typ": "JWT"]
        let payload = [
            "iss": issuerId,
            "exp": Int(Date().addingTimeInterval(20 * 60).timeIntervalSince1970),
            "aud": "appstoreconnect-v1"
        ]
        // Sign with ES256
        return jwt
    }

    func fetchApps() async throws -> [App] {
        let url = URL(string: "https://api.appstoreconnect.apple.com/v1/apps")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(generateToken())", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(AppsResponse.self, from: data)
        return response.data
    }
}
```

### TestFlight Configuration

```ruby
# fastlane/Fastfile
lane :beta do
  # Build
  gym(scheme: "MyApp")

  # Upload to TestFlight
  pilot(
    skip_waiting_for_build_processing: false,
    distribute_external: true,
    notify_external_testers: true,

    # Beta groups
    groups: ["Internal Testers", "External Beta"],

    # Changelog
    changelog: "Bug fixes and performance improvements",

    # Beta App Review
    beta_app_review_info: {
      contact_email: "review@example.com",
      contact_first_name: "John",
      contact_last_name: "Doe",
      contact_phone: "+1 555 555 5555",
      demo_account_name: "demo@example.com",
      demo_account_password: "demo123",
      notes: "Testing instructions here"
    },

    # Localized info
    localized_build_info: {
      "en-US" => {
        whats_new: "Bug fixes and improvements"
      },
      "es-ES" => {
        whats_new: "Correcciones y mejoras"
      }
    }
  )
end
```

### In-App Purchase Configuration

```json
{
  "iaps": [
    {
      "product_id": "com.example.premium_monthly",
      "type": "auto_renewable_subscription",
      "reference_name": "Premium Monthly",
      "subscription_group": "Premium",
      "pricing": [
        {
          "country": "USA",
          "price_tier": 4
        }
      ],
      "localizations": [
        {
          "locale": "en-US",
          "name": "Premium Monthly",
          "description": "Unlock all premium features"
        }
      ]
    }
  ]
}
```

## Quality Gates

### Submission Readiness

- All required metadata complete
- Screenshots for all required sizes
- Privacy policy URL valid
- Age rating configured
- App review information complete

### Build Requirements

- Valid code signing
- No missing entitlements
- Export compliance configured
- Build processed successfully

### Compliance

- App Privacy questionnaire complete
- IDFA usage declared
- Third-party code disclosed

## Related Skills

- `fastlane-cicd` - Build automation
- `swift-swiftui` - iOS development
- `mobile-security` - App security

## Version History

- 1.0.0 - Initial release with App Store Connect API support
