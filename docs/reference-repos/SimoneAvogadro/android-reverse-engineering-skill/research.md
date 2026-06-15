# SimoneAvogadro/android-reverse-engineering-skill

- **Archetype**: domain-skill-pack
- **Stars**: 1,500
- **Last pushed**: 2026-03-02
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Source**: gh-search

## Summary

Claude Code plugin for Android app reverse engineering. Decompiles APK/XAPK/JAR/AAR files using jadx and Fernflower/Vineflower, then extracts HTTP API endpoints (Retrofit, OkHttp, Volley), traces call flows from UI layer through ViewModels/repositories to network layer, and produces structured API documentation. Already packaged as a Claude Code plugin with marketplace.json, plugin.json, scripts, and reference docs.

## Assessment

Well-structured 5-phase reverse engineering workflow with clear phase boundaries, multiple decompiler engine support, and detailed reference documentation. The workflow is deterministic and phases map directly to babysitter process steps. The dependency management phase (check -> install -> verify) is a reusable pattern. The dual-engine comparison strategy (jadx vs Fernflower, use both when one produces warnings) encodes real domain expertise.

Already structured as a Claude Code plugin -- could potentially be adapted into a babysitter marketplace plugin with minimal restructuring.

## Extraction Priority

**High** -- Clear multi-phase domain process with well-defined inputs/outputs per phase. The reverse engineering pipeline generalizes to other binary analysis domains. The plugin structure is already close to babysitter marketplace format.

---

## Processes

### 1. Android App Reverse Engineering Pipeline

**Placement**: `specializations/security/android-reverse-engineering.js`

5-phase workflow for decompiling Android packages and extracting their HTTP API surface:

1. **Dependency Verification** -- Run check-deps.sh to verify Java JDK 17+, jadx, and optional tools (Vineflower, dex2jar). For missing required deps, auto-install (prefer ~/.local without sudo, fall back to system package manager). For optional deps, present breakpoint asking user preference. Re-verify after installation.
2. **Decompilation** -- Select engine based on input type and strategy:
   - APK: jadx (default), fernflower (via dex2jar intermediate), or both for comparison
   - XAPK: auto-extract ZIP bundle, decompile each contained APK separately
   - JAR/AAR: fernflower preferred for pure Java
   - Options: deobfuscation toggle, resource-skip for speed, custom output directory
3. **Structure Analysis** -- Parse AndroidManifest.xml for activities, services, receivers, providers, permissions. Survey package structure to distinguish app code from third-party libraries. Identify architecture pattern (MVVM, MVP, MVC, Clean Architecture). Locate API-related packages (api/, network/, data/, repository/, retrofit/, http/).
4. **API Extraction** -- Run find-api-calls.sh to locate:
   - Retrofit interface definitions (@GET, @POST, @Headers, base URL)
   - OkHttp interceptors and client configurations
   - Volley request builders
   - Hardcoded URLs and API keys
   - Authentication patterns (Bearer tokens, API keys, OAuth flows)
   - Output: structured API documentation with endpoints, methods, headers, auth requirements
5. **Call Flow Tracing** -- Starting from Activities/Fragments, trace through ViewModel -> Repository -> API interface -> HTTP client. Document the complete request/response chain including data transformations, error handling, and retry logic. Handle obfuscated code (ProGuard/R8) with deobfuscation strategies.

Key patterns:
- Engine selection strategy encoded as decision table (input type x quality need -> engine choice)
- Dual-engine comparison: when jadx shows warnings, check Fernflower output for the same classes
- XAPK handling: automatic bundle extraction before decompilation
- Obfuscation handling: deobfuscation flags, string analysis for hints, class hierarchy navigation

### 2. Binary API Surface Extraction (Generalized)

**Placement**: `specializations/shared/binary-api-extraction.js`

Generalized version of the Android RE pipeline applicable to extracting API surfaces from compiled artifacts:

1. **Tool Setup** -- Verify and install required decompilation/disassembly tools for the target platform.
2. **Decompilation/Disassembly** -- Convert binary to readable form using appropriate engine(s).
3. **Structure Survey** -- Map the codebase organization, identify entry points and architectural layers.
4. **API Surface Extraction** -- Locate network calls, endpoints, authentication patterns. Produce structured documentation.
5. **Integration Mapping** -- Trace data flow from user-facing components through business logic to external API calls.

## Plugin Ideas

### 1. Android Reverse Engineering Plugin

**Description**: Babysitter marketplace plugin providing Android decompilation and API extraction as reusable tasks. Wraps jadx, Fernflower/Vineflower, and dex2jar with automatic dependency management.

**install.md would**:
- Check for Java JDK 17+ installation
- Install jadx to ~/.local/share/jadx (download latest release, symlink to ~/.local/bin)
- Optionally install Vineflower and dex2jar
- Register task definitions: `check-android-re-deps`, `decompile-android`, `find-api-calls`, `trace-call-flow`
- Copy reference docs (jadx-usage.md, fernflower-usage.md, api-extraction-patterns.md, call-flow-analysis.md) to plugin references directory

### 2. Dependency Auto-Installer Plugin

**Description**: Generic plugin for checking and installing CLI tool dependencies with cross-platform support. The android-re-skill's install-dep.sh pattern (detect OS + package manager, prefer user-local install, fall back to sudo) is a reusable capability.

**install.md would**:
- Register a `check-deps` task that accepts a dependency manifest (tool name, version constraint, install method)
- Register an `install-dep` task with OS detection, package manager selection, user-local vs system-wide strategy
- Provide hooks for post-install verification

## Implicit Procedural Knowledge

- **Engine selection decision table**: The strategy for choosing decompiler engines (jadx for speed/Android, fernflower for Java quality, both for comparison when quality matters) is domain expertise that should be encoded as process logic, not left to user judgment.
- **Graceful sudo handling**: When root access is needed but unavailable, printing exact manual commands instead of failing is a robust pattern for any tool installation process.
- **Obfuscation navigation strategies**: Techniques for working with ProGuard/R8 output (string constant analysis, class hierarchy walking, interface-based navigation) are transferable to any reverse engineering domain.
- **XAPK bundle handling**: The pattern of detecting archive-of-archives and recursively processing each contained artifact generalizes to any nested package format.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Android App Reverse Engineering Pipeline | NEW | 5-phase workflow for decompiling Android packages and extracting HTTP API surfaces | - | specializations/security/android-reverse-engineering.js |
| Binary API Surface Extraction | NEW | Generalized binary-to-API extraction process applicable across platforms | - | specializations/shared/binary-api-extraction.js |
| Engine Selection Decision Table | NEW | Strategy for choosing decompiler engines based on input type and quality requirements | - | specializations/security/engine-selection-decision-table.js |
| Graceful Sudo Handling | NEW | User-local dependency installation with fallback to manual commands when root unavailable | - | specializations/shared/graceful-sudo-handling.js |
| Obfuscation Navigation Strategies | NEW | Techniques for working with ProGuard/R8 output and obfuscated code analysis | - | specializations/security/obfuscation-navigation-strategies.js |
| XAPK Bundle Handling | NEW | Pattern for detecting and recursively processing archive-of-archives package formats | - | specializations/shared/xapk-bundle-handling.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Android Reverse Engineering Plugin | NEW | Android decompilation and API extraction with automatic dependency management | - | plugins/a5c/marketplace/blueprints/android-reverse-engineering/ |
| Dependency Auto-Installer Plugin | NEW | Cross-platform CLI tool dependency management with OS detection and install strategies | - | plugins/a5c/marketplace/blueprints/dependency-auto-installer/ |
