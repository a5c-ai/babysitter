plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

android {
  namespace = "ai.a5c.amux.wear"
  compileSdk = 35

  defaultConfig {
    applicationId = "ai.a5c.amux.wear"
    minSdk = 30
    targetSdk = 35
    versionCode = 1
    versionName = "0.0.0"
  }

  buildFeatures {
    compose = true
  }

  composeOptions {
    kotlinCompilerExtensionVersion = "1.5.15"
  }

  kotlinOptions {
    jvmTarget = "17"
  }
}

dependencies {
  implementation("androidx.activity:activity-compose:1.10.1")
  implementation("androidx.compose.ui:ui:1.7.6")
  implementation("androidx.wear.compose:compose-material:1.4.1")
  implementation("androidx.wear.compose:compose-navigation:1.4.1")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
}
