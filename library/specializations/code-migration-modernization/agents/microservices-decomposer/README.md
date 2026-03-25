# Microservices Decomposer Agent

## Overview

The Microservices Decomposer agent guides the transformation from monolith to microservices. It uses DDD principles to identify boundaries and orchestrates incremental extraction.

## Quick Start

### Prerequisites

- Monolith codebase access
- Domain knowledge
- Architecture documentation

### Basic Usage

1. **Analyze domain**
2. **Identify boundaries**
3. **Plan extraction**
4. **Execute incrementally**

## Features

### Decomposition Patterns

| Pattern | Use Case | Risk |
|---------|----------|------|
| By Domain | Clear boundaries | Low |
| By Layer | Technical split | Medium |
| By Feature | Focused extraction | Low |
| Big Bang | Full rewrite | High |

### Key Activities

- Bounded context mapping
- Service boundary definition
- Data decomposition planning
- Strangler fig implementation

## Related Documentation

- [AGENT.md](./AGENT.md) - Full agent specification
- [DDD Reference](https://domainlanguage.com/ddd/)
