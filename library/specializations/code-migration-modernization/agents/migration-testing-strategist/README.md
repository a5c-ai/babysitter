# Migration Testing Strategist Agent

## Overview

The Migration Testing Strategist agent designs and implements comprehensive testing strategies for migration initiatives. It ensures functional equivalence, performance parity, and quality maintenance through structured testing approaches, baseline creation, and validation frameworks.

## Quick Start

### Prerequisites

- Access to target codebase
- Understanding of migration scope and timeline
- Knowledge of critical business paths
- CI/CD pipeline access (optional but recommended)

### Basic Usage

1. **Define testing parameters**
   ```json
   {
     "targetPath": "./legacy-system",
     "migrationScope": "monolith-to-microservices",
     "timeline": "12 weeks",
     "criticalPaths": [
       "order-processing",
       "payment-flow",
       "inventory-management"
     ],
     "constraints": {
       "maxRegressionTime": "30 minutes",
       "targetCoverage": 80
     }
   }
   ```

2. **Run strategy design**
   ```javascript
   const result = await ctx.task(testStrategyTask, {
     codebasePath: './legacy-system',
     scope: 'comprehensive',
     timeline: '12 weeks'
   });
   ```

3. **Review outputs**
   - `test-strategy.md` - Complete strategy document
   - `test-plan.json` - Structured test plan
   - `tests/` - Generated test suites
   - `ci-config/` - CI/CD configurations

## Features

### Testing Phases

| Phase | Purpose | Key Activities |
|-------|---------|----------------|
| Pre-Migration | Baseline creation | Characterization tests, performance baselines |
| During Migration | Change validation | Regression testing, integration tests |
| Post-Migration | Success verification | Functional validation, performance comparison |
| Parallel Run | Side-by-side validation | Output comparison, reconciliation |

### Test Types Supported

| Type | Description | When Used |
|------|-------------|-----------|
| Characterization | Capture current behavior | Pre-migration baseline |
| Unit | Test individual components | Continuous |
| Integration | Test component interactions | After changes |
| E2E | Test complete user journeys | Critical paths |
| Performance | Validate performance SLAs | Milestones |
| Smoke | Quick sanity checks | Every deployment |
| Comparison | Compare old vs new outputs | Parallel run |

### Coverage Targets

Default coverage recommendations:

```
Unit Tests:        80% line coverage
Integration Tests: 60% API coverage
E2E Tests:         Critical paths only (40%)
Characterization:  90% of critical business logic
```

## Configuration

### Strategy Configuration

Create `test-strategy-config.json`:

```json
{
  "strategy": {
    "scope": "comprehensive",
    "phases": ["pre", "during", "post", "parallel"],
    "duration": "12 weeks"
  },
  "coverage": {
    "targets": {
      "unit": 80,
      "integration": 60,
      "e2e": 40,
      "characterization": 90
    },
    "measurementTool": "jest --coverage"
  },
  "performance": {
    "baselines": {
      "responseTime": {
        "p50": "100ms",
        "p95": "500ms",
        "p99": "1000ms"
      },
      "throughput": "1000 rps",
      "errorRate": "0.1%"
    },
    "degradationThreshold": "10%",
    "loadTestTool": "k6"
  },
  "dataValidation": {
    "strategy": "sampling",
    "sampleSize": "10%",
    "checksumValidation": true,
    "reconciliationFrequency": "hourly"
  },
  "ciIntegration": {
    "platform": "github-actions",
    "parallelJobs": 4,
    "failFast": false,
    "retryFailedTests": 2
  },
  "reporting": {
    "formats": ["json", "html", "markdown"],
    "notifyOnFailure": true,
    "dashboardUrl": "https://dashboard.example.com"
  }
}
```

### Critical Path Definition

```json
{
  "criticalPaths": [
    {
      "name": "order-processing",
      "priority": 1,
      "components": [
        "order-service",
        "inventory-service",
        "pricing-service"
      ],
      "scenarios": [
        "create-order",
        "modify-order",
        "cancel-order"
      ]
    },
    {
      "name": "payment-flow",
      "priority": 1,
      "components": [
        "payment-service",
        "fraud-detection",
        "billing-service"
      ],
      "scenarios": [
        "process-payment",
        "refund-payment",
        "retry-failed-payment"
      ]
    }
  ]
}
```

## Output Examples

### Test Strategy Document

