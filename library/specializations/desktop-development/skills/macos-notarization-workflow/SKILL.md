---
name: macos-notarization-workflow
description: Automate Apple notarization with xcrun notarytool for macOS application distribution
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [macos, notarization, codesign, apple, distribution]
---

# macos-notarization-workflow

Automate Apple notarization workflow using xcrun notarytool for macOS applications. This skill handles the complete notarization process including submission, status checking, and stapling.

## Capabilities

- Submit apps for notarization via notarytool
- Monitor notarization status
- Staple notarization ticket to app
- Handle notarization errors
- Generate CI/CD notarization scripts
- Configure App Store Connect API keys
- Validate apps before submission
- Generate notarization reports

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the project"
    },
    "appPath": {
      "type": "string",
      "description": "Path to the signed app bundle or DMG"
    },
    "authMethod": {
      "enum": ["app-store-connect-api", "apple-id", "keychain"],
      "default": "app-store-connect-api"
    },
    "credentials": {
      "type": "object",
      "properties": {
        "keyId": { "type": "string" },
        "issuerId": { "type": "string" },
        "keyPath": { "type": "string" },
        "appleId": { "type": "string" },
        "teamId": { "type": "string" }
      }
    },
    "waitForCompletion": {
      "type": "boolean",
      "default": true
    },
    "staple": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath", "appPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "submissionId": { "type": "string" },
    "status": { "enum": ["Accepted", "Invalid", "In Progress", "Rejected"] },
    "logUrl": { "type": "string" },
    "errors": { "type": "array" },
    "stapled": { "type": "boolean" }
  },
  "required": ["success"]
}
```

## Notarization Workflow

### 1. Prerequisites

```bash
# Ensure Xcode command line tools are installed
xcode-select --install

# Verify code signing
codesign --verify --deep --strict MyApp.app
codesign -vvv --deep --strict MyApp.app

# Check hardened runtime
codesign -dvvv MyApp.app | grep runtime
# Should show: flags=0x10000(runtime)
```

### 2. Store Credentials (Recommended)

```bash
# Store App Store Connect API key in keychain
xcrun notarytool store-credentials "MyProfile" \
    --key ~/private_keys/AuthKey_XXXXXXXXXX.p8 \
    --key-id XXXXXXXXXX \
    --issuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Or store Apple ID credentials
xcrun notarytool store-credentials "MyAppleIDProfile" \
    --apple-id your.email@example.com \
    --team-id XXXXXXXXXX \
    --password @keychain:AC_PASSWORD
```

### 3. Submit for Notarization

```bash
# Using stored credentials
xcrun notarytool submit MyApp.app \
    --keychain-profile "MyProfile" \
    --wait

# Using API key directly
xcrun notarytool submit MyApp.app \
    --key ~/private_keys/AuthKey_XXXXXXXXXX.p8 \
    --key-id XXXXXXXXXX \
    --issuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
    --wait

# Using Apple ID
xcrun notarytool submit MyApp.app \
    --apple-id your.email@example.com \
    --team-id XXXXXXXXXX \
    --password @keychain:AC_PASSWORD \
    --wait
```

### 4. Check Status

```bash
# Check specific submission
xcrun notarytool info <submission-id> \
    --keychain-profile "MyProfile"

# Get submission log
xcrun notarytool log <submission-id> \
    --keychain-profile "MyProfile" \
    developer_log.json

# List recent submissions
xcrun notarytool history \
    --keychain-profile "MyProfile"
```

### 5. Staple Ticket

```bash
# Staple to app bundle
xcrun stapler staple MyApp.app

# Staple to DMG
xcrun stapler staple MyApp.dmg

# Staple to pkg
xcrun stapler staple MyApp.pkg

# Validate stapling
xcrun stapler validate MyApp.app
```

## Complete Script

```bash
#!/bin/bash
# notarize.sh

set -e

APP_PATH="${1}"
KEYCHAIN_PROFILE="${2:-MyProfile}"

echo "=== Validating app bundle ==="
codesign --verify --deep --strict "$APP_PATH"

echo "=== Submitting for notarization ==="
SUBMISSION_OUTPUT=$(xcrun notarytool submit "$APP_PATH" \
    --keychain-profile "$KEYCHAIN_PROFILE" \
    --wait \
    --output-format json)

SUBMISSION_ID=$(echo "$SUBMISSION_OUTPUT" | jq -r '.id')
STATUS=$(echo "$SUBMISSION_OUTPUT" | jq -r '.status')

echo "Submission ID: $SUBMISSION_ID"
echo "Status: $STATUS"

