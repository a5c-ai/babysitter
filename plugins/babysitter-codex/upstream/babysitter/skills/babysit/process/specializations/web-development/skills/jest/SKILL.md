---
name: jest
description: Jest configuration, mocking strategies, snapshot testing, and coverage.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Jest Skill

Expert assistance for testing with Jest.

## Capabilities

- Configure Jest for various frameworks
- Implement mocking strategies
- Write snapshot tests
- Configure coverage
- Handle async testing

## Test Patterns

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    service = new UserService(mockRepository);
  });

  it('should return all users', async () => {
    mockRepository.findAll.mockResolvedValue([{ id: '1', name: 'John' }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
```

## Target Processes

- unit-testing
- integration-testing
- tdd-development
