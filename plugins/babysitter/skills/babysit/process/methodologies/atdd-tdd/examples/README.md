# ATDD/TDD Examples

This directory contains example input files demonstrating various use cases for the ATDD/TDD methodology.

## Examples Overview

### 1. Simple Calculator (`simple-calculator.json`)
**Difficulty**: Beginner
**Description**: Basic arithmetic operations
**Best For**: Learning ATDD/TDD fundamentals

A straightforward example with clear acceptance criteria for basic calculator operations. Perfect for understanding the Red-Green-Refactor cycle.

```bash
# Run this example
babysit run methodologies/atdd-tdd examples/simple-calculator.json
```

### 2. User Authentication (`user-authentication.json`)
**Difficulty**: Intermediate
**Description**: JWT-based authentication system
**Best For**: API security, token management

Demonstrates ATDD/TDD for authentication flows including registration, login, and token validation. Shows how to test security-critical features.

```bash
# Run this example
babysit run methodologies/atdd-tdd examples/user-authentication.json
```

### 3. File Upload (`file-upload.json`)
**Difficulty**: Intermediate
**Description**: Secure file upload with validation
**Best For**: File handling, validation logic, external service integration

Shows how to test file validation, size limits, virus scanning, and storage operations. Demonstrates integration testing with external services.

```bash
# Run this example
babysit run methodologies/atdd-tdd examples/file-upload.json
```

### 4. Shopping Cart (`shopping-cart.json`)
**Difficulty**: Advanced
**Description**: E-commerce checkout process
**Best For**: Complex business logic, multi-service integration

Complex example with payment processing, inventory management, discount codes, and order creation. Demonstrates ATDD/TDD for intricate business workflows.

```bash
# Run this example
babysit run methodologies/atdd-tdd examples/shopping-cart.json
```

### 5. RESTful API Endpoint (`api-endpoint.json`)
**Difficulty**: Intermediate
**Description**: User management API
**Best For**: REST API development, CRUD operations

Shows how to test API contracts, HTTP status codes, validation, authentication, and authorization. Classic API development scenario.

```bash
# Run this example
babysit run methodologies/atdd-tdd examples/api-endpoint.json
```

## Example Structure

Each example JSON file contains:

```json
{
  "description": "Human-readable description",
  "feature": "Feature name/title",
  "acceptanceCriteria": [
    "Given-When-Then formatted criteria"
  ],
  "testFramework": "jest|mocha|vitest|etc",
  "iterationCount": 10,
  "includeIntegrationTests": true|false,
  "existingCode": {
    "service": "./path/to/service.js"
  },
  "notes": [
    "Additional context and learning points"
  ]
}
```

## Learning Path

### For TDD Beginners
1. Start with **simple-calculator.json**
2. Move to **user-authentication.json**
3. Try **api-endpoint.json**

### For Experienced Developers
1. Jump to **shopping-cart.json**
2. Explore **file-upload.json**
3. Customize examples for your domain

## Customizing Examples

You can modify any example to fit your needs:

1. **Change test framework**: Update `testFramework` field
2. **Adjust iterations**: Increase/decrease `iterationCount`
3. **Add/remove criteria**: Modify `acceptanceCriteria` array
4. **Add existing code**: Reference your codebase in `existingCode`

## Expected Outputs

After running an example, you'll find artifacts in:

```
artifacts/atdd-tdd/
├── acceptance-criteria.md        # Criteria document
├── acceptance-criteria.json      # Criteria data
├── acceptance-tests/             # Acceptance test files
├── unit-tests/                   # Unit test files
├── integration-tests/            # Integration test files
├── implementation/               # Production code
├── coverage-report.json          # Coverage metrics
└── SUMMARY.md                    # Process summary
```

## Tips

### Writing Good Acceptance Criteria
- Use **Given-When-Then** format
- Make criteria **testable** and **specific**
- Include **happy paths** and **error cases**
- Consider **edge cases** and **boundary conditions**

### Effective TDD Practice
- Write **minimal tests** (one assertion)
- Keep tests **fast** (< 100ms each)
- Make tests **independent** (no shared state)
- Use **descriptive names** (test intent clear)

### Integration Testing
- Test **real integrations** where possible
- Use **appropriate test doubles** for external systems
- Verify **error handling** across boundaries
- Check **data flow** between components

## Additional Resources

- See main [README.md](../README.md) for methodology details
- Check [atdd-tdd.js](../atdd-tdd.js) for process implementation
- Review TDD/ATDD references in main documentation

---

**Note**: These examples are templates. Actual implementation and test generation happens during process execution.
