# Doxygen/Javadoc Skill

Generate professional API documentation for C, C++, and Java codebases with call graphs, cross-references, and comprehensive technical documentation.

## Overview

This skill provides expertise in Doxygen (for C/C++) and Javadoc (for Java) documentation generation. It creates HTML, PDF, and XML documentation with automatic call graph generation, class hierarchies, and cross-references.

## When to Use

- Documenting C/C++ libraries and applications
- Generating Java API reference documentation
- Creating technical documentation with diagrams
- Analyzing code structure and dependencies
- Setting up automated documentation builds

## Quick Start

### Doxygen (C/C++)

```json
{
  "projectPath": "./mylib",
  "tool": "doxygen",
  "includeGraphs": true,
  "coverageReport": true
}
```

### Javadoc (Java)

```json
{
  "projectPath": "./myproject",
  "tool": "javadoc",
  "outputDir": "target/site/apidocs"
}
```

## Doxygen Documentation

### Class Documentation

```cpp
/**
 * @class ConnectionPool
 * @brief Thread-safe database connection pool.
 *
 * Manages a pool of database connections with automatic
 * validation and timeout handling.
 *
 * @tparam T The connection type
 *
 * @code{.cpp}
 * ConnectionPool<MySqlConnection> pool(config);
 * auto conn = pool.acquire();
 * conn->execute("SELECT * FROM users");
 * @endcode
 *
 * @see PoolConfig
 */
template<typename T>
class ConnectionPool {
    // ...
};
```

### Function Documentation

```cpp
/**
 * @brief Executes a SQL query with parameters.
 *
 * @param[in] query SQL query with ? placeholders
 * @param[in] params Parameter values
 * @param[out] results Query results
 *
 * @return Number of affected rows
 * @throws QueryError on execution failure
 *
 * @par Thread Safety
 * Thread-safe when using separate connections.
 *
 * @since 1.0.0
 */
int executeQuery(
    const std::string& query,
    const Params& params,
    ResultSet& results
);
```

### File Documentation

```cpp
/**
 * @file database.h
 * @brief Database connectivity utilities.
 *
 * @author Development Team
 * @date 2026-01-24
 * @version 1.0.0
 */
```

## Javadoc Documentation

### Class Documentation

```java
/**
 * Thread-safe database connection pool.
 *
 * <p>Manages connections with configurable pool sizes and
 * automatic health checking.</p>
 *
 * <h2>Example</h2>
 * <pre>{@code
 * ConnectionPool pool = ConnectionPool.builder()
 *     .maxConnections(10)
 *     .build();
 * }</pre>
 *
 * @param <T> the connection type
 * @author John Doe
 * @version 1.0.0
 * @since 1.0.0
 */
public class ConnectionPool<T> {
    // ...
}
```

### Method Documentation

```java
/**
 * Acquires a connection from the pool.
 *
 * <p>Blocks until a connection is available or timeout expires.</p>
 *
 * @param timeout maximum wait time
 * @return a valid connection
 * @throws TimeoutException if no connection available
 * @throws PoolClosedException if pool is closed
 *
 * @see #release(Connection)
 */
public Connection acquire(Duration timeout) throws TimeoutException {
    // ...
}
```

## Configuration

### Doxyfile (Minimal)

```ini
PROJECT_NAME           = "MyLib"
PROJECT_NUMBER         = "1.0.0"
INPUT                  = src include
FILE_PATTERNS          = *.c *.cc *.cpp *.h *.hpp
RECURSIVE              = YES
OUTPUT_DIRECTORY       = docs

# Enable graphs
HAVE_DOT               = YES
CALL_GRAPH             = YES
CALLER_GRAPH           = YES
CLASS_GRAPH            = YES

# Warnings
WARN_IF_UNDOCUMENTED   = YES
WARN_NO_PARAMDOC       = YES
```

