---
name: Flutter/Dart Development
description: Specialized skill for Flutter app development and Dart programming
version: 1.0.0
category: Cross-Platform Development
slug: flutter-dart
status: active
---

# Flutter/Dart Development Skill

## Overview

This skill provides specialized capabilities for Flutter app development and Dart programming. It enables execution of Flutter CLI commands, widget generation, state management configuration, and comprehensive debugging with Flutter DevTools.

## Allowed Tools

- `bash` - Execute Flutter CLI, Dart commands, and pub operations
- `read` - Analyze Flutter project files, widgets, and configurations
- `write` - Generate and modify Dart code and Flutter configurations
- `edit` - Update existing Flutter widgets and configurations
- `glob` - Search for Dart files and Flutter assets
- `grep` - Search for patterns in Flutter codebase

## Capabilities

### Core Development

1. **Flutter CLI Operations**
   - Create new Flutter projects with templates
   - Run Flutter apps on devices and emulators
   - Build release APK, AAB, and IPA files
   - Execute Flutter analyze for linting
   - Run Flutter doctor for environment diagnostics

2. **Dart Language Features**
   - Generate null-safe Dart code
   - Implement async/await patterns with Futures
   - Create Dart classes with factory constructors
   - Use extension methods effectively
   - Implement sealed classes and pattern matching

3. **Widget Development**
   - Create custom StatelessWidget and StatefulWidget
   - Implement InheritedWidget for dependency injection
   - Build CustomPainter for custom graphics
   - Create responsive layouts with LayoutBuilder
   - Implement animations with AnimationController

### State Management

4. **BLoC Pattern**
   - Generate BLoC classes with events and states
   - Configure flutter_bloc with BlocProvider
   - Implement Cubit for simpler state management
   - Set up BlocObserver for debugging
   - Handle state persistence with hydrated_bloc

5. **Provider Pattern**
   - Configure ChangeNotifierProvider
   - Implement Consumer and Selector widgets
   - Set up MultiProvider for multiple states
   - Use ProxyProvider for dependent providers

6. **Riverpod**
   - Configure ProviderScope and ProviderContainer
   - Implement StateNotifier and StateNotifierProvider
   - Create AsyncNotifier for async operations
   - Use Riverpod code generation

### Navigation

7. **GoRouter**
   - Configure declarative routing
   - Implement deep linking with path parameters
   - Set up redirect guards for authentication
   - Handle nested navigation with ShellRoute
   - Implement type-safe routing with code generation

8. **AutoRoute**
   - Generate route configurations
   - Implement nested routers
   - Configure route guards
   - Handle path parameters and query strings

### Code Generation

9. **Build Runner**
   - Configure Freezed for immutable classes
   - Set up JsonSerializable for JSON parsing
   - Implement Hive type adapters
   - Generate mock classes with Mockito
   - Use built_value for value types

### Testing

10. **Testing Frameworks**
    - Configure unit tests with test package
    - Implement widget tests with flutter_test
    - Set up integration tests
    - Use golden tests for UI verification
    - Mock dependencies with Mockito

### Performance

11. **Performance Optimization**
    - Implement const constructors
    - Use RepaintBoundary effectively
    - Configure image caching
    - Implement lazy loading with ListView.builder
    - Profile with Flutter DevTools

## Target Processes

This skill integrates with the following processes:

- `flutter-app-scaffolding.js` - Project setup and configuration
- `cross-platform-ui-library.js` - Shared widget development
- `mobile-testing-strategy.js` - Test implementation
- `mobile-performance-optimization.js` - Performance tuning

## Dependencies

### Required

- Flutter SDK 3.16+
- Dart SDK 3.2+
- Android Studio or VS Code with Flutter extension

### Optional

- Android SDK (for Android development)
- Xcode (for iOS development, macOS only)
- Chrome (for web development)
- Flutter DevTools

## Configuration

### Project Structure

```
project-root/
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── app.dart
│   │   └── router.dart
│   ├── features/
│   │   └── feature_name/
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   ├── core/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── extensions/
│   │   └── utils/
│   └── shared/
│       └── widgets/
├── test/
├── integration_test/
├── assets/
├── pubspec.yaml
└── analysis_options.yaml
```

### Analysis Options

```yaml
# analysis_options.yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_const_declarations: true
    avoid_print: true
    prefer_single_quotes: true
    require_trailing_commas: true

analyzer:
  errors:
    invalid_annotation_target: ignore
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
```

## Usage Examples

### Initialize Project

```bash
# Create new Flutter project
flutter create --org com.example my_app

# Create with specific platforms
flutter create --platforms android,ios,web my_app

# Add dependencies
flutter pub add flutter_bloc equatable
flutter pub add --dev build_runner freezed freezed_annotation
```

### Generate Widget

```dart
// lib/features/home/presentation/widgets/custom_card.dart
import 'package:flutter/material.dart';

class CustomCard extends StatelessWidget {
  const CustomCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### Configure BLoC

```dart
// lib/features/auth/presentation/bloc/auth_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc({required this.authRepository}) : super(const AuthInitial()) {
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  final AuthRepository authRepository;

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final user = await authRepository.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthAuthenticated(user: user));
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await authRepository.logout();
    emit(const AuthUnauthenticated());
  }
}
```

### Configure GoRouter

```dart
// lib/app/router.dart
import 'package:go_router/go_router.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'details/:id',
          name: 'details',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return DetailsScreen(id: id);
          },
        ),
      ],
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
  ],
  redirect: (context, state) {
    final isAuthenticated = authProvider.isAuthenticated;
    final isLoggingIn = state.matchedLocation == '/login';

    if (!isAuthenticated && !isLoggingIn) {
      return '/login';
    }
    if (isAuthenticated && isLoggingIn) {
      return '/';
    }
    return null;
  },
);
```

### Generate Freezed Model

```dart
// lib/features/user/domain/entities/user.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class User with _$User {
  const factory User({
    required String id,
    required String email,
    required String name,
    String? avatarUrl,
    @Default(false) bool isVerified,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

## Quality Gates

### Code Quality

- Dart analyzer with zero issues
- flutter_lints compliance
- Proper null safety usage
- No implicit dynamic types

### Performance Benchmarks

- App launch time < 2 seconds
- 60fps during animations and scrolling
- Widget rebuild minimization
- Optimized asset loading

### Test Coverage

- Unit test coverage > 80%
- Widget test coverage > 70%
- Integration tests for critical flows

## Error Handling

### Common Issues

1. **Pub get failures**
   ```bash
   flutter clean && flutter pub get
   ```

2. **Build runner conflicts**
   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

3. **iOS CocoaPods issues**
   ```bash
   cd ios && pod install --repo-update && cd ..
   ```

4. **Gradle sync failures**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

## Related Skills

- `react-native-dev` - Alternative cross-platform framework
- `mobile-testing` - Comprehensive testing frameworks
- `mobile-perf` - Performance profiling and optimization
- `kotlin-compose` - Native Android development

## Version History

- 1.0.0 - Initial release with core Flutter/Dart capabilities
