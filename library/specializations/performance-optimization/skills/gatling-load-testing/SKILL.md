---
name: gatling-load-testing
description: Expert skill for Gatling simulation development, load test execution, and performance analysis. Write Gatling simulations in Scala DSL, configure injection profiles and feeders, define assertions, analyze HTML reports, and integrate with Gatling Enterprise.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: load-testing
  backlog-id: SK-006
---

# gatling-load-testing

You are **gatling-load-testing** - a specialized skill for Gatling load test development and performance analysis. This skill provides expert capabilities for building comprehensive load testing suites using Gatling's powerful Scala DSL.

## Overview

This skill enables AI-powered load testing operations including:
- Writing Gatling simulations in Scala DSL
- Configuring injection profiles (ramp-up, steady, spike, stress)
- Designing feeders for test data management
- Defining assertions and response time percentiles
- Analyzing Gatling HTML reports
- Session handling and correlation
- Gatling Enterprise integration

## Prerequisites

- Java 11+ or Java 17+ (recommended)
- Scala 2.13+ or Gatling Bundle
- Maven or Gradle for build management
- Optional: Gatling Enterprise license for advanced features

## Capabilities

### 1. Gatling Simulation Development

Write comprehensive Gatling simulations:

```scala
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class ApiLoadSimulation extends Simulation {

  // HTTP Protocol Configuration
  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("Gatling/LoadTest")
    .shareConnections
    .maxConnectionsPerHost(10)

  // Test Data Feeder
  val userFeeder = csv("users.csv").circular
  val searchFeeder = jsonFile("searches.json").random

  // Request Chains
  val authenticate = exec(
    http("Authenticate")
      .post("/auth/login")
      .body(StringBody("""{"username":"${username}","password":"${password}"}"""))
      .check(
        status.is(200),
        jsonPath("$.token").saveAs("authToken"),
        responseTimeInMillis.lte(500)
      )
  )

  val searchProducts = exec(
    http("Search Products")
      .get("/products/search")
      .queryParam("q", "${searchTerm}")
      .header("Authorization", "Bearer ${authToken}")
      .check(
        status.is(200),
        jsonPath("$.results[*]").count.gte(1),
        responseTimeInMillis.lte(1000)
      )
  )

  val viewProduct = exec(
    http("View Product")
      .get("/products/${productId}")
      .header("Authorization", "Bearer ${authToken}")
      .check(
        status.is(200),
        jsonPath("$.id").is("${productId}"),
        responseTimeInMillis.lte(300)
      )
  )

  // Scenario Definition
  val userJourney = scenario("User Journey")
    .feed(userFeeder)
    .exec(authenticate)
    .pause(1, 3)
    .feed(searchFeeder)
    .exec(searchProducts)
    .pause(500.milliseconds, 2.seconds)
    .repeat(3) {
      exec(viewProduct)
        .pause(1, 2)
    }

  // Load Profile
  setUp(
    userJourney.inject(
      rampUsers(100).during(60.seconds),
      constantUsersPerSec(50).during(300.seconds),
      rampUsersPerSec(50).to(100).during(120.seconds)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile3.lt(1000),
      global.successfulRequests.percent.gte(99),
      forAll.failedRequests.percent.lt(1)
    )
}
```

### 2. Injection Profiles

Configure various load patterns:

```scala
// Ramp-up load pattern
setUp(
  scenario.inject(
    rampUsers(1000).during(10.minutes)
  )
)

// Constant load with warm-up
setUp(
  scenario.inject(
    nothingFor(5.seconds),
    atOnceUsers(10),
    rampUsers(100).during(1.minute),
    constantUsersPerSec(50).during(5.minutes)
  )
)

// Stress test pattern
setUp(
  scenario.inject(
    incrementUsersPerSec(10)
      .times(5)
      .eachLevelLasting(2.minutes)
      .separatedByRampsLasting(30.seconds)
      .startingFrom(10)
  )
)

// Spike test pattern
setUp(
  scenario.inject(
    constantUsersPerSec(20).during(2.minutes),
    stressPeakUsers(500).during(30.seconds),
    constantUsersPerSec(20).during(2.minutes)
  )
)

// Soak/Endurance test
setUp(
  scenario.inject(
    rampUsersPerSec(1).to(30).during(5.minutes),
    constantUsersPerSec(30).during(4.hours)
  )
)
```

### 3. Feeders and Test Data

Manage test data effectively:

```scala
// CSV Feeder
val csvFeeder = csv("data/users.csv").circular

// JSON Feeder
val jsonFeeder = jsonFile("data/products.json").random

// JDBC Feeder
val jdbcFeeder = jdbcFeeder(
  "jdbc:postgresql://localhost:5432/testdb",
  "postgres", "password",
  "SELECT id, email FROM users WHERE active = true"
)

// Custom Feeder
val customFeeder = Iterator.continually(Map(
  "orderId" -> java.util.UUID.randomUUID().toString,
  "timestamp" -> System.currentTimeMillis(),
  "amount" -> (100 + scala.util.Random.nextInt(900))
))

// Batch Feeder with transformation
val transformedFeeder = csv("data/raw.csv")
  .transform { case (key, value) =>
    if (key == "amount") (value.toDouble * 1.1).toString else value
  }
  .batch(100)
  .random
```

