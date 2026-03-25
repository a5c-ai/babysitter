---
name: lottie-animations
description: Lottie animation skill for integrating After Effects animations into iOS, Android, and cross-platform mobile apps with playback control, performance optimization, and interactive animation capabilities.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Lottie Animations Skill

Comprehensive Lottie animation integration for mobile platforms, enabling high-quality vector animations from After Effects in iOS, Android, React Native, and Flutter applications.

## Overview

This skill provides capabilities for integrating Lottie animations into mobile applications, including animation playback control, performance optimization, interactive animations, and proper asset management across platforms.

## Capabilities

### Animation Integration
- Import and validate Lottie JSON files
- Configure lottie-ios for native iOS apps
- Set up lottie-android for native Android apps
- Integrate lottie-react-native for React Native
- Configure lottie for Flutter apps

### Playback Control
- Implement play, pause, stop controls
- Configure animation speed and direction
- Set up loop modes (none, loop, autoReverse)
- Implement progress-based playback
- Handle animation completion callbacks

### Interactive Animations
- Implement gesture-driven animations
- Configure animation markers/segments
- Sync animations with scroll position
- Implement drag-based animation control
- Handle touch interaction with animation

### Performance Optimization
- Optimize animation file size
- Configure rendering modes (software/hardware)
- Implement animation caching
- Handle memory management
- Preload animations for smooth playback

### Asset Management
- Organize animation assets
- Configure dynamic text replacement
- Handle color theming
- Manage animation versioning
- Implement asset preloading

## Prerequisites

### iOS Development
```ruby
# Podfile
pod 'lottie-ios'

# Or Swift Package Manager
# https://github.com/airbnb/lottie-ios.git
```

### Android Development
```groovy
// build.gradle
dependencies {
    implementation 'com.airbnb.android:lottie:6.3.0'
}
```

### React Native
```bash
npm install lottie-react-native
# or
yarn add lottie-react-native

# iOS pods
cd ios && pod install
```

### Flutter
```yaml
# pubspec.yaml
dependencies:
  lottie: ^3.0.0
```

## Usage Patterns

### iOS (SwiftUI)
```swift
import SwiftUI
import Lottie

struct LottieView: UIViewRepresentable {
    let animationName: String
    let loopMode: LottieLoopMode
    let animationSpeed: CGFloat
    @Binding var isPlaying: Bool

    func makeUIView(context: Context) -> LottieAnimationView {
        let animationView = LottieAnimationView(name: animationName)
        animationView.contentMode = .scaleAspectFit
        animationView.loopMode = loopMode
        animationView.animationSpeed = animationSpeed
        return animationView
    }

    func updateUIView(_ animationView: LottieAnimationView, context: Context) {
        if isPlaying {
            animationView.play()
        } else {
            animationView.pause()
        }
    }
}

// Usage
struct ContentView: View {
    @State private var isPlaying = true

    var body: some View {
        VStack {
            LottieView(
                animationName: "loading",
                loopMode: .loop,
                animationSpeed: 1.0,
                isPlaying: $isPlaying
            )
            .frame(width: 200, height: 200)

            Button(isPlaying ? "Pause" : "Play") {
                isPlaying.toggle()
            }
        }
    }
}
```

### iOS (UIKit)
```swift
import Lottie

class AnimationViewController: UIViewController {
    private var animationView: LottieAnimationView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupAnimation()
    }

    private func setupAnimation() {
        animationView = LottieAnimationView(name: "success")
        animationView.frame = CGRect(x: 0, y: 0, width: 200, height: 200)
        animationView.center = view.center
        animationView.contentMode = .scaleAspectFit
        animationView.loopMode = .playOnce
        view.addSubview(animationView)
    }

    func playAnimation() {
        animationView.play { completed in
            if completed {
                print("Animation completed")
            }
        }
    }

    func playSegment(from: CGFloat, to: CGFloat) {
        animationView.play(fromProgress: from, toProgress: to, loopMode: .playOnce)
    }

    func setProgress(_ progress: CGFloat) {
        animationView.currentProgress = progress
    }
}
```

### Android (Kotlin - Jetpack Compose)
```kotlin
import com.airbnb.lottie.compose.*

@Composable
fun LottieAnimationScreen() {
    val composition by rememberLottieComposition(
        LottieCompositionSpec.RawRes(R.raw.loading)
    )
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = LottieConstants.IterateForever
    )

    LottieAnimation(
        composition = composition,
        progress = { progress },
        modifier = Modifier.size(200.dp)
    )
}

// Controllable animation
@Composable
fun ControllableLottieAnimation() {
    val composition by rememberLottieComposition(
        LottieCompositionSpec.RawRes(R.raw.success)
    )
    var isPlaying by remember { mutableStateOf(false) }
    val progress by animateLottieCompositionAsState(
        composition = composition,
        isPlaying = isPlaying,
        restartOnPlay = true
    )

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        LottieAnimation(
            composition = composition,
            progress = { progress },
            modifier = Modifier.size(200.dp)
        )

        Button(onClick = { isPlaying = true }) {
            Text("Play")
        }
    }
}

// Progress-based animation
@Composable
fun ScrollSyncedAnimation(scrollProgress: Float) {
    val composition by rememberLottieComposition(
        LottieCompositionSpec.RawRes(R.raw.scroll_animation)
    )

    LottieAnimation(
        composition = composition,
        progress = { scrollProgress },
        modifier = Modifier.fillMaxWidth()
    )
}
```

