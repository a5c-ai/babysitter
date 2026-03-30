---
name: Swift/SwiftUI Development
description: Expert skill for native iOS development with Swift and SwiftUI
version: 1.0.0
category: Native iOS Development
slug: swift-swiftui
status: active
---

# Swift/SwiftUI Development Skill

## Overview

This skill provides expert capabilities for native iOS development using Swift and SwiftUI. It enables generation of SwiftUI views, implementation of state management patterns, Combine reactive programming, and comprehensive Xcode build operations.

## Allowed Tools

- `bash` - Execute xcodebuild, swift, and xcrun commands
- `read` - Analyze Swift source files and Xcode project configurations
- `write` - Generate and modify Swift code and SwiftUI views
- `edit` - Update existing Swift code and configurations
- `glob` - Search for Swift files and Xcode project files
- `grep` - Search for patterns in Swift codebase

## Capabilities

### SwiftUI Development

1. **View Generation**
   - Create SwiftUI views with proper structure
   - Implement ViewBuilder for custom containers
   - Build reusable view modifiers
   - Generate preview providers
   - Create environment-aware views

2. **State Management**
   - Implement @State for local view state
   - Use @Binding for two-way bindings
   - Configure @ObservedObject and @StateObject
   - Implement @EnvironmentObject for dependency injection
   - Use @AppStorage for UserDefaults integration

3. **Navigation**
   - Configure NavigationStack with path-based routing
   - Implement NavigationLink and NavigationDestination
   - Set up TabView with programmatic selection
   - Handle sheet and fullScreenCover presentations
   - Implement deep linking with URL handling

### Combine Framework

4. **Reactive Patterns**
   - Create Publishers and Subscribers
   - Implement custom Combine operators
   - Handle error propagation and recovery
   - Use @Published for observable properties
   - Configure cancellation with AnyCancellable

5. **Data Flow**
   - Implement PassthroughSubject and CurrentValueSubject
   - Configure debounce and throttle for user input
   - Chain operators for data transformation
   - Handle async operations with Future

### Swift Package Manager

6. **Package Management**
   - Configure Package.swift for dependencies
   - Create local Swift packages
   - Implement package products and targets
   - Configure binary dependencies
   - Set up package plugins

### Xcode Build System

7. **Build Operations**
   - Execute xcodebuild for compilation
   - Configure build schemes and configurations
   - Implement archive and export workflows
   - Set up code signing with profiles
   - Generate dSYM files for crash reporting

8. **Code Signing**
   - Configure automatic code signing
   - Set up manual provisioning profiles
   - Implement certificate management
   - Configure entitlements files
   - Handle App Groups and capabilities

### Testing

9. **XCTest Framework**
   - Write unit tests with XCTestCase
   - Implement UI tests with XCUITest
   - Configure test plans and schemes
   - Set up code coverage collection
   - Create mock objects for testing

10. **Performance Testing**
    - Use XCTMetric for performance measurement
    - Configure Instruments profiles
    - Implement memory testing
    - Profile energy impact
    - Analyze launch time

## Target Processes

This skill integrates with the following processes:

- `swiftui-app-development.js` - SwiftUI app architecture
- `ios-core-data-implementation.js` - Core Data integration
- `ios-push-notifications.js` - APNs configuration
- `ios-appstore-submission.js` - App Store submission
- `mobile-accessibility-implementation.js` - Accessibility features

## Dependencies

### Required

- Xcode 15+
- Swift 5.9+
- macOS 14+ (Sonoma)

### Optional

- Instruments
- SF Symbols app
- Swift Playgrounds
- TestFlight

## Configuration

### Project Structure

```
MyApp/
├── MyApp/
│   ├── App/
│   │   ├── MyAppApp.swift
│   │   └── ContentView.swift
│   ├── Features/
│   │   └── FeatureName/
│   │       ├── Views/
│   │       ├── ViewModels/
│   │       └── Models/
│   ├── Core/
│   │   ├── Extensions/
│   │   ├── Utilities/
│   │   └── Services/
│   ├── Resources/
│   │   └── Assets.xcassets
│   └── Info.plist
├── MyAppTests/
├── MyAppUITests/
└── MyApp.xcodeproj
```

### SwiftUI App Entry Point

```swift
// MyAppApp.swift
import SwiftUI

@main
struct MyAppApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
```

## Usage Examples

### Create SwiftUI View

