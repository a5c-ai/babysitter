---
name: Kotlin/Jetpack Compose Development
description: Expert skill for native Android development with Kotlin and Jetpack Compose
version: 1.0.0
category: Native Android Development
slug: kotlin-compose
status: active
---

# Kotlin/Jetpack Compose Development Skill

## Overview

This skill provides expert capabilities for native Android development using Kotlin and Jetpack Compose. It enables generation of Compose UI components, implementation of modern Android architecture patterns, and comprehensive Gradle build operations.

## Allowed Tools

- `bash` - Execute Gradle commands, adb, and Android SDK tools
- `read` - Analyze Kotlin source files and Gradle configurations
- `write` - Generate and modify Kotlin code and Compose composables
- `edit` - Update existing Kotlin code and configurations
- `glob` - Search for Kotlin files and Android resources
- `grep` - Search for patterns in Android codebase

## Capabilities

### Jetpack Compose

1. **Composable Functions**
   - Create Material Design 3 composables
   - Implement custom layouts with Layout composable
   - Build reusable UI components
   - Generate preview annotations
   - Create multi-preview configurations

2. **State Management**
   - Implement remember and rememberSaveable
   - Use state hoisting patterns
   - Configure derivedStateOf for computed state
   - Implement snapshotFlow for side effects
   - Handle configuration changes

3. **Navigation**
   - Configure Compose Navigation with NavHost
   - Implement type-safe navigation with arguments
   - Set up nested navigation graphs
   - Handle deep links with NavDeepLink
   - Implement bottom navigation with BottomNavigation

### ViewModel Integration

4. **ViewModel Patterns**
   - Create ViewModels with Hilt injection
   - Implement StateFlow and SharedFlow
   - Configure SavedStateHandle
   - Handle process death recovery
   - Use viewModelScope for coroutines

5. **UI State Management**
   - Design sealed class UI states
   - Implement loading, error, and success states
   - Configure pull-to-refresh
   - Handle pagination with Paging 3
   - Implement search with debouncing

### Kotlin Coroutines

6. **Coroutine Patterns**
   - Configure CoroutineScope and dispatchers
   - Implement structured concurrency
   - Handle cancellation properly
   - Use SupervisorJob for error isolation
   - Configure ExceptionHandler

7. **Flow Patterns**
   - Create cold and hot Flows
   - Implement StateFlow and SharedFlow
   - Configure Flow operators
   - Handle backpressure with buffer
   - Transform Flows with map, filter, combine

### Dependency Injection

8. **Hilt Integration**
   - Configure Hilt modules
   - Implement @Inject annotations
   - Set up ViewModelComponent
   - Configure Singleton and Scoped bindings
   - Use @EntryPoint for framework classes

### Gradle Build System

9. **Build Configuration**
   - Configure build.gradle.kts with Kotlin DSL
   - Set up build variants and flavors
   - Configure ProGuard/R8 rules
   - Implement version catalogs
   - Set up composite builds

10. **KSP/KAPT**
    - Configure Kotlin Symbol Processing
    - Set up Room with KSP
    - Configure Hilt with KAPT
    - Generate code with custom processors

### Testing

11. **Testing Frameworks**
    - Write JUnit 5 unit tests
    - Implement Compose UI tests
    - Configure test rules and fixtures
    - Mock dependencies with MockK
    - Set up Robolectric for JVM tests

## Target Processes

This skill integrates with the following processes:

- `jetpack-compose-ui.js` - Compose UI development
- `android-room-database.js` - Room persistence
- `firebase-cloud-messaging.js` - FCM integration
- `android-playstore-publishing.js` - Play Store submission

## Dependencies

### Required

- Android Studio Hedgehog or later
- Android SDK 34+
- Kotlin 1.9+
- Gradle 8.2+

### Optional

- Android Emulator
- Firebase tools
- adb (Android Debug Bridge)
- Layout Inspector

## Configuration

### Project Structure

```
app/
├── src/
│   ├── main/
│   │   ├── kotlin/com/example/myapp/
│   │   │   ├── MyApplication.kt
│   │   │   ├── MainActivity.kt
│   │   │   ├── di/
│   │   │   │   └── AppModule.kt
│   │   │   ├── data/
│   │   │   │   ├── repository/
│   │   │   │   ├── local/
│   │   │   │   └── remote/
│   │   │   ├── domain/
│   │   │   │   ├── model/
│   │   │   │   ├── repository/
│   │   │   │   └── usecase/
│   │   │   └── ui/
│   │   │       ├── theme/
│   │   │       ├── navigation/
│   │   │       └── feature/
│   │   ├── res/
│   │   └── AndroidManifest.xml
│   ├── test/
│   └── androidTest/
├── build.gradle.kts
└── proguard-rules.pro
```

