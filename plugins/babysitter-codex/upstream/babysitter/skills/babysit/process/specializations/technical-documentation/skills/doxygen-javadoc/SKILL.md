---
name: doxygen-javadoc
description: Documentation generation for C, C++, and Java codebases using Doxygen and Javadoc. Extract API documentation from source code, generate cross-references, call graphs, and comprehensive technical documentation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-015
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Doxygen/Javadoc Skill

Generate comprehensive API documentation for C, C++, Java, and other languages using Doxygen and Javadoc with cross-references, call graphs, and coverage analysis.

## Capabilities

- Configure Doxygen for C/C++/Java projects
- Generate Javadoc for Java codebases
- Create cross-reference documentation
- Generate call graphs and dependency visualizations
- Analyze documentation coverage
- Support custom tag definitions
- Multiple output formats (HTML, LaTeX, PDF, XML)
- Integrate with build systems (CMake, Maven, Gradle)

## Usage

Invoke this skill when you need to:
- Document C/C++ libraries and applications
- Generate Java API documentation
- Create reference documentation with diagrams
- Set up automated documentation builds
- Analyze code structure and dependencies

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectPath | string | Yes | Root path of the project |
| tool | string | No | doxygen or javadoc (auto-detected) |
| sourceDir | string | No | Source directory (default: src) |
| outputDir | string | No | Output directory (default: docs) |
| outputFormat | array | No | html, latex, pdf, xml, man |
| includeGraphs | boolean | No | Generate call/dependency graphs |
| configFile | string | No | Existing Doxyfile or pom.xml path |
| coverageReport | boolean | No | Generate coverage analysis |

### Input Example

```json
{
  "projectPath": "./mylib",
  "tool": "doxygen",
  "sourceDir": "src",
  "outputDir": "docs/api",
  "outputFormat": ["html", "xml"],
  "includeGraphs": true,
  "coverageReport": true
}
```

## Output Structure

### Doxygen Output

```
docs/api/
├── html/
│   ├── index.html           # Main documentation page
│   ├── annotated.html       # Class/struct list
│   ├── files.html           # File list
│   ├── modules.html         # Module grouping
│   ├── namespaces.html      # Namespace documentation
│   ├── hierarchy.html       # Class hierarchy
│   ├── class_*.html         # Individual class pages
│   ├── struct_*.html        # Struct documentation
│   ├── group__*.html        # Module documentation
│   ├── *_8h.html            # Header file documentation
│   └── search/              # Search index
├── xml/
│   ├── index.xml            # XML index
│   ├── class_*.xml          # Class XML
│   └── doxygen-layout.xml   # Layout configuration
├── latex/                   # LaTeX output (if enabled)
└── coverage.json            # Documentation coverage
```

### Javadoc Output

```
docs/api/
├── index.html               # Package overview
├── overview-summary.html    # Overview page
├── allclasses-index.html    # Class index
├── allpackages-index.html   # Package index
├── com/
│   └── example/
│       └── package/
│           ├── package-summary.html
│           ├── ClassName.html
│           └── ...
├── element-list              # Package list
└── member-search-index.js    # Search data
```

## Doxygen Documentation Patterns

### File Header

```cpp
/**
 * @file database.h
 * @brief Database connection and query utilities.
 *
 * This module provides thread-safe database connection pooling
 * and query execution with automatic retry logic.
 *
 * @author Development Team
 * @date 2026-01-24
 * @version 1.0.0
 *
 * @copyright Copyright (c) 2026, Company Inc.
 */
```

### Class Documentation

```cpp
/**
 * @class ConnectionPool
 * @brief Thread-safe database connection pool.
 *
 * Manages a pool of database connections with configurable
 * minimum and maximum sizes. Connections are automatically
 * validated before use.
 *
 * @tparam Connection The connection type to pool
 *
 * @note This class is thread-safe.
 * @warning Do not exceed maxConnections in high-load scenarios.
 *
 * @see Connection
 * @see PoolConfig
 *
 * @code{.cpp}
 * ConnectionPool<MySqlConnection> pool(config);
 * auto conn = pool.acquire();
 * conn->execute("SELECT * FROM users");
 * pool.release(conn);
 * @endcode
 */
template<typename Connection>
class ConnectionPool {
public:
    /**
     * @brief Creates a new connection pool.
     *
     * @param config Pool configuration parameters
     * @throws ConfigurationError If config is invalid
     *
     * @pre config.maxConnections > 0
     * @post Pool is initialized with minConnections
     */
    explicit ConnectionPool(const PoolConfig& config);

    /**
     * @brief Acquires a connection from the pool.
     *
     * Blocks until a connection is available or timeout expires.
     *
     * @param timeout Maximum wait time in milliseconds
     * @return Shared pointer to the acquired connection
     * @throws TimeoutError If no connection available within timeout
     *
     * @par Thread Safety
     * This method is thread-safe.
     */
    std::shared_ptr<Connection> acquire(int timeout = 30000);

    /**
     * @brief Releases a connection back to the pool.
     *
     * @param conn The connection to release
     * @retval true Connection successfully returned
     * @retval false Connection was invalid or pool is closed
     */
    bool release(std::shared_ptr<Connection> conn);
};
```