```swift
// Features/Home/Views/HomeView.swift
import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.filteredItems) { item in
                    NavigationLink(value: item) {
                        ItemRowView(item: item)
                    }
                }
            }
            .navigationTitle("Home")
            .searchable(text: $searchText)
            .onChange(of: searchText) { _, newValue in
                viewModel.search(query: newValue)
            }
            .navigationDestination(for: Item.self) { item in
                ItemDetailView(item: item)
            }
            .refreshable {
                await viewModel.refresh()
            }
        }
    }
}

#Preview {
    HomeView()
}
```

### Implement ViewModel with Combine

```swift
// Features/Home/ViewModels/HomeViewModel.swift
import Foundation
import Combine

@MainActor
final class HomeViewModel: ObservableObject {
    @Published private(set) var items: [Item] = []
    @Published private(set) var filteredItems: [Item] = []
    @Published private(set) var isLoading = false
    @Published private(set) var error: Error?

    private let itemService: ItemServiceProtocol
    private var cancellables = Set<AnyCancellable>()

    init(itemService: ItemServiceProtocol = ItemService()) {
        self.itemService = itemService
        setupBindings()
        Task { await loadItems() }
    }

    private func setupBindings() {
        $items
            .assign(to: &$filteredItems)
    }

    func loadItems() async {
        isLoading = true
        error = nil

        do {
            items = try await itemService.fetchItems()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    func search(query: String) {
        if query.isEmpty {
            filteredItems = items
        } else {
            filteredItems = items.filter { $0.title.localizedCaseInsensitiveContains(query) }
        }
    }

    func refresh() async {
        await loadItems()
    }
}
```

### Create Custom View Modifier

```swift
// Core/ViewModifiers/CardStyle.swift
import SwiftUI

struct CardStyle: ViewModifier {
    var cornerRadius: CGFloat = 12
    var shadowRadius: CGFloat = 4

    func body(content: Content) -> some View {
        content
            .background(Color(.systemBackground))
            .cornerRadius(cornerRadius)
            .shadow(color: .black.opacity(0.1), radius: shadowRadius, x: 0, y: 2)
    }
}

extension View {
    func cardStyle(cornerRadius: CGFloat = 12, shadowRadius: CGFloat = 4) -> some View {
        modifier(CardStyle(cornerRadius: cornerRadius, shadowRadius: shadowRadius))
    }
}
```

### Configure Navigation with Deep Linking

```swift
// App/Router.swift
import SwiftUI

enum Route: Hashable {
    case home
    case detail(id: String)
    case settings
    case profile(userId: String)
}

final class Router: ObservableObject {
    @Published var path = NavigationPath()

    func navigate(to route: Route) {
        path.append(route)
    }

    func navigateBack() {
        path.removeLast()
    }

    func navigateToRoot() {
        path.removeLast(path.count)
    }

    func handle(url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              let host = components.host else {
            return false
        }

        switch host {
        case "detail":
            if let id = components.queryItems?.first(where: { $0.name == "id" })?.value {
                navigate(to: .detail(id: id))
                return true
            }
        case "profile":
            if let userId = components.queryItems?.first(where: { $0.name == "userId" })?.value {
                navigate(to: .profile(userId: userId))
                return true
            }
        default:
            break
        }

        return false
    }
}
```

### Build Commands

```bash
# Build for simulator
xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build

# Build for device
xcodebuild -scheme MyApp -destination 'generic/platform=iOS' build

# Archive for distribution
xcodebuild -scheme MyApp -archivePath ./build/MyApp.xcarchive archive

# Export IPA
xcodebuild -exportArchive -archivePath ./build/MyApp.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist

# Run tests
xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Quality Gates

### Code Quality

- Swift compiler warnings treated as errors
- SwiftLint compliance with strict rules
- No force unwrapping in production code
- Proper access control modifiers

### Performance Benchmarks

- App launch time < 1 second (cold start)
- Smooth 120fps animations (ProMotion devices)
- Memory usage within App Store guidelines
- No Main Thread Checker warnings

### Test Coverage

- Unit test coverage > 80%
- UI test coverage for critical flows
- Performance tests for key operations

## Error Handling

### Common Issues

1. **Xcode build cache issues**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

2. **Code signing issues**
   ```bash
   security find-identity -v -p codesigning
   ```

3. **Swift Package resolution**
   ```bash
   swift package resolve
   # Or in Xcode: File > Packages > Reset Package Caches
   ```

4. **Simulator issues**
   ```bash
   xcrun simctl erase all
   ```

## Related Skills

- `ios-persistence` - Core Data and Realm integration
- `push-notifications` - APNs configuration
- `mobile-security` - iOS security implementation
- `app-store-connect` - App Store submission

## Version History

- 1.0.0 - Initial release with core Swift/SwiftUI capabilities
