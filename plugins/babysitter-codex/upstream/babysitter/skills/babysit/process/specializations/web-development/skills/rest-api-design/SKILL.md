---
name: rest-api-design
description: RESTful API design principles, versioning, pagination, HATEOAS, and documentation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# REST API Design Skill

Expert assistance for designing RESTful APIs following best practices.

## Capabilities

- Design resource-oriented APIs
- Implement proper HTTP methods and status codes
- Configure API versioning strategies
- Implement pagination patterns
- Design error responses
- Apply HATEOAS principles

## Usage

Invoke this skill when you need to:
- Design new REST APIs
- Review existing API design
- Implement pagination
- Define error handling
- Version APIs

## Design Principles

### Resource Naming

```
# Good - nouns, plural
GET /api/users
GET /api/users/123
GET /api/users/123/posts

# Bad - verbs, actions in URL
GET /api/getUsers
GET /api/users/123/getPosts
POST /api/createUser
```

### HTTP Methods

| Method | Usage | Response |
|--------|-------|----------|
| GET | Read resource | 200 OK |
| POST | Create resource | 201 Created |
| PUT | Replace resource | 200 OK |
| PATCH | Partial update | 200 OK |
| DELETE | Remove resource | 204 No Content |

### Pagination Response

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "links": {
    "self": "/api/users?page=1",
    "next": "/api/users?page=2",
    "prev": null
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## Best Practices

- Use proper HTTP status codes
- Implement consistent error responses
- Version APIs from the start
- Document with OpenAPI

## Target Processes

- api-design
- backend-development
- microservices-architecture
