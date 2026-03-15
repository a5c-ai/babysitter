# Lottie Animations Skill

## Overview

The Lottie Animations skill provides comprehensive integration capabilities for Lottie animations across iOS, Android, React Native, and Flutter platforms. It enables high-quality vector animations exported from After Effects to be used in mobile applications with full playback control and interactivity.

## Purpose

Lottie enables designers to create complex animations in After Effects and export them as lightweight JSON files that render natively on mobile devices. This skill automates the integration process, enabling:

- **Animation Integration**: Import and configure Lottie across platforms
- **Playback Control**: Play, pause, loop, and segment animations
- **Interactive Animations**: Gesture and scroll-driven animations
- **Performance Optimization**: Optimize for smooth 60fps playback

## Use Cases

### 1. Loading Indicators
Replace static spinners with engaging animated loading states.

### 2. Onboarding Illustrations
Create animated illustrations for app onboarding flows.

### 3. Success/Error States
Provide visual feedback with animated success checkmarks or error indicators.

### 4. Micro-interactions
Add delightful animations to buttons, icons, and UI transitions.

### 5. Scroll-Synced Animations
Create animations that progress based on scroll position.

## Processes That Use This Skill

- **Mobile Animation Design** (`mobile-animation-design.js`)
- **Cross-Platform UI Library** (`cross-platform-ui-library.js`)
- **Responsive Mobile Layout** (`responsive-mobile-layout.js`)

## Installation

### iOS

```ruby
# Podfile
pod 'lottie-ios'
```

Or Swift Package Manager:
```
https://github.com/airbnb/lottie-ios.git
```

### Android

```groovy
// build.gradle (app)
dependencies {
    implementation 'com.airbnb.android:lottie:6.3.0'

    // For Compose
    implementation 'com.airbnb.android:lottie-compose:6.3.0'
}
```

### React Native

```bash
npm install lottie-react-native
# or
yarn add lottie-react-native

cd ios && pod install
```

### Flutter

```yaml
# pubspec.yaml
dependencies:
  lottie: ^3.0.0
```

## Configuration

### Adding Animation Files

#### iOS
Place JSON files in Xcode project or bundle:
```
MyApp/
  Resources/
    Animations/
      loading.json
      success.json
```

#### Android
Place in `res/raw/`:
```
app/src/main/res/raw/
  loading.json
  success.json
```

#### React Native
Place in assets folder:
```
src/
  assets/
    animations/
      loading.json
      success.json
```

#### Flutter
Add to `pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/animations/
```

## Capabilities

| Capability | iOS | Android | React Native | Flutter |
|------------|-----|---------|--------------|---------|
| Basic Playback | Yes | Yes | Yes | Yes |
| Loop Modes | Yes | Yes | Yes | Yes |
| Progress Control | Yes | Yes | Yes | Yes |
| Speed Control | Yes | Yes | Yes | Yes |
| Segment Playback | Yes | Yes | Yes | Yes |
| Color Theming | Yes | Yes | Limited | Yes |
| Caching | Yes | Yes | Yes | Yes |

## Example Workflows

### Basic Loading Animation

```swift
// iOS SwiftUI
LottieView(name: "loading", loopMode: .loop)
    .frame(width: 100, height: 100)
```

```kotlin
// Android Compose
LottieAnimation(
    composition = rememberLottieComposition(LottieCompositionSpec.RawRes(R.raw.loading)).value,
    iterations = LottieConstants.IterateForever,
    modifier = Modifier.size(100.dp)
)
```

```javascript
// React Native
<LottieView
  source={require('./loading.json')}
  autoPlay
  loop
  style={{ width: 100, height: 100 }}
/>
```

```dart
// Flutter
Lottie.asset('assets/loading.json', width: 100, height: 100, repeat: true)
```

### Controllable Success Animation

```swift
// iOS
struct SuccessAnimation: View {
    @State private var play = false

    var body: some View {
        LottieView(name: "success", play: $play, loopMode: .playOnce)
            .onAppear { play = true }
    }
}
```

### Scroll-Synced Animation

```kotlin
// Android Compose
@Composable
fun ScrollAnimation(scrollState: ScrollState) {
    val progress = scrollState.value.toFloat() / scrollState.maxValue
    val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(R.raw.scroll))

    LottieAnimation(composition = composition, progress = { progress })
}
```

## Integration with Other Skills

- **accessibility-testing**: Ensure animations respect reduced motion preferences
- **mobile-performance-optimization**: Profile animation rendering performance
- **cross-platform-ui-library**: Reusable animation components

## Troubleshooting

### Common Issues

1. **Animation Not Playing**: Check file path and ensure JSON is valid
2. **Poor Performance**: Optimize animation file, reduce layers
3. **Colors Wrong**: Check color mode in After Effects export
4. **Memory Issues**: Implement proper caching and cleanup

### Debug Commands

```bash
# Validate Lottie JSON
npx lottie-validator animation.json

# Check file size
ls -lh animation.json

# Optimize animation
npx @nicolo-ribaudo/lottie-optimize animation.json
```

### Performance Profiling

```swift
// iOS - Monitor frame rate
let displayLink = CADisplayLink(target: self, selector: #selector(tick))
displayLink.add(to: .main, forMode: .common)
```

```kotlin
// Android - Enable strict mode
StrictMode.setThreadPolicy(StrictMode.ThreadPolicy.Builder()
    .detectAll()
    .penaltyLog()
    .build())
```

## Best Practices

1. **Optimize First**: Always optimize animations before integration
2. **Respect Motion Preferences**: Honor reduced motion accessibility settings
3. **Lazy Load**: Don't load all animations at app startup
4. **Cache Wisely**: Balance memory usage with load times
5. **Test on Low-End Devices**: Ensure smooth playback everywhere
6. **Provide Fallbacks**: Static images for very old devices

## Reduced Motion Support

```swift
// iOS
if UIAccessibility.isReduceMotionEnabled {
    // Show static image instead
}
```

```kotlin
// Android
val reduceMotion = Settings.Global.getFloat(
    contentResolver,
    Settings.Global.ANIMATOR_DURATION_SCALE,
    1f
) == 0f
```

## References

- [Lottie iOS GitHub](https://github.com/airbnb/lottie-ios)
- [Lottie Android GitHub](https://github.com/airbnb/lottie-android)
- [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native)
- [Lottie Flutter Package](https://pub.dev/packages/lottie)
- [LottieFiles - Free Animations](https://lottiefiles.com/)
- [Lottie Documentation](https://airbnb.io/lottie/)
- [After Effects to Lottie Guide](https://airbnb.io/lottie/#/after-effects)
