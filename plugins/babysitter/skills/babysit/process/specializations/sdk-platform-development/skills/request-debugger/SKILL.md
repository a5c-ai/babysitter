---
name: request-debugger
description: HTTP request/response debugging and inspection tools
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Request Debugger Skill

## Overview

This skill implements comprehensive HTTP request/response debugging and inspection tools for SDKs, helping developers understand and troubleshoot API interactions.

## Capabilities

- Log request/response details with formatting
- Redact sensitive data automatically
- Correlate logs with request IDs
- Support curl command export for reproduction
- Implement request timing breakdowns
- Capture retry attempts and failures
- Support HAR (HTTP Archive) export
- Enable request/response interception

## Target Processes

- Error Handling and Debugging Support
- Logging and Diagnostics
- Developer Experience Optimization

## Integration Points

- HTTP client interceptors
- Logging frameworks
- Debug proxies (Charles, mitmproxy)
- Browser DevTools protocols
- IDE debug integration

## Input Requirements

- Redaction rules for sensitive data
- Logging level configurations
- Timing breakdown requirements
- Export format preferences
- Interception capabilities

## Output Artifacts

- Debug interceptor middleware
- Request logger implementation
- Sensitive data redactor
- Curl command generator
- HAR exporter
- Timing breakdown utilities

## Usage Example

```yaml
skill:
  name: request-debugger
  context:
    logging:
      enabled: true
      level: debug
      prettyPrint: true
    redaction:
      headers: ["Authorization", "X-Api-Key"]
      body: ["password", "secret", "token"]
    features:
      curlExport: true
      harExport: true
      timingBreakdown: true
      retryLogging: true
    requestIdHeader: "X-Request-ID"
```

## Best Practices

1. Always redact sensitive data
2. Include timing breakdowns
3. Support reproducible curl export
4. Log retry attempts with reasons
5. Use structured logging format
6. Enable selective debug activation