### Function Documentation

```cpp
/**
 * @brief Executes a SQL query with parameter binding.
 *
 * @param[in] query The SQL query string with placeholders
 * @param[in] params Parameter values to bind
 * @param[out] results Query results (if SELECT)
 *
 * @return Number of affected rows (for INSERT/UPDATE/DELETE)
 *
 * @throws QueryError If query execution fails
 * @throws ConnectionError If database connection is lost
 *
 * @par Example
 * @code{.cpp}
 * std::vector<std::string> params = {"John", "25"};
 * ResultSet results;
 * int affected = executeQuery(
 *     "SELECT * FROM users WHERE name = ? AND age > ?",
 *     params,
 *     results
 * );
 * @endcode
 *
 * @par Performance
 * Query preparation is cached for repeated executions.
 *
 * @todo Add support for batch parameter binding
 * @bug Large result sets may cause memory issues (see #123)
 *
 * @since 1.0.0
 * @deprecated Use PreparedStatement::execute() instead
 */
int executeQuery(
    const std::string& query,
    const std::vector<std::string>& params,
    ResultSet& results
);
```

### Module/Group Documentation

```cpp
/**
 * @defgroup Database Database Module
 * @brief Database connectivity and operations.
 *
 * This module provides database abstraction layer with support
 * for multiple database backends.
 *
 * @{
 */

/**
 * @defgroup Database_Connection Connection Management
 * @brief Connection pooling and lifecycle.
 */

/**
 * @defgroup Database_Query Query Execution
 * @brief Query building and execution.
 */

/** @} */ // end of Database group
```

## Javadoc Documentation Patterns

### Package Documentation (package-info.java)

```java
/**
 * Database connectivity and query utilities.
 *
 * <p>This package provides thread-safe database operations with
 * connection pooling and automatic retry logic.</p>
 *
 * <h2>Usage Example</h2>
 * <pre>{@code
 * ConnectionPool pool = new ConnectionPool.Builder()
 *     .maxConnections(10)
 *     .timeout(Duration.ofSeconds(30))
 *     .build();
 *
 * try (Connection conn = pool.acquire()) {
 *     ResultSet rs = conn.executeQuery("SELECT * FROM users");
 * }
 * }</pre>
 *
 * @author Development Team
 * @version 1.0.0
 * @since 1.0.0
 * @see com.example.database.ConnectionPool
 */
package com.example.database;
```

### Class Documentation

```java
/**
 * Thread-safe database connection pool.
 *
 * <p>Manages a pool of database connections with configurable
 * minimum and maximum sizes. Connections are validated before
 * being handed out.</p>
 *
 * <h2>Thread Safety</h2>
 * <p>This class is thread-safe. All public methods use proper
 * synchronization.</p>
 *
 * @param <T> The connection type to pool
 *
 * @author John Doe
 * @version 1.0.0
 * @since 1.0.0
 *
 * @see Connection
 * @see PoolConfig
 */
public class ConnectionPool<T extends Connection> implements AutoCloseable {

    /**
     * Creates a connection pool with the specified configuration.
     *
     * @param config the pool configuration
     * @throws IllegalArgumentException if config is null
     * @throws ConfigurationException if config values are invalid
     */
    public ConnectionPool(PoolConfig config) {
        // Implementation
    }

    /**
     * Acquires a connection from the pool.
     *
     * <p>This method blocks until a connection becomes available
     * or the specified timeout expires.</p>
     *
     * @param timeout maximum time to wait for a connection
     * @return a valid connection from the pool
     * @throws TimeoutException if no connection available within timeout
     * @throws PoolClosedException if the pool has been closed
     */
    public T acquire(Duration timeout) throws TimeoutException {
        // Implementation
    }

    /**
     * {@inheritDoc}
     *
     * <p>Closes all connections and releases resources.</p>
     */
    @Override
    public void close() {
        // Implementation
    }
}
```

### Method Documentation with Code Examples

```java
/**
 * Executes a parameterized SQL query.
 *
 * <p>Parameters are bound in the order provided. Use {@code ?}
 * as placeholder in the query string.</p>
 *
 * <h3>Example</h3>
 * <pre>{@code
 * List<User> users = db.query(
 *     "SELECT * FROM users WHERE age > ? AND status = ?",
 *     List.of(18, "active"),
 *     User.class
 * );
 * }</pre>
 *
 * @param <R> the result type
 * @param sql the SQL query with {@code ?} placeholders
 * @param params the parameter values (in order)
 * @param resultType the class to map results to
 * @return list of mapped results
 * @throws SQLException if query execution fails
 * @throws MappingException if result mapping fails
 *
 * @see #execute(String, List) for non-SELECT queries
 * @since 1.0.0
 */
public <R> List<R> query(String sql, List<?> params, Class<R> resultType)
        throws SQLException {
    // Implementation
}
```

