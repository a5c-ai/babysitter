---
name: qt-cmake-project-generator
description: Generate CMake-based Qt project with proper module dependencies, cross-compilation support, and modern Qt6 configuration
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [qt, cmake, cpp, cross-platform, build]
---

# qt-cmake-project-generator

Generate CMake-based Qt project configurations with proper module dependencies and cross-compilation support. This skill handles Qt6 CMake integration, module discovery, and platform-specific build configurations.

## Capabilities

- Generate modern CMake configuration for Qt6 projects
- Configure Qt module dependencies (Core, Widgets, Quick, Network, etc.)
- Set up cross-compilation toolchains
- Configure vcpkg/Conan package management integration
- Generate platform-specific build configurations
- Set up Qt deployment scripts (windeployqt, macdeployqt)
- Configure static vs dynamic linking
- Generate CMake presets for development and CI

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to create/update the Qt project"
    },
    "projectName": {
      "type": "string",
      "description": "Project name"
    },
    "qtVersion": {
      "type": "string",
      "default": "6.6",
      "description": "Target Qt version"
    },
    "qtModules": {
      "type": "array",
      "items": {
        "enum": ["Core", "Gui", "Widgets", "Quick", "Qml", "Network", "Sql", "Multimedia", "WebEngine", "Charts", "3D"]
      },
      "default": ["Core", "Gui", "Widgets"]
    },
    "appType": {
      "enum": ["widgets", "quick", "console", "library"],
      "default": "widgets"
    },
    "targetPlatforms": {
      "type": "array",
      "items": { "enum": ["windows", "macos", "linux", "android", "ios", "wasm"] }
    },
    "packageManager": {
      "enum": ["none", "vcpkg", "conan"],
      "default": "none"
    },
    "cppStandard": {
      "enum": ["17", "20", "23"],
      "default": "17"
    },
    "generatePresets": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath", "projectName"]
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
          "description": { "type": "string" }
        }
      }
    },
    "buildCommands": {
      "type": "object",
      "properties": {
        "configure": { "type": "string" },
        "build": { "type": "string" },
        "install": { "type": "string" }
      }
    },
    "warnings": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["success"]
}
```

## Generated CMakeLists.txt Example

```cmake
cmake_minimum_required(VERSION 3.21)
project(MyQtApp VERSION 1.0.0 LANGUAGES CXX)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Qt Configuration
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt packages
find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets)

# Source files
set(SOURCES
    src/main.cpp
    src/mainwindow.cpp
    src/mainwindow.h
    src/mainwindow.ui
)

# Resources
set(RESOURCES
    resources/resources.qrc
)

# Create executable
qt_add_executable(${PROJECT_NAME}
    ${SOURCES}
    ${RESOURCES}
)

# Link Qt libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
)

# Platform-specific settings
if(WIN32)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
elseif(APPLE)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE TRUE
        MACOSX_BUNDLE_INFO_PLIST "${CMAKE_SOURCE_DIR}/platform/macos/Info.plist"
    )
endif()

# Installation
install(TARGETS ${PROJECT_NAME}
    BUNDLE DESTINATION .
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

# Qt deployment
qt_generate_deploy_app_script(
    TARGET ${PROJECT_NAME}
    OUTPUT_SCRIPT deploy_script
    NO_UNSUPPORTED_PLATFORM_ERROR
)
install(SCRIPT ${deploy_script})
```

## CMake Presets

```json
{
  "version": 6,
  "configurePresets": [
    {
      "name": "default",
      "displayName": "Default",
      "binaryDir": "${sourceDir}/build/${presetName}",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug"
      }
    },
    {
      "name": "release",
      "inherits": "default",
      "displayName": "Release",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Release"
      }
    },
    {
      "name": "windows-msvc",
      "inherits": "default",
      "displayName": "Windows MSVC",
      "generator": "Visual Studio 17 2022",
      "architecture": "x64",
      "condition": {
        "type": "equals",
        "lhs": "${hostSystemName}",
        "rhs": "Windows"
      }
    },
    {
      "name": "macos",
      "inherits": "default",
      "displayName": "macOS",
      "generator": "Ninja",
      "cacheVariables": {
        "CMAKE_OSX_ARCHITECTURES": "x86_64;arm64"
      },
      "condition": {
        "type": "equals",
        "lhs": "${hostSystemName}",
        "rhs": "Darwin"
      }
    },
    {
      "name": "linux",
      "inherits": "default",
      "displayName": "Linux",
      "generator": "Ninja",
      "condition": {
        "type": "equals",
        "lhs": "${hostSystemName}",
        "rhs": "Linux"
      }
    }
  ],
  "buildPresets": [
    {
      "name": "default",
      "configurePreset": "default"
    },
    {
      "name": "release",
      "configurePreset": "release"
    }
  ]
}
```

## Cross-Compilation Toolchain

```cmake
# toolchain-linux-aarch64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)

set(CMAKE_SYSROOT /opt/sysroots/aarch64-linux-gnu)
set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

## Package Manager Integration

### vcpkg

```cmake
# CMakeLists.txt
if(DEFINED ENV{VCPKG_ROOT})
    set(CMAKE_TOOLCHAIN_FILE "$ENV{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake")
endif()
```

### Conan

```python
# conanfile.py
from conan import ConanFile
from conan.tools.cmake import cmake_layout

class MyQtAppConan(ConanFile):
    settings = "os", "compiler", "build_type", "arch"
    generators = "CMakeToolchain", "CMakeDeps"

    def requirements(self):
        self.requires("qt/6.6.0")

    def layout(self):
        cmake_layout(self)
```

## Best Practices

1. **Use qt_add_executable**: Preferred over add_executable for Qt6
2. **Enable AUTOMOC/AUTOUIC/AUTORCC**: Automatic meta-object compilation
3. **Use CMake Presets**: Simplify configuration for different environments
4. **Version your Qt requirement**: `find_package(Qt6 6.4 REQUIRED ...)`
5. **Use modern CMake**: target_* commands over global settings
6. **Generate deploy scripts**: Use Qt's deployment tools

## Related Skills

- `qt-qml-component-generator` - QML component creation
- `qt-installer-framework-config` - Installer configuration
- `qt-test-fixture-generator` - Test setup

## Related Agents

- `qt-cpp-specialist` - Qt/C++ expertise
- `desktop-ci-architect` - CI/CD for Qt projects
