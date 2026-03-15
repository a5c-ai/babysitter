---
name: swift-package-manager-config
description: Configure Swift Package Manager with platform-specific dependencies and build settings
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [swift, spm, package, dependencies, apple]
---

# swift-package-manager-config

Configure Swift Package Manager with platform-specific dependencies, targets, and build settings for macOS applications.

## Capabilities

- Generate Package.swift configuration
- Configure platform-specific dependencies
- Set up multiple targets and products
- Configure build settings and flags
- Set up binary targets and XCFrameworks
- Configure plugins and macros
- Generate local package dependencies

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "packageName": { "type": "string" },
    "platforms": { "type": "array", "items": { "enum": ["macos", "ios", "tvos", "watchos"] } },
    "dependencies": { "type": "array" },
    "targets": { "type": "array" }
  },
  "required": ["projectPath", "packageName"]
}
```

## Generated Package.swift

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [
        .library(name: "MyPackage", targets: ["MyPackage"]),
        .executable(name: "MyApp", targets: ["MyApp"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.3.0"),
        .package(url: "https://github.com/apple/swift-collections", from: "1.1.0")
    ],
    targets: [
        .target(name: "MyPackage", dependencies: [
            .product(name: "Collections", package: "swift-collections")
        ]),
        .executableTarget(name: "MyApp", dependencies: [
            "MyPackage",
            .product(name: "ArgumentParser", package: "swift-argument-parser")
        ]),
        .testTarget(name: "MyPackageTests", dependencies: ["MyPackage"])
    ]
)
```

## Related Skills

- `swiftui-view-generator`
- `xctest-ui-test-generator`