### Version Catalog

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "1.9.21"
compose-bom = "2024.01.00"
hilt = "2.50"
room = "2.6.1"
lifecycle = "2.7.0"

[libraries]
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui = { group = "androidx.compose.ui", name = "ui" }
compose-material3 = { group = "androidx.compose.material3", name = "material3" }
compose-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

[plugins]
android-application = { id = "com.android.application", version = "8.2.0" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version = "1.9.21-1.0.16" }
```

## Usage Examples

### Create Composable Screen

```kotlin
// ui/feature/home/HomeScreen.kt
package com.example.myapp.ui.feature.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onItemClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Home") }
            )
        }
    ) { paddingValues ->
        when (val state = uiState) {
            is HomeUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is HomeUiState.Success -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.items, key = { it.id }) { item ->
                        ItemCard(
                            item = item,
                            onClick = { onItemClick(item.id) }
                        )
                    }
                }
            }
            is HomeUiState.Error -> {
                ErrorContent(
                    message = state.message,
                    onRetry = viewModel::retry,
                    modifier = Modifier.padding(paddingValues)
                )
            }
        }
    }
}

@Composable
private fun ItemCard(
    item: Item,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = item.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

### Implement ViewModel

```kotlin
// ui/feature/home/HomeViewModel.kt
package com.example.myapp.ui.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getItemsUseCase: GetItemsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadItems()
    }

    private fun loadItems() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading

            getItemsUseCase()
                .catch { e ->
                    _uiState.value = HomeUiState.Error(e.message ?: "Unknown error")
                }
                .collect { items ->
                    _uiState.value = HomeUiState.Success(items)
                }
        }
    }

    fun retry() {
        loadItems()
    }
}

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val items: List<Item>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}
```

### Configure Navigation

```kotlin
// ui/navigation/NavGraph.kt
package com.example.myapp.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.myapp.ui.feature.home.HomeScreen
import com.example.myapp.ui.feature.detail.DetailScreen

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Detail : Screen("detail/{itemId}") {
        fun createRoute(itemId: String) = "detail/$itemId"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Home.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onItemClick = { itemId ->
                    navController.navigate(Screen.Detail.createRoute(itemId))
                }
            )
        }

        composable(
            route = Screen.Detail.route,
            arguments = listOf(
                navArgument("itemId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId") ?: return@composable
            DetailScreen(
                itemId = itemId,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
```

### Configure Hilt Module

```kotlin
// di/AppModule.kt
package com.example.myapp.di

import android.content.Context
import androidx.room.Room
import com.example.myapp.data.local.AppDatabase
import com.example.myapp.data.remote.ApiService
import com.example.myapp.data.repository.ItemRepositoryImpl
import com.example.myapp.domain.repository.ItemRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindItemRepository(impl: ItemRepositoryImpl): ItemRepository
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        ).build()
    }

    @Provides
    fun provideItemDao(database: AppDatabase) = database.itemDao()
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.example.com/")
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
```

### Build Commands

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release AAB
./gradlew bundleRelease

# Run unit tests
./gradlew testDebugUnitTest

# Run instrumented tests
./gradlew connectedDebugAndroidTest

# Run lint
./gradlew lintDebug

# Install on device
./gradlew installDebug
```

## Quality Gates

### Code Quality

- Kotlin compiler warnings treated as errors
- Detekt/ktlint compliance
- No deprecated API usage
- Proper coroutine scope management

### Performance Benchmarks

- App startup < 500ms (cold start)
- 60fps during scrolling and animations
- No memory leaks (LeakCanary verification)
- Minimized recompositions

### Test Coverage

- Unit test coverage > 80%
- UI test coverage for critical flows
- Screenshot tests for UI components

## Error Handling

### Common Issues

1. **Gradle sync failures**
   ```bash
   ./gradlew --refresh-dependencies
   ```

2. **KSP/KAPT issues**
   ```bash
   ./gradlew clean && ./gradlew kspDebugKotlin
   ```

3. **Emulator issues**
   ```bash
   adb kill-server && adb start-server
   ```

4. **Compose preview issues**
   ```bash
   # Invalidate caches: File > Invalidate Caches / Restart
   ```

## Related Skills

- `android-room` - Room database integration
- `firebase-mobile` - Firebase services
- `mobile-testing` - Comprehensive testing
- `google-play-console` - Play Store publishing

## Version History

- 1.0.0 - Initial release with core Kotlin/Compose capabilities