### Maven Javadoc Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-javadoc-plugin</artifactId>
    <version>3.6.3</version>
    <configuration>
        <source>17</source>
        <show>protected</show>
    </configuration>
</plugin>
```

### Gradle Javadoc

```groovy
javadoc {
    options {
        memberLevel = JavadocMemberLevel.PROTECTED
        encoding = 'UTF-8'
        links 'https://docs.oracle.com/en/java/javase/17/docs/api/'
    }
}
```

## Common Tags Reference

### Doxygen Tags

| Tag | Description |
|-----|-------------|
| `@brief` | One-line description |
| `@param[in]` | Input parameter |
| `@param[out]` | Output parameter |
| `@return` | Return value |
| `@throws` | Exception |
| `@code` | Code example |
| `@see` | Cross-reference |
| `@note` | Note |
| `@warning` | Warning |
| `@deprecated` | Deprecation |
| `@since` | Version introduced |
| `@tparam` | Template parameter |
| `@pre` | Precondition |
| `@post` | Postcondition |
| `@todo` | TODO item |
| `@bug` | Known bug |

### Javadoc Tags

| Tag | Description |
|-----|-------------|
| `@param` | Parameter |
| `@return` | Return value |
| `@throws` | Exception |
| `@see` | Reference |
| `@since` | Version |
| `@deprecated` | Deprecated |
| `@author` | Author |
| `@version` | Version |
| `@apiNote` | API note |
| `@implSpec` | Implementation specification |
| `@implNote` | Implementation note |
| `{@code}` | Inline code |
| `{@link}` | Link to element |
| `{@inheritDoc}` | Inherit documentation |

## Generated Output

### Doxygen HTML

```
docs/html/
├── index.html          # Main page
├── annotated.html      # Class list
├── hierarchy.html      # Class hierarchy
├── files.html          # File list
├── class_*.html        # Class documentation
├── struct_*.html       # Struct documentation
├── group__*.html       # Module documentation
└── search/             # Search index
```

### Javadoc HTML

```
docs/api/
├── index.html              # Overview
├── overview-summary.html   # Package overview
├── allclasses-index.html   # All classes
├── com/example/
│   └── package/
│       ├── package-summary.html
│       └── ClassName.html
└── element-list
```

## Process Integration

| Process | Usage |
|---------|-------|
| `api-doc-generation.js` | Generate API reference |
| `sdk-doc-generation.js` | SDK documentation |
| `arch-docs-c4.js` | Architecture diagrams |
| `docs-audit.js` | Coverage analysis |

## CI/CD Integration

### CMake + Doxygen

```cmake
find_package(Doxygen REQUIRED)

set(DOXYGEN_GENERATE_HTML YES)
set(DOXYGEN_CALL_GRAPH YES)
set(DOXYGEN_CALLER_GRAPH YES)

doxygen_add_docs(docs
    ${PROJECT_SOURCE_DIR}/src
    ${PROJECT_SOURCE_DIR}/include
    COMMENT "Generate API documentation"
)
```

### GitHub Actions

```yaml
name: Documentation

on:
  push:
    branches: [main]

jobs:
  doxygen:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Doxygen
        run: |
          sudo apt-get install doxygen graphviz

      - name: Build documentation
        run: doxygen Doxyfile

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/html
```

## Installation

### Doxygen

```bash
# Ubuntu/Debian
sudo apt-get install doxygen graphviz

# macOS
brew install doxygen graphviz

# Windows
choco install doxygen.install graphviz
```

### Javadoc

Included with JDK installation. Verify with:

```bash
javadoc -version
```

## References

- [Doxygen Manual](https://www.doxygen.nl/manual/)
- [Doxygen Commands](https://www.doxygen.nl/manual/commands.html)
- [Javadoc Guide](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html)
- [Maven Javadoc Plugin](https://maven.apache.org/plugins/maven-javadoc-plugin/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-015
**Category:** Code Documentation
**Status:** Active