if [ "$STATUS" != "Accepted" ]; then
    echo "=== Notarization failed, fetching log ==="
    xcrun notarytool log "$SUBMISSION_ID" \
        --keychain-profile "$KEYCHAIN_PROFILE" \
        notarization_log.json

    cat notarization_log.json
    exit 1
fi

echo "=== Stapling ticket ==="
xcrun stapler staple "$APP_PATH"

echo "=== Validating staple ==="
xcrun stapler validate "$APP_PATH"

echo "=== Notarization complete ==="
```

## GitHub Actions Integration

```yaml
name: Build and Notarize

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: macos-latest

    steps:
    - uses: actions/checkout@v4

    - name: Import signing certificate
      env:
        CERTIFICATE_BASE64: ${{ secrets.MACOS_CERTIFICATE }}
        CERTIFICATE_PASSWORD: ${{ secrets.MACOS_CERTIFICATE_PWD }}
      run: |
        CERTIFICATE_PATH=$RUNNER_TEMP/certificate.p12
        KEYCHAIN_PATH=$RUNNER_TEMP/app-signing.keychain-db
        KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

        echo -n "$CERTIFICATE_BASE64" | base64 --decode > $CERTIFICATE_PATH

        security create-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
        security set-keychain-settings -lut 21600 $KEYCHAIN_PATH
        security unlock-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

        security import $CERTIFICATE_PATH -P "$CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k $KEYCHAIN_PATH
        security list-keychain -d user -s $KEYCHAIN_PATH

    - name: Build app
      run: |
        xcodebuild -project MyApp.xcodeproj \
            -scheme MyApp \
            -configuration Release \
            -archivePath build/MyApp.xcarchive \
            archive

        xcodebuild -exportArchive \
            -archivePath build/MyApp.xcarchive \
            -exportOptionsPlist ExportOptions.plist \
            -exportPath build/

    - name: Store notarization credentials
      env:
        API_KEY: ${{ secrets.NOTARIZATION_API_KEY }}
        API_KEY_ID: ${{ secrets.NOTARIZATION_API_KEY_ID }}
        API_ISSUER: ${{ secrets.NOTARIZATION_API_ISSUER }}
      run: |
        mkdir -p ~/private_keys
        echo -n "$API_KEY" > ~/private_keys/AuthKey.p8

        xcrun notarytool store-credentials "CI_PROFILE" \
            --key ~/private_keys/AuthKey.p8 \
            --key-id "$API_KEY_ID" \
            --issuer "$API_ISSUER"

    - name: Notarize app
      run: |
        xcrun notarytool submit build/MyApp.app \
            --keychain-profile "CI_PROFILE" \
            --wait

        xcrun stapler staple build/MyApp.app

    - name: Create DMG
      run: |
        create-dmg build/MyApp.app build/
        xcrun notarytool submit build/*.dmg \
            --keychain-profile "CI_PROFILE" \
            --wait
        xcrun stapler staple build/*.dmg

    - name: Upload artifact
      uses: actions/upload-artifact@v4
      with:
        name: MyApp
        path: build/*.dmg
```

## Common Issues

### Issue: Hardened runtime not enabled

```
Error: The signature does not include a secure timestamp.
```

**Fix**: Sign with hardened runtime and timestamp:

```bash
codesign --force --options runtime --timestamp --sign "Developer ID" MyApp.app
```

### Issue: Missing entitlements

```
Error: The executable does not have the hardened runtime enabled.
```

**Fix**: Include entitlements in signing:

```bash
codesign --force --options runtime --timestamp \
    --entitlements MyApp.entitlements \
    --sign "Developer ID Application: Company" MyApp.app
```

### Issue: Unsigned nested code

```
Error: The signature of the binary is invalid.
```

**Fix**: Sign all nested components:

```bash
find MyApp.app -name "*.dylib" -o -name "*.framework" | \
    xargs -I {} codesign --force --options runtime --timestamp --sign "Developer ID" {}
```

## Best Practices

1. **Use App Store Connect API**: More reliable than Apple ID
2. **Store credentials securely**: Use keychain profiles
3. **Validate before submitting**: codesign --verify
4. **Always staple**: Makes offline verification possible
5. **Archive submission logs**: For debugging
6. **Test on fresh Mac**: Verify Gatekeeper acceptance

## Related Skills

- `macos-entitlements-generator` - Entitlements configuration
- `macos-codesign-workflow` - Code signing
- `code-signing-setup` process - Full signing workflow

## Related Agents

- `swiftui-macos-expert` - macOS development
- `code-signing-specialist` - Signing expertise