### 4. Session Handling and Correlation

Handle dynamic values and session state:

```scala
// Extract and reuse values
exec(
  http("Get CSRF Token")
    .get("/form")
    .check(
      css("input[name='csrf']", "value").saveAs("csrfToken")
    )
)
.exec(
  http("Submit Form")
    .post("/submit")
    .formParam("csrf", "${csrfToken}")
    .formParam("data", "${userData}")
)

// JSON path extraction
exec(
  http("Get Order")
    .get("/orders/${orderId}")
    .check(
      jsonPath("$.items[*].id").findAll.saveAs("itemIds"),
      jsonPath("$.total").saveAs("orderTotal")
    )
)
.foreach("${itemIds}", "itemId") {
  exec(
    http("Get Item Details")
      .get("/items/${itemId}")
  )
}

// Conditional execution
exec(session => {
  if (session("userType").as[String] == "premium") {
    session.set("rateLimit", 1000)
  } else {
    session.set("rateLimit", 100)
  }
})
.doIf("${userType}", "premium") {
  exec(premiumFeatures)
}
```

### 5. Assertions and Thresholds

Define comprehensive assertions:

```scala
setUp(scenario.inject(/* ... */))
  .protocols(httpProtocol)
  .assertions(
    // Global assertions
    global.responseTime.max.lt(5000),
    global.responseTime.mean.lt(500),
    global.responseTime.percentile1.lt(200),  // P50
    global.responseTime.percentile2.lt(500),  // P75
    global.responseTime.percentile3.lt(1000), // P95
    global.responseTime.percentile4.lt(2000), // P99

    // Success rate assertions
    global.successfulRequests.percent.gte(99.5),
    global.failedRequests.count.lt(100),

    // Request-specific assertions
    details("Authenticate").responseTime.percentile3.lt(500),
    details("Search Products").successfulRequests.percent.gte(99),

    // Throughput assertions
    global.requestsPerSec.gte(1000)
  )
```

### 6. Report Analysis

Analyze Gatling HTML reports:

```scala
// Report configuration
.protocols(httpProtocol)
.pauses(constantPauses)

// Custom report naming
System.setProperty("gatling.core.outputDirectoryBaseName", "api-load-test")
System.setProperty("gatling.charting.indicators.lowerBound", "800")
System.setProperty("gatling.charting.indicators.higherBound", "1200")
```

Key metrics to analyze:
- **Response Time Distribution**: P50, P75, P95, P99
- **Active Users Over Time**: Concurrency levels
- **Requests Per Second**: Throughput trends
- **Response Time Percentiles Over Time**: Performance degradation
- **Errors**: Failure patterns and error codes

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Use Case |
|--------|-------------|----------|
| locust-mcp | Load testing MCP | Alternative load testing execution |
| playwright-mcp | Browser automation | UI-based load testing scenarios |

## Best Practices

### Simulation Design

1. **Realistic scenarios** - Model actual user behavior
2. **Think time** - Include realistic pauses between actions
3. **Data variation** - Use diverse test data
4. **Session isolation** - Avoid shared state between users

### Performance

1. **Connection pooling** - Use `shareConnections`
2. **Feeder optimization** - Use appropriate feeder strategies
3. **Resource management** - Monitor Gatling JVM resources
4. **Distributed execution** - Scale across multiple injectors

### Assertions

1. **Multiple percentiles** - Don't rely only on averages
2. **Error thresholds** - Set acceptable failure rates
3. **Baseline comparison** - Compare against known good runs
4. **Business SLOs** - Align with actual SLOs

## Process Integration

This skill integrates with the following processes:
- `load-testing-framework-setup.js` - Initial Gatling setup
- `load-test-execution.js` - Test execution and orchestration
- `stress-testing-analysis.js` - Stress test scenario design

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "run-simulation",
  "status": "completed",
  "simulation": {
    "name": "ApiLoadSimulation",
    "duration": "300s",
    "totalUsers": 5000
  },
  "results": {
    "requestCount": 150000,
    "errorCount": 45,
    "errorRate": "0.03%",
    "responseTime": {
      "mean": 245,
      "p50": 180,
      "p75": 320,
      "p95": 890,
      "p99": 1450,
      "max": 4200
    },
    "throughput": 500.5
  },
  "assertions": {
    "passed": 8,
    "failed": 0
  },
  "reportPath": "target/gatling/apisimulation-20260124/index.html"
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Connection refused` | Target unavailable | Verify target URL and network |
| `Connection timeout` | Slow target | Increase timeout, check target capacity |
| `OOM on injector` | Too many users | Increase heap, distribute load |
| `Feeder exhausted` | Insufficient test data | Use `.circular` or `.random` |
| `Session value not found` | Missing extraction | Verify check expressions |

## Constraints

- Verify target system can handle load before testing
- Coordinate with operations team for production-like tests
- Monitor injector resources during tests
- Use appropriate test data (not production data)
- Consider network latency in distributed setups
