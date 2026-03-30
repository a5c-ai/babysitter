---
name: tauri-project-setup
description: Initialize Tauri project with Rust backend and frontend framework integration
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [tauri, rust, cross-platform, webview, desktop]
---

# tauri-project-setup

Initialize Tauri project with Rust backend and frontend framework integration. This skill sets up secure, lightweight desktop applications using web technologies.

## Capabilities

- Initialize Tauri project structure
- Configure Rust backend with commands
- Integrate React, Vue, Svelte, or SolidJS
- Set up tauri.conf.json configuration
- Configure window settings
- Set up auto-update
- Configure build for all platforms
- Set up plugin system

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "projectName": { "type": "string" },
    "frontend": { "enum": ["react", "vue", "svelte", "solid", "vanilla"] },
    "features": { "type": "array" }
  },
  "required": ["projectPath", "projectName"]
}
```

## Generated Structure

```
my-tauri-app/
├── src/            # Frontend
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   └── icons/
└── package.json
```

## Rust Command Example

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

## Related Skills

- `electron-builder-config`
- `cross-platform-test-matrix`
