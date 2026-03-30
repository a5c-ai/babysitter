---
name: Mobile Performance Profiling
description: Mobile app performance analysis and optimization
version: 1.0.0
category: Performance
slug: mobile-perf
status: active
---

# Mobile Performance Profiling Skill

## Overview

This skill provides mobile app performance analysis and optimization capabilities. It enables profiling with Xcode Instruments, Android Profiler, Flipper, and Flutter DevTools to identify and fix performance issues.

## Allowed Tools

- `bash` - Execute profiling tools and build commands
- `read` - Analyze performance reports and profiles
- `write` - Generate optimization configurations
- `edit` - Update performance-related code
- `glob` - Search for performance files
- `grep` - Search for patterns

## Capabilities

### Xcode Instruments

1. **Time Profiler**
   - Profile CPU usage
   - Identify hot paths
   - Analyze call trees
   - Measure function durations

2. **Allocations**
   - Track memory allocations
   - Identify memory leaks
   - Analyze retain cycles
   - Monitor heap growth

3. **Core Animation**
   - Profile rendering performance
   - Identify offscreen renders
   - Measure frame rates
   - Detect layer issues

### Android Profiler

4. **CPU Profiler**
   - Record method traces
   - Analyze thread activity
   - Identify CPU bottlenecks
   - Profile startup time

5. **Memory Profiler**
   - Track allocations
   - Capture heap dumps
   - Identify memory leaks
   - Analyze GC events

6. **Network Profiler**
   - Monitor requests
   - Analyze response times
   - Profile bandwidth usage

### React Native

7. **Flipper Performance**
   - Monitor React renders
   - Profile JavaScript thread
   - Analyze bridge communication
   - Track native modules

8. **Hermes Profiler**
   - Profile Hermes engine
   - Analyze bytecode execution
   - Optimize bundle size

### Flutter DevTools

9. **Performance Overlay**
   - Monitor frame rendering
   - Identify jank
   - Profile widget rebuilds
   - Analyze timeline

### Metrics

10. **App Startup**
    - Cold start optimization
    - Warm start measurement
    - Hot start profiling
    - Deferred initialization

11. **Memory Management**
    - Peak memory usage
    - Memory warnings handling
    - Image caching strategies
    - Object pooling

12. **Rendering Performance**
    - Frame rate maintenance
    - Scroll performance
    - Animation smoothness
    - Layout optimization

## Target Processes

- `mobile-performance-optimization.js` - Performance tuning
- `mobile-testing-strategy.js` - Performance testing
- `jetpack-compose-ui.js` - Compose optimization
- `swiftui-app-development.js` - SwiftUI optimization

## Dependencies

- Xcode Instruments
- Android Studio Profiler
- Flipper
- Flutter DevTools

## Usage Examples

### Instruments Command Line

```bash
# Record Time Profiler trace
xcrun xctrace record --device "iPhone 15 Pro" \
  --template "Time Profiler" \
  --attach "MyApp" \
  --time-limit 30s \
  --output ~/Desktop/profile.trace

# Export trace data
xcrun xctrace export --input ~/Desktop/profile.trace \
  --xpath '/trace-toc/run/tracks/track[@name="Time Profiler"]' \
  --output ~/Desktop/profile_data.xml
```

### Android Profiler Commands

```bash
# Capture CPU trace
adb shell am profile start com.example.myapp /data/local/tmp/profile.trace

# Stop and pull trace
adb shell am profile stop com.example.myapp
adb pull /data/local/tmp/profile.trace ./profile.trace

# Capture heap dump
adb shell am dumpheap com.example.myapp /data/local/tmp/heap.hprof
adb pull /data/local/tmp/heap.hprof ./heap.hprof
```

### React Native Performance Optimization

```typescript
// Optimize list rendering
import { FlashList } from '@shopify/flash-list';

const OptimizedList = () => {
  const renderItem = useCallback(({ item }) => (
    <MemoizedListItem item={item} />
  ), []);

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      estimatedItemSize={100}
      keyExtractor={item => item.id}
    />
  );
};

// Memoize expensive components
const MemoizedListItem = memo(({ item }) => {
  return (
    <View style={styles.item}>
      <Text>{item.title}</Text>
    </View>
  );
}, (prev, next) => prev.item.id === next.item.id);

// Optimize images
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({ uri }) => (
  <FastImage
    source={{ uri, priority: FastImage.priority.normal }}
    resizeMode={FastImage.resizeMode.cover}
    style={styles.image}
  />
);
```

### SwiftUI Performance

```swift
// Optimize view updates
struct OptimizedView: View {
    @State private var items: [Item] = []

    var body: some View {
        List {
            ForEach(items) { item in
                ItemRow(item: item)
                    .equatable() // Prevent unnecessary redraws
            }
        }
    }
}

// Use Equatable for custom views
struct ItemRow: View, Equatable {
    let item: Item

    static func == (lhs: ItemRow, rhs: ItemRow) -> Bool {
        lhs.item.id == rhs.item.id
    }

    var body: some View {
        Text(item.title)
    }
}

// Lazy loading
struct LazyImageView: View {
    let url: URL

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                ProgressView()
            case .success(let image):
                image.resizable().aspectRatio(contentMode: .fit)
            case .failure:
                Image(systemName: "photo")
            @unknown default:
                EmptyView()
            }
        }
    }
}
```

### Compose Performance

```kotlin
// Optimize recomposition
@Composable
fun OptimizedList(items: List<Item>) {
    LazyColumn {
        items(
            items = items,
            key = { it.id }
        ) { item ->
            // Stable key prevents unnecessary recomposition
            ItemCard(item = item)
        }
    }
}

// Use derivedStateOf for computed values
@Composable
fun SearchableList(items: List<Item>, query: String) {
    val filteredItems by remember(items, query) {
        derivedStateOf {
            items.filter { it.title.contains(query, ignoreCase = true) }
        }
    }

    LazyColumn {
        items(filteredItems, key = { it.id }) { ItemCard(it) }
    }
}

// Use remember for expensive calculations
@Composable
fun ExpensiveView(data: ComplexData) {
    val processedData = remember(data) {
        expensiveCalculation(data)
    }

    Text(processedData.result)
}
```

## Quality Gates

- App startup < 2s (cold), < 1s (warm)
- Frame rate >= 60fps (120fps for ProMotion)
- Memory usage within platform limits
- No memory leaks detected
- Scroll performance smooth

## Related Skills

- `mobile-testing` - Performance testing
- `react-native-dev` - RN optimization
- `flutter-dart` - Flutter optimization
- `kotlin-compose` - Compose optimization

## Version History

- 1.0.0 - Initial release