### Android (XML Views)
```kotlin
import com.airbnb.lottie.LottieAnimationView
import com.airbnb.lottie.LottieDrawable

class AnimationActivity : AppCompatActivity() {
    private lateinit var animationView: LottieAnimationView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_animation)

        animationView = findViewById(R.id.animation_view)
        setupAnimation()
    }

    private fun setupAnimation() {
        animationView.apply {
            setAnimation(R.raw.loading)
            repeatCount = LottieDrawable.INFINITE
            speed = 1.0f
        }
    }

    fun playAnimation() {
        animationView.playAnimation()
    }

    fun pauseAnimation() {
        animationView.pauseAnimation()
    }

    fun setProgress(progress: Float) {
        animationView.progress = progress
    }

    fun playSegment(startFrame: Int, endFrame: Int) {
        animationView.setMinAndMaxFrame(startFrame, endFrame)
        animationView.playAnimation()
    }
}
```

### React Native
```javascript
import React, { useRef, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const AnimationScreen = () => {
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAnimation = () => {
    animationRef.current?.play();
    setIsPlaying(true);
  };

  const pauseAnimation = () => {
    animationRef.current?.pause();
    setIsPlaying(false);
  };

  const resetAnimation = () => {
    animationRef.current?.reset();
    setIsPlaying(false);
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('./animations/success.json')}
        style={styles.animation}
        autoPlay={false}
        loop={false}
        onAnimationFinish={() => setIsPlaying(false)}
      />

      <View style={styles.controls}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={isPlaying ? pauseAnimation : playAnimation}
        />
        <Button title="Reset" onPress={resetAnimation} />
      </View>
    </View>
  );
};

// Progress-controlled animation
const ScrollAnimation = ({ scrollProgress }) => {
  return (
    <LottieView
      source={require('./animations/scroll-animation.json')}
      progress={scrollProgress}
      style={styles.animation}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 20,
  },
});

export default AnimationScreen;
```

### Flutter
```dart
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

class AnimationScreen extends StatefulWidget {
  @override
  _AnimationScreenState createState() => _AnimationScreenState();
}

class _AnimationScreenState extends State<AnimationScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Lottie.asset(
              'assets/animations/success.json',
              controller: _controller,
              width: 200,
              height: 200,
              onLoaded: (composition) {
                _controller.duration = composition.duration;
              },
            ),
            SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () => _controller.forward(),
                  child: Text('Play'),
                ),
                SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () => _controller.stop(),
                  child: Text('Stop'),
                ),
                SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () => _controller.reset(),
                  child: Text('Reset'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Looping animation
class LoadingAnimation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Lottie.asset(
      'assets/animations/loading.json',
      width: 100,
      height: 100,
      repeat: true,
    );
  }
}

// Network animation
class NetworkAnimation extends StatelessWidget {
  final String url;

  const NetworkAnimation({required this.url});

  @override
  Widget build(BuildContext context) {
    return Lottie.network(
      url,
      width: 200,
      height: 200,
      frameRate: FrameRate.max,
    );
  }
}
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const lottieIntegrationTask = defineTask({
  name: 'lottie-animation-setup',
  description: 'Integrate Lottie animations into mobile app',

  inputs: {
    platform: { type: 'string', required: true, enum: ['ios', 'android', 'react-native', 'flutter'] },
    projectPath: { type: 'string', required: true },
    animationFiles: { type: 'array', items: { type: 'string' } },
    features: {
      type: 'array',
      items: { type: 'string', enum: ['playback_control', 'progress_sync', 'gestures', 'theming'] }
    }
  },

  outputs: {
    integratedAnimations: { type: 'array' },
    componentCode: { type: 'string' },
    optimizationReport: { type: 'object' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Integrate Lottie for ${inputs.platform}`,
      skill: {
        name: 'lottie-animations',
        context: {
          operation: 'integrate',
          platform: inputs.platform,
          projectPath: inputs.projectPath,
          animations: inputs.animationFiles,
          features: inputs.features
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Animation Optimization

### File Size Optimization
```bash
# Use LottieFiles optimizer
npx @nicolo-ribaudo/lottie-optimize animation.json -o optimized.json

# Or use online tools:
# https://lottiefiles.com/tools/lottie-optimizer
```

### Performance Tips
1. **Reduce complexity**: Simplify paths and shapes in After Effects
2. **Limit layers**: Fewer layers = better performance
3. **Avoid masks**: Use shape layers instead when possible
4. **Cache compositions**: Reuse loaded animations
5. **Use hardware acceleration**: Enable when available
6. **Preload animations**: Load before display needed

### Memory Management
```swift
// iOS - Clear cache when needed
LottieAnimationView.clearCache()

// Load from cache
let animation = LottieAnimation.named("loading", animationCache: LRUAnimationCache.sharedCache)
```

```kotlin
// Android - Configure cache
val cacheComposition = LottieCompositionFactory
    .fromRawRes(context, R.raw.animation)
    .addListener { composition ->
        // Animation loaded
    }
```

## Best Practices

1. **Optimize Before Integration**: Use LottieFiles optimizer
2. **Lazy Load**: Load animations only when needed
3. **Cache Animations**: Reuse loaded compositions
4. **Handle Errors**: Gracefully handle loading failures
5. **Test Performance**: Profile on low-end devices
6. **Accessibility**: Provide alternatives for motion-sensitive users

## References

- [Lottie for iOS](https://github.com/airbnb/lottie-ios)
- [Lottie for Android](https://github.com/airbnb/lottie-android)
- [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native)
- [Lottie for Flutter](https://pub.dev/packages/lottie)
- [LottieFiles](https://lottiefiles.com/)
- [Lottie Documentation](https://airbnb.io/lottie/)
