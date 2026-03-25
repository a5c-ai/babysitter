---
name: swiftui-view-generator
description: Generate SwiftUI views with proper state management (@State, @Binding, @ObservedObject, @StateObject) and macOS-specific patterns
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [swiftui, macos, swift, ui, apple]
---

# swiftui-view-generator

Generate SwiftUI views with proper state management for macOS applications. This skill creates well-structured SwiftUI components using @State, @Binding, @ObservedObject, @StateObject, and @EnvironmentObject property wrappers.

## Capabilities

- Generate SwiftUI views with proper state management
- Create reusable view components
- Set up data flow with Combine
- Implement navigation patterns
- Generate macOS-specific UI elements
- Create preference-based layouts
- Set up environment values
- Generate preview providers

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Swift project"
    },
    "viewName": {
      "type": "string",
      "description": "Name of the view to generate"
    },
    "viewType": {
      "enum": ["screen", "component", "list", "form", "settings", "sheet"],
      "default": "screen"
    },
    "stateProperties": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" },
          "wrapper": { "enum": ["State", "Binding", "ObservedObject", "StateObject", "EnvironmentObject"] }
        }
      }
    },
    "includeViewModel": {
      "type": "boolean",
      "default": true
    },
    "macOSSpecific": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath", "viewName"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["view", "viewmodel", "model"] }
        }
      }
    }
  },
  "required": ["success"]
}
```

## Generated SwiftUI View Example

```swift
// ContentView.swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = ContentViewModel()
    @State private var searchText = ""
    @State private var isShowingSettings = false

    var body: some View {
        NavigationSplitView {
            // Sidebar
            SidebarView(selection: $viewModel.selectedCategory)
        } detail: {
            // Detail view
            if let category = viewModel.selectedCategory {
                CategoryDetailView(category: category)
            } else {
                Text("Select a category")
                    .foregroundStyle(.secondary)
            }
        }
        .searchable(text: $searchText, prompt: "Search items...")
        .onChange(of: searchText) { _, newValue in
            viewModel.search(query: newValue)
        }
        .toolbar {
            ToolbarItemGroup {
                Button(action: viewModel.refresh) {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }

                Button(action: { isShowingSettings = true }) {
                    Label("Settings", systemImage: "gear")
                }
            }
        }
        .sheet(isPresented: $isShowingSettings) {
            SettingsView()
        }
        .task {
            await viewModel.loadData()
        }
    }
}

// MARK: - Preview
#Preview {
    ContentView()
}

#Preview("With Data") {
    ContentView()
        .environmentObject(PreviewData.sampleViewModel)
}
```

### ViewModel

```swift
// ContentViewModel.swift
import SwiftUI
import Combine

@MainActor
class ContentViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var selectedCategory: Category?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let dataService: DataService
    private var cancellables = Set<AnyCancellable>()

    init(dataService: DataService = .shared) {
        self.dataService = dataService
    }

    func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            items = try await dataService.fetchItems()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func search(query: String) {
        // Debounced search implementation
        Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            // Perform search
        }
    }

    func refresh() {
        Task {
            await loadData()
        }
    }
}
```

### Reusable Component

```swift
// ItemRowView.swift
import SwiftUI

struct ItemRowView: View {
    let item: Item
    @Binding var isSelected: Bool
    var onDelete: (() -> Void)?

    var body: some View {
        HStack {
            Image(systemName: item.icon)
                .foregroundStyle(item.color)
                .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.headline)

                Text(item.subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if isSelected {
                Image(systemName: "checkmark")
                    .foregroundStyle(.blue)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture {
            isSelected.toggle()
        }
        .contextMenu {
            Button("Edit") { }
            Button("Duplicate") { }
            Divider()
            Button("Delete", role: .destructive) {
                onDelete?()
            }
        }
    }
}
```

### Settings View (macOS)

```swift
// SettingsView.swift
import SwiftUI

struct SettingsView: View {
    var body: some View {
        TabView {
            GeneralSettingsView()
                .tabItem {
                    Label("General", systemImage: "gear")
                }

            AppearanceSettingsView()
                .tabItem {
                    Label("Appearance", systemImage: "paintpalette")
                }

            AdvancedSettingsView()
                .tabItem {
                    Label("Advanced", systemImage: "slider.horizontal.3")
                }
        }
        .frame(width: 500, height: 400)
    }
}

struct GeneralSettingsView: View {
    @AppStorage("launchAtLogin") private var launchAtLogin = false
    @AppStorage("checkForUpdates") private var checkForUpdates = true

    var body: some View {
        Form {
            Toggle("Launch at Login", isOn: $launchAtLogin)
            Toggle("Check for Updates Automatically", isOn: $checkForUpdates)
        }
        .formStyle(.grouped)
        .padding()
    }
}
```

### List View with Selection

```swift
// ItemListView.swift
import SwiftUI

struct ItemListView: View {
    @ObservedObject var viewModel: ItemListViewModel
    @State private var selection: Set<Item.ID> = []
    @State private var sortOrder = [KeyPathComparator(\Item.name)]

    var body: some View {
        Table(viewModel.items, selection: $selection, sortOrder: $sortOrder) {
            TableColumn("Name", value: \.name)
            TableColumn("Type", value: \.type)
            TableColumn("Modified", value: \.modifiedDate) { item in
                Text(item.modifiedDate, style: .date)
            }
            TableColumn("Size") { item in
                Text(ByteCountFormatter.string(fromByteCount: item.size, countStyle: .file))
            }
            .width(80)
        }
        .onChange(of: sortOrder) { _, newOrder in
            viewModel.sort(by: newOrder)
        }
        .contextMenu(forSelectionType: Item.ID.self) { items in
            Button("Open") { viewModel.open(items) }
            Button("Delete", role: .destructive) { viewModel.delete(items) }
        } primaryAction: { items in
            viewModel.open(items)
        }
    }
}
```

## State Management Patterns

### @State - Local state

```swift
@State private var isExpanded = false
@State private var selectedTab = 0
```

### @Binding - Two-way binding from parent

```swift
@Binding var isPresented: Bool
@Binding var selectedItem: Item?
```

### @StateObject - Owned observable object

```swift
@StateObject private var viewModel = MyViewModel()
```

### @ObservedObject - Passed observable object

```swift
@ObservedObject var viewModel: MyViewModel
```

### @EnvironmentObject - Shared via environment

```swift
@EnvironmentObject var settings: AppSettings
```

### @AppStorage - UserDefaults backed

```swift
@AppStorage("username") private var username = ""
```

## Best Practices

1. **Use @StateObject for ownership**: When the view creates the object
2. **Use @ObservedObject for injection**: When the object is passed in
3. **Keep views small**: Extract components
4. **Use previews**: Test different states
5. **Mark async operations**: Use @MainActor for ViewModels
6. **Handle errors gracefully**: Show user-friendly messages

## Related Skills

- `macos-entitlements-generator` - App capabilities
- `macos-notarization-workflow` - Distribution
- `xctest-ui-test-generator` - UI testing

## Related Agents

- `swiftui-macos-expert` - SwiftUI expertise
- `desktop-ux-analyst` - UX patterns
