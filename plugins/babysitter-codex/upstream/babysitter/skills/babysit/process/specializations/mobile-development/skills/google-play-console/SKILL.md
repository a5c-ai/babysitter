---
name: Google Play Console
description: Google Play Store publishing and management expertise
version: 1.0.0
category: Android Distribution
slug: google-play-console
status: active
---

# Google Play Console Skill

## Overview

This skill provides comprehensive capabilities for Google Play Store publishing and management. It enables interaction with Google Play Developer API, store listing management, release track configuration, and app lifecycle management.

## Allowed Tools

- `bash` - Execute bundletool, Gradle, and Google Cloud commands
- `read` - Analyze store listing files and configurations
- `write` - Generate metadata files and API configurations
- `edit` - Update Play Store metadata
- `glob` - Search for metadata and graphics files
- `grep` - Search for patterns in configurations

## Capabilities

### Google Play Developer API

1. **API Authentication**
   - Configure service account credentials
   - Implement OAuth 2.0 authentication
   - Handle API quotas and limits
   - Configure project permissions

2. **App Management**
   - Create and manage app listings
   - Configure app content rating
   - Manage target audience settings
   - Handle app categories

### Build Management

3. **AAB Upload**
   - Upload Android App Bundles
   - Validate AAB files with bundletool
   - Configure build versioning
   - Handle upload errors

4. **Build Information**
   - Track upload status
   - Configure native code debugging
   - Manage deobfuscation files
   - Handle expansion files (OBB)

### Release Management

5. **Release Tracks**
   - Configure internal testing track
   - Set up closed testing (alpha)
   - Manage open testing (beta)
   - Handle production releases

6. **Staged Rollouts**
   - Configure percentage rollouts
   - Monitor rollout metrics
   - Handle rollout pause/resume
   - Implement rollback strategies

### Store Listing

7. **App Details**
   - Configure app title and descriptions
   - Set up short and full descriptions
   - Manage app categories
   - Configure content rating

8. **Graphics Assets**
   - Upload screenshots
   - Configure feature graphics
   - Manage promo videos
   - Handle icon requirements

9. **Localization**
   - Configure supported languages
   - Manage translated listings
   - Handle default language
   - Import/export translations

### Data Safety

10. **Data Safety Declaration**
    - Configure data collection disclosure
    - Declare data sharing practices
    - Set up security practices
    - Handle data deletion requests

### In-App Products

11. **Products Configuration**
    - Create managed products
    - Configure subscriptions
    - Set up subscription base plans
    - Handle promotional offers

### Testing

12. **Internal App Sharing**
    - Configure internal sharing
    - Generate shareable links
    - Manage test versions
    - Handle tester feedback

13. **Pre-launch Reports**
    - Review automated tests
    - Analyze crash reports
    - Check accessibility issues
    - Review security findings

## Target Processes

This skill integrates with the following processes:

- `android-playstore-publishing.js` - Play Store publishing
- `beta-testing-setup.js` - Beta distribution
- `app-store-optimization.js` - ASO optimization
- `automated-release-management.js` - Release automation

## Dependencies

### Required

- Google Play Developer account
- Service account with API access
- Android SDK (for bundletool)
- Signed AAB file

### Optional

- Fastlane
- Google Cloud CLI
- bundletool

## Configuration

### Service Account Setup

```bash
# Create service account in Google Cloud Console
# 1. Go to Google Cloud Console
# 2. Create new service account
# 3. Grant "Service Account User" role
# 4. Create JSON key file

# Link to Play Console
# 1. Go to Play Console > Settings > API access
# 2. Link Google Cloud project
# 3. Grant permissions to service account
```

### Credentials File

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## Usage Examples

### Fastlane Supply Configuration

```ruby
# fastlane/Fastfile
lane :deploy_production do
  gradle(
    task: "bundle",
    build_type: "Release"
  )

  supply(
    track: "production",
    aab: "./app/build/outputs/bundle/release/app-release.aab",
    json_key: "./fastlane/play-store-key.json",
    package_name: "com.example.myapp",

    # Rollout percentage (0.0 to 1.0)
    rollout: "0.1",

    # Skip metadata upload
    skip_upload_metadata: false,
    skip_upload_images: false,
    skip_upload_screenshots: false,
    skip_upload_changelogs: false,

    # Release notes
    release_status: "completed",

    # Version code
    version_code: 42,

    # Mapping file for crash reports
    mapping: "./app/build/outputs/mapping/release/mapping.txt"
  )
end

lane :deploy_beta do
  gradle(task: "bundle", build_type: "Release")

  supply(
    track: "beta",
    aab: "./app/build/outputs/bundle/release/app-release.aab",
    json_key: "./fastlane/play-store-key.json"
  )
end

lane :promote_to_production do
  supply(
    track: "beta",
    track_promote_to: "production",
    json_key: "./fastlane/play-store-key.json",
    rollout: "0.2"
  )
end
```

### Metadata Directory Structure