## Doxyfile Configuration

```ini
# Doxyfile configuration

# Project settings
PROJECT_NAME           = "MyLib"
PROJECT_NUMBER         = "1.0.0"
PROJECT_BRIEF          = "Database connectivity library"
PROJECT_LOGO           = logo.png

# Input settings
INPUT                  = src include
FILE_PATTERNS          = *.c *.cc *.cpp *.h *.hpp
RECURSIVE              = YES
EXCLUDE                = src/test src/vendor
EXCLUDE_PATTERNS       = *_test.cpp *_mock.h

# Output settings
OUTPUT_DIRECTORY       = docs
GENERATE_HTML          = YES
GENERATE_XML           = YES
GENERATE_LATEX         = NO

# HTML settings
HTML_OUTPUT            = html
HTML_EXTRA_STYLESHEET  = custom.css
SEARCHENGINE           = YES
DISABLE_INDEX          = NO
GENERATE_TREEVIEW      = YES

# Graph settings
HAVE_DOT               = YES
CALL_GRAPH             = YES
CALLER_GRAPH           = YES
CLASS_GRAPH            = YES
COLLABORATION_GRAPH    = YES
INCLUDE_GRAPH          = YES
INCLUDED_BY_GRAPH      = YES
DOT_IMAGE_FORMAT       = svg

# Documentation extraction
EXTRACT_ALL            = NO
EXTRACT_PRIVATE        = NO
EXTRACT_STATIC         = YES
EXTRACT_LOCAL_CLASSES  = YES

# Warning settings
WARN_IF_UNDOCUMENTED   = YES
WARN_IF_DOC_ERROR      = YES
WARN_NO_PARAMDOC       = YES
WARN_AS_ERROR          = NO

# Preprocessing
ENABLE_PREPROCESSING   = YES
MACRO_EXPANSION        = YES
PREDEFINED             = DOXYGEN_SKIP

# Aliases for custom commands
ALIASES                = "thread_safe=\par Thread Safety\n"
ALIASES               += "performance=\par Performance\n"
```

## Maven Javadoc Configuration

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-javadoc-plugin</artifactId>
    <version>3.6.3</version>
    <configuration>
        <source>17</source>
        <show>protected</show>
        <nohelp>true</nohelp>
        <doclint>all,-missing</doclint>
        <additionalOptions>
            <additionalOption>-Xdoclint:none</additionalOption>
        </additionalOptions>
        <links>
            <link>https://docs.oracle.com/en/java/javase/17/docs/api/</link>
        </links>
        <tags>
            <tag>
                <name>apiNote</name>
                <placement>a</placement>
                <head>API Note:</head>
            </tag>
            <tag>
                <name>implSpec</name>
                <placement>a</placement>
                <head>Implementation Specification:</head>
            </tag>
            <tag>
                <name>implNote</name>
                <placement>a</placement>
                <head>Implementation Note:</head>
            </tag>
        </tags>
    </configuration>
    <executions>
        <execution>
            <id>attach-javadocs</id>
            <goals>
                <goal>jar</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## Workflow

1. **Detect project type** - Identify C/C++/Java project
2. **Locate sources** - Find source files and headers
3. **Generate config** - Create Doxyfile or configure Maven
4. **Parse comments** - Extract documentation from source
5. **Generate diagrams** - Create call graphs (if enabled)
6. **Build output** - Generate HTML/PDF/XML
7. **Analyze coverage** - Report documentation gaps

## Dependencies

### Doxygen

```bash
# Ubuntu/Debian
apt-get install doxygen graphviz

# macOS
brew install doxygen graphviz

# Windows (chocolatey)
choco install doxygen.install graphviz
```

### Javadoc

```bash
# Included with JDK
java -version  # JDK 11+ recommended
```

## Best Practices Applied

- Document all public API elements
- Use @brief for one-line summaries
- Include @param for all parameters
- Specify @return values
- Document exceptions with @throws
- Add @code examples for complex functions
- Use @see for cross-references
- Enable warning for undocumented items

## References

- Doxygen Manual: https://www.doxygen.nl/manual/
- Javadoc Guide: https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html
- Doxygen Special Commands: https://www.doxygen.nl/manual/commands.html
- Graphviz: https://graphviz.org/

## Target Processes

- api-doc-generation.js
- sdk-doc-generation.js
- arch-docs-c4.js
- docs-audit.js