```markdown
# Migration Testing Strategy

## Executive Summary

This document outlines the testing strategy for migrating the Order Management
System from a monolithic architecture to microservices. The strategy spans
12 weeks and includes comprehensive baseline creation, continuous regression
testing, and parallel run validation.

## Test Inventory

### Current State
- Unit Tests: 847 tests (35% coverage)
- Integration Tests: 124 tests (20% coverage)
- E2E Tests: 23 tests (critical paths only)
- Performance Tests: Basic load tests only

### Target State
- Unit Tests: 2000+ tests (80% coverage)
- Integration Tests: 350+ tests (60% coverage)
- E2E Tests: 100+ tests (all critical paths)
- Characterization Tests: 500+ (90% business logic)

### Gap Analysis

| Area | Current | Target | Gap | Effort |
|------|---------|--------|-----|--------|
| Unit Test Coverage | 35% | 80% | 45% | 160 hours |
| Integration Tests | 20% | 60% | 40% | 120 hours |
| Characterization | 0% | 90%* | 90% | 80 hours |
| Performance Suite | Basic | Comprehensive | Large | 60 hours |

## Phase Details

### Phase 1: Baseline Creation (Weeks 1-2)

**Goal**: Capture current system behavior before any changes

**Activities**:
1. Generate characterization tests for critical paths
2. Capture performance baselines under various loads
3. Create data snapshots and checksums
4. Document expected behaviors and edge cases

**Exit Criteria**:
- [ ] 90% characterization coverage of critical paths
- [ ] Performance baselines for all SLAs documented
- [ ] Data checksums recorded for validation

### Phase 2: Continuous Testing (Weeks 3-8)

**Goal**: Validate each migration increment

**Activities**:
1. Run regression suite on every PR
2. Execute integration tests nightly
3. Performance test at each milestone
4. Monitor test stability metrics

**Exit Criteria**:
- [ ] 100% regression test pass rate
- [ ] No performance degradation > 10%
- [ ] All integration points validated

### Phase 3: Validation (Weeks 9-10)

**Goal**: Verify migration completeness

**Activities**:
1. Run parallel comparison tests
2. Execute full E2E test suite
3. Perform load testing at production scale
4. Validate data integrity

**Exit Criteria**:
- [ ] < 0.1% discrepancy in parallel run
- [ ] All E2E tests passing
- [ ] Performance within SLA

### Phase 4: Go-Live (Weeks 11-12)

**Goal**: Ensure production readiness

**Activities**:
1. Execute smoke tests on production
2. Monitor for anomalies
3. Validate rollback capability
4. Conduct UAT sign-off

**Exit Criteria**:
- [ ] All smoke tests passing
- [ ] Monitoring alerts configured
- [ ] Rollback tested and documented
- [ ] UAT sign-off obtained
```

### Generated Test Suite

```typescript
// tests/characterization/order-service.char.test.ts

import { OrderService } from '../../src/services/order-service';

describe('OrderService Characterization Tests', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
  });

  describe('calculateOrderTotal', () => {
    const testCases = [
      {
        name: 'standard order',
        input: { items: [{ sku: 'A001', qty: 2, price: 10.00 }] },
      },
      {
        name: 'order with discount',
        input: {
          items: [{ sku: 'A001', qty: 5, price: 10.00 }],
          discountCode: 'SAVE10'
        },
      },
      {
        name: 'order with shipping',
        input: {
          items: [{ sku: 'A001', qty: 1, price: 10.00 }],
          shipping: 'express'
        },
      },
      {
        name: 'empty order',
        input: { items: [] },
      },
      {
        name: 'order with negative quantity',
        input: { items: [{ sku: 'A001', qty: -1, price: 10.00 }] },
      },
    ];

    testCases.forEach(({ name, input }) => {
      it(`should match snapshot for ${name}`, () => {
        const result = service.calculateOrderTotal(input);
        expect(result).toMatchSnapshot();
      });
    });
  });

  describe('validateOrder', () => {
    it('should match snapshot for valid order', () => {
      const order = createValidOrder();
      const result = service.validateOrder(order);
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for invalid order', () => {
      const order = createInvalidOrder();
      const result = service.validateOrder(order);
      expect(result).toMatchSnapshot();
    });
  });
});
```

### Performance Test Configuration

