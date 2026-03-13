---
name: React Native Development
description: Deep integration with React Native ecosystem for cross-platform mobile development
version: 1.0.0
category: Cross-Platform Development
slug: react-native-dev
status: active
---

# React Native Development Skill

## Overview

This skill provides deep integration with the React Native ecosystem for cross-platform mobile development. It enables execution of React Native CLI commands, component generation, build optimization, and comprehensive debugging capabilities.

## Allowed Tools

- `bash` - Execute React Native CLI, Expo CLI, and npm/yarn commands
- `read` - Analyze React Native project files, configurations, and components
- `write` - Generate and modify React Native components and configurations
- `edit` - Update existing React Native code and configurations
- `glob` - Search for React Native components and configuration files
- `grep` - Search for patterns in React Native codebase

## Capabilities

### Core Development

1. **React Native CLI Operations**
   - Initialize new React Native projects
   - Run Metro bundler with custom configurations
   - Execute platform-specific builds (iOS/Android)
   - Link native dependencies
   - Generate native code bridges

2. **Expo CLI Operations**
   - Create and manage Expo projects
   - Configure EAS Build and EAS Submit
   - Manage Expo config plugins
   - Handle over-the-air updates
   - Prebuild for bare workflow ejection

3. **Component Generation**
   - Generate TypeScript-based functional components
   - Create custom hooks with proper typing
   - Implement React Navigation screens and navigators
   - Build reusable UI component libraries
   - Generate Storybook stories for components

### State Management

4. **Redux Toolkit Integration**
   - Generate Redux slices with createSlice
   - Configure RTK Query for API caching
   - Implement async thunks with proper typing
   - Set up Redux DevTools integration
   - Create selectors with createSelector

5. **Zustand/Jotai/Recoil**
   - Configure lightweight state stores
   - Implement atomic state patterns
   - Set up persistence middleware
   - Create derived state computations

### Navigation

6. **React Navigation**
   - Configure Stack, Tab, and Drawer navigators
   - Implement type-safe navigation with TypeScript
   - Set up deep linking configurations
   - Handle authentication flows
   - Implement nested navigation patterns

### Performance

7. **Performance Optimization**
   - Configure Hermes JavaScript engine
   - Implement FlatList/FlashList optimizations
   - Set up React Native Performance monitoring
   - Analyze and fix re-render issues
   - Implement lazy loading and code splitting

8. **Native Module Integration**
   - Configure TurboModules and JSI
   - Bridge native code (Objective-C/Swift/Java/Kotlin)
   - Set up Codegen for native modules
   - Debug native crashes and issues

### Testing

9. **Testing Configuration**
   - Configure Jest with React Native preset
   - Set up React Native Testing Library
   - Implement component snapshot testing
   - Configure Detox for E2E testing
   - Mock native modules effectively

### Debugging

10. **Debug Tools**
    - Configure Flipper plugins
    - Set up Reactotron integration
    - Use React DevTools for component inspection
    - Debug network requests
    - Profile JavaScript performance

## Target Processes

This skill integrates with the following processes:

- `react-native-app-setup.js` - Project initialization and configuration
- `cross-platform-ui-library.js` - Shared component development
- `mobile-testing-strategy.js` - Test implementation and coverage
- `mobile-performance-optimization.js` - Performance tuning

## Dependencies

### Required

- Node.js 18+
- npm or yarn package manager
- React Native CLI (`npx react-native`)
- Watchman (macOS)

### Optional

- Expo CLI (`npx expo`)
- Android Studio with Android SDK
- Xcode (macOS only)
- Flipper
- Reactotron

## Configuration

### Project Structure

```
project-root/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── store/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   └── types/
├── __tests__/
├── android/
├── ios/
├── metro.config.js
├── babel.config.js
├── tsconfig.json
└── package.json
```

### Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

## Usage Examples

### Initialize Project

```bash
# Create new React Native project
npx react-native init MyApp --template react-native-template-typescript

# Or with Expo
npx create-expo-app MyApp --template expo-template-blank-typescript
```

### Generate Component

```typescript
// src/components/Button/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#007AFF',
  },
});
```

### Configure Navigation

```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { DetailsScreen } from '../screens/DetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### Configure Redux Store

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Quality Gates

### Code Quality

- TypeScript strict mode enabled
- ESLint with React Native config
- Prettier for code formatting
- No any types in production code

### Performance Benchmarks

- App launch time < 2 seconds
- FPS maintained at 60fps during scrolling
- Memory usage within platform limits
- Bundle size optimized with tree shaking

### Test Coverage

- Unit test coverage > 80%
- Component test coverage > 70%
- E2E critical paths covered

## Error Handling

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS pod installation failures**
   ```bash
   cd ios && pod install --repo-update
   ```

3. **Android Gradle sync issues**
   ```bash
   cd android && ./gradlew clean
   ```

4. **Native module linking issues**
   ```bash
   npx react-native link
   # Or for newer versions, use autolinking
   ```

## Related Skills

- `flutter-dart` - Alternative cross-platform framework
- `mobile-testing` - Comprehensive testing frameworks
- `mobile-perf` - Performance profiling and optimization
- `push-notifications` - Push notification implementation

## Version History

- 1.0.0 - Initial release with core React Native capabilities