```
fastlane/metadata/android/
├── en-US/
│   ├── title.txt                    # Max 30 chars
│   ├── short_description.txt        # Max 80 chars
│   ├── full_description.txt         # Max 4000 chars
│   ├── changelogs/
│   │   ├── default.txt
│   │   ├── 42.txt                   # Version code specific
│   │   └── 43.txt
│   └── images/
│       ├── phoneScreenshots/
│       │   ├── 1_home.png
│       │   ├── 2_feature.png
│       │   └── 3_settings.png
│       ├── sevenInchScreenshots/
│       ├── tenInchScreenshots/
│       ├── tvScreenshots/
│       ├── wearScreenshots/
│       ├── featureGraphic.png       # 1024x500
│       ├── icon.png                 # 512x512
│       ├── promoGraphic.png         # 180x120
│       └── tvBanner.png             # 1280x720
├── es-ES/
│   └── ... (same structure)
└── default.txt                      # Default language code
```

### Google Play Developer API Usage

```kotlin
// Example: Publishing via Google Play Developer API
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.androidpublisher.AndroidPublisher
import com.google.api.services.androidpublisher.model.*
import com.google.auth.http.HttpCredentialsAdapter
import com.google.auth.oauth2.GoogleCredentials
import java.io.FileInputStream

class PlayStorePublisher(
    private val packageName: String,
    credentialsPath: String
) {
    private val publisher: AndroidPublisher

    init {
        val credentials = GoogleCredentials
            .fromStream(FileInputStream(credentialsPath))
            .createScoped(listOf("https://www.googleapis.com/auth/androidpublisher"))

        publisher = AndroidPublisher.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            HttpCredentialsAdapter(credentials)
        )
            .setApplicationName("MyApp Publisher")
            .build()
    }

    fun uploadAndPublish(aabPath: String, track: String, releaseNotes: Map<String, String>) {
        val edits = publisher.edits()

        // Create edit
        val edit = edits.insert(packageName, null).execute()
        val editId = edit.id

        try {
            // Upload AAB
            val aabFile = java.io.File(aabPath)
            val uploadResponse = edits.bundles()
                .upload(packageName, editId, FileContent("application/octet-stream", aabFile))
                .execute()

            val versionCode = uploadResponse.versionCode

            // Create release
            val release = TrackRelease().apply {
                this.versionCodes = listOf(versionCode.toLong())
                this.status = "completed"
                this.releaseNotes = releaseNotes.map { (lang, notes) ->
                    LocalizedText().apply {
                        language = lang
                        text = notes
                    }
                }
            }

            // Update track
            val trackConfig = Track().apply {
                this.track = track
                this.releases = listOf(release)
            }

            edits.tracks()
                .update(packageName, editId, track, trackConfig)
                .execute()

            // Commit edit
            edits.commit(packageName, editId).execute()
            println("Successfully published version $versionCode to $track")

        } catch (e: Exception) {
            // Delete edit on failure
            edits.delete(packageName, editId).execute()
            throw e
        }
    }
}
```

### Data Safety Configuration

```yaml
# data_safety.yaml
data_collection:
  - category: "Personal info"
    types:
      - "Name"
      - "Email address"
    purposes:
      - "App functionality"
      - "Account management"
    is_optional: false

  - category: "Financial info"
    types:
      - "Purchase history"
    purposes:
      - "App functionality"
    is_optional: false

data_sharing:
  - category: "Analytics"
    shared_with: "Third parties"
    purpose: "Analytics"

security_practices:
  data_encrypted_in_transit: true
  data_deletion_available: true
  independent_security_review: false
```

### Bundletool Commands

```bash
# Validate AAB
bundletool validate --bundle=app-release.aab

# Build APKs from AAB
bundletool build-apks \
  --bundle=app-release.aab \
  --output=app.apks \
  --ks=release.keystore \
  --ks-key-alias=release \
  --ks-pass=pass:password

# Install APKs on device
bundletool install-apks --apks=app.apks

# Get device spec
bundletool get-device-spec --output=device-spec.json

# Build APKs for specific device
bundletool build-apks \
  --bundle=app-release.aab \
  --output=device.apks \
  --device-spec=device-spec.json
```

### Version Code Management

```kotlin
// build.gradle.kts
android {
    defaultConfig {
        // Auto-increment version code based on CI build number
        val buildNumber = System.getenv("BUILD_NUMBER")?.toIntOrNull() ?: 1
        versionCode = buildNumber
        versionName = "1.0.${buildNumber}"
    }
}
```

## Quality Gates

### Store Listing Requirements

- Title: max 30 characters
- Short description: max 80 characters
- Full description: max 4000 characters
- Feature graphic: 1024x500 PNG or JPEG
- Screenshots: 2-8 per device type
- Icon: 512x512 32-bit PNG

### Release Requirements

- Signed AAB file
- Target API level compliance
- 64-bit support
- Permissions declared
- Data safety form complete

### Compliance

- Content rating questionnaire
- Target audience declaration
- Ads declaration
- Data safety section

## Related Skills

- `fastlane-cicd` - Build automation
- `kotlin-compose` - Android development
- `firebase-mobile` - Firebase integration

## Version History

- 1.0.0 - Initial release with Play Developer API v3 support