```javascript
// tests/performance/load-test.k6.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const orderLatency = new Trend('order_latency');

// Baseline thresholds (captured pre-migration)
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Peak load
    { duration: '5m', target: 200 },   // Sustained peak
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    order_latency: ['p(95)<600'],
  },
};

export default function () {
  // Create order scenario
  const orderPayload = JSON.stringify({
    customerId: `C${Math.floor(Math.random() * 10000)}`,
    items: [
      { sku: 'A001', quantity: 2 },
      { sku: 'B002', quantity: 1 },
    ],
  });

  const startTime = new Date();
  const res = http.post('http://localhost:3000/api/orders', orderPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const endTime = new Date();

  orderLatency.add(endTime - startTime);

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response has orderId': (r) => JSON.parse(r.body).orderId !== undefined,
  });

  errorRate.add(!success);

  sleep(1);
}
```

## Integration with Babysitter SDK

### Process Definition

```javascript
import { defineTask, defineProcess } from '@a5c-ai/babysitter-sdk';

export const testStrategyProcess = defineProcess('migration-testing', {
  description: 'Design and implement migration testing strategy',

  tasks: {
    strategy: defineTask('strategy', (args, ctx) => ({
      kind: 'agent',
      title: 'Test Strategy Design',
      agent: {
        name: 'migration-testing-strategist',
        prompt: {
          role: 'Testing Strategy Expert',
          task: 'Design migration testing strategy',
          context: args,
          instructions: [
            'Analyze current test coverage and gaps',
            'Design multi-phase testing strategy',
            'Generate characterization test baseline',
            'Create performance test configurations',
            'Define validation and acceptance criteria'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${ctx.effectId}/input.json`,
        outputJsonPath: `tasks/${ctx.effectId}/result.json`
      }
    })),

    generateTests: defineTask('generate-tests', (args, ctx) => ({
      kind: 'skill',
      title: 'Generate Characterization Tests',
      skill: {
        name: 'characterization-test-generator',
        context: {
          targetPath: args.targetPath,
          testFramework: args.framework,
          outputDir: args.outputDir
        }
      },
      io: {
        inputJsonPath: `tasks/${ctx.effectId}/input.json`,
        outputJsonPath: `tasks/${ctx.effectId}/result.json`
      }
    }))
  },

  flow: async (inputs, ctx) => {
    // Design strategy
    const strategy = await ctx.task(tasks.strategy, inputs);

    // Generate baseline tests
    const tests = await ctx.task(tasks.generateTests, {
      targetPath: inputs.targetPath,
      framework: inputs.testFramework,
      outputDir: './tests/characterization'
    });

    return {
      strategy,
      testsGenerated: tests.testsGenerated,
      coverage: tests.coverage
    };
  }
});
```

## CLI Examples

### Design Strategy

```bash
# Full strategy design
claude --agent migration-testing-strategist \
  --input '{
    "targetPath": "./src",
    "migrationScope": "cloud-native",
    "timeline": "12 weeks"
  }'
```

### Generate Specific Tests

```bash
# Generate characterization tests only
claude --agent migration-testing-strategist \
  --config '{"tasks": ["characterization"]}'

# Generate performance baselines
claude --agent migration-testing-strategist \
  --config '{"tasks": ["performance-baseline"]}'
```

## Troubleshooting

### Common Issues

**Low initial coverage**
```
Warning: Current test coverage is below 30%
```
Solution: Prioritize characterization tests for critical paths first

**Flaky tests detected**
```
Warning: Test instability detected in 5 tests
```
Solution: Stabilize tests before migration or mark as known flaky

**Performance baseline variance**
```
Warning: High variance in performance measurements
```
Solution: Increase sample size and control test environment

### Debug Mode

```json
{
  "debug": {
    "enabled": true,
    "verboseTestOutput": true,
    "saveIntermediateResults": true,
    "logSkillInvocations": true
  }
}
```

## Best Practices

1. **Generate Tests First**: Create characterization tests before any changes
2. **Prioritize Critical Paths**: Focus limited resources on highest-risk areas
3. **Automate Everything**: Manual testing creates bottlenecks
4. **Test in Production-Like Environment**: Differences cause false confidence
5. **Monitor Test Stability**: Flaky tests erode confidence
6. **Track Coverage Trends**: Ensure coverage doesn't decrease
7. **Plan for the Unknown**: Build in buffer for unexpected issues

## Related Documentation

- [AGENT.md](./AGENT.md) - Full agent specification
- [AI Testing MCP](https://github.com/Twisted66/ai-testing-mcp)
- [ApprovalTests](https://approvaltests.com/)
- [k6 Load Testing](https://k6.io/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |
