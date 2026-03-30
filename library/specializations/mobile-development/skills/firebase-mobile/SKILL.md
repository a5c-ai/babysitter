---
name: Firebase Mobile
description: Firebase backend services integration for mobile apps
version: 1.0.0
category: Backend Services
slug: firebase-mobile
status: active
---

# Firebase Mobile Skill

## Overview

This skill provides Firebase backend services integration for mobile applications. It enables configuration of Authentication, Firestore, Storage, Cloud Functions, and other Firebase services.

## Allowed Tools

- `bash` - Execute Firebase CLI commands
- `read` - Analyze Firebase configurations
- `write` - Generate security rules and configurations
- `edit` - Update Firebase implementations
- `glob` - Search for Firebase files
- `grep` - Search for patterns

## Capabilities

### Firebase Authentication

1. **Auth Methods**
   - Email/password authentication
   - OAuth providers (Google, Apple, Facebook)
   - Phone authentication
   - Anonymous authentication
   - Custom token authentication

2. **Auth State**
   - Handle auth state changes
   - Token refresh
   - Session persistence
   - Multi-factor authentication

### Cloud Firestore

3. **Database Operations**
   - Document CRUD operations
   - Collection queries
   - Real-time listeners
   - Batch operations
   - Transactions

4. **Security Rules**
   - Write Firestore rules
   - Test rules with emulator
   - Handle role-based access
   - Validate data structure

### Firebase Storage

5. **File Operations**
   - Upload files with progress
   - Download files
   - Generate download URLs
   - Handle metadata
   - Configure security rules

### Cloud Functions

6. **Function Integration**
   - Call HTTPS functions
   - Call callable functions
   - Handle function responses
   - Configure timeouts

### Remote Config

7. **Feature Flags**
   - Fetch remote config
   - Configure defaults
   - Handle fetch intervals
   - A/B testing setup

### Performance Monitoring

8. **Performance Tracking**
   - Automatic traces
   - Custom traces
   - Network request monitoring
   - Screen rendering metrics

## Target Processes

- `firebase-backend-integration.js` - Firebase integration
- `firebase-cloud-messaging.js` - Push notifications
- `mobile-analytics-setup.js` - Analytics

## Dependencies

- Firebase SDK
- Firebase CLI
- Google Cloud account

## Usage Examples

### Firebase Setup (iOS)

```swift
// AppDelegate.swift
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }
}

// AuthService.swift
class AuthService: ObservableObject {
    @Published var user: User?
    private var handle: AuthStateDidChangeListenerHandle?

    init() {
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.user = user
        }
    }

    func signIn(email: String, password: String) async throws {
        try await Auth.auth().signIn(withEmail: email, password: password)
    }

    func signUp(email: String, password: String) async throws {
        try await Auth.auth().createUser(withEmail: email, password: password)
    }

    func signOut() throws {
        try Auth.auth().signOut()
    }
}
```

### Firestore Repository (Android)

```kotlin
// data/repository/PostRepository.kt
class PostRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    private val postsCollection = firestore.collection("posts")

    fun observePosts(): Flow<List<Post>> = callbackFlow {
        val listener = postsCollection
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val posts = snapshot?.documents?.mapNotNull { it.toObject<Post>() } ?: emptyList()
                trySend(posts)
            }
        awaitClose { listener.remove() }
    }

    suspend fun createPost(post: Post): String {
        val docRef = postsCollection.add(post).await()
        return docRef.id
    }

    suspend fun updatePost(postId: String, updates: Map<String, Any>) {
        postsCollection.document(postId).update(updates).await()
    }

    suspend fun deletePost(postId: String) {
        postsCollection.document(postId).delete().await()
    }
}
```

### Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    match /posts/{postId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.authorId);
    }
  }
}
```

### Firebase Emulator

```bash
# Start emulators
firebase emulators:start

# Run with emulator in code
if ProcessInfo.processInfo.environment["USE_FIREBASE_EMULATOR"] == "YES" {
    Auth.auth().useEmulator(withHost: "localhost", port: 9099)
    Firestore.firestore().useEmulator(withHost: "localhost", port: 8080)
    Storage.storage().useEmulator(withHost: "localhost", port: 9199)
}
```

## Quality Gates

- Security rules tested with emulator
- Authentication flows verified
- Offline persistence tested
- Error handling comprehensive

## Related Skills

- `push-notifications` - FCM integration
- `mobile-analytics` - Firebase Analytics
- `mobile-security` - Security patterns

## Version History

- 1.0.0 - Initial release
