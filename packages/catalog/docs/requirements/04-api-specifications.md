# Process Library Catalog - API Specifications

**Version:** 1.0.0
**Base URL:** `/api`
**Content-Type:** `application/json`

---

## Table of Contents

1. [Overview](#overview)
2. [Common Response Format](#common-response-format)
3. [Error Handling](#error-handling)
4. [Pagination](#pagination)
5. [Search API](#search-api)
6. [Processes API](#processes-api)
7. [Agents API](#agents-api)
8. [Skills API](#skills-api)
9. [Domains API](#domains-api)
10. [Specializations API](#specializations-api)
11. [Analytics API](#analytics-api)
12. [Reindex API](#reindex-api)

---

## Overview

The Process Library Catalog API provides RESTful endpoints for accessing and managing a catalog of processes, agents, skills, domains, and specializations. All endpoints return JSON responses wrapped in a standard response format.

### Authentication

Currently, no authentication is required for API access.

### Rate Limiting

No rate limiting is currently implemented.

---

## Common Response Format

All API responses follow a standard wrapper format:

### Success Response

```json
{
  "success": true,
  "data": <response_data>,
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "additional_context"
    }
  }
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `VALIDATION_ERROR` | 400 | Required parameter missing or invalid |
| `NOT_FOUND` | 404 | Requested resource not found |
| `INTERNAL_ERROR` | 500 | Server-side error |

### Error Response Examples

**Validation Error (400)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Query parameter 'q' is required",
    "details": {
      "field": "q"
    }
  }
}
```

**Not Found Error (404)**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Agent with identifier 'unknown-agent' not found"
  }
}
```

**Internal Server Error (500)**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Pagination

List endpoints support pagination through query parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 20 | 100 | Number of items per page |
| `offset` | integer | 0 | - | Number of items to skip |
| `sort` | string | varies | - | Field to sort by |
| `order` | string | asc | - | Sort order: `asc` or `desc` |

### Pagination Metadata

```json
{
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

---

## Search API

### GET /api/search

Full-text search across all entity types (agents, skills, processes, domains, specializations).

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | **Yes** | - | Search query string |
| `type` | string | No | agent,skill,process | Entity type filter |
| `limit` | integer | No | 20 | Results per page (max 100) |
| `offset` | integer | No | 0 | Pagination offset |

**Valid type values:** `agent`, `skill`, `process`, `domain`, `specialization`

#### Response

```typescript
interface SearchResultItem {
  type: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  id: number;
  name: string;
  description: string;
  path: string;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
    content?: string;
  };
}
```

#### Example Request

```http
GET /api/search?q=authentication&type=agent&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "type": "agent",
      "id": 5,
      "name": "Authentication Specialist",
      "description": "Handles user authentication and authorization",
      "path": "/agents/security/authentication-specialist",
      "score": 0.95,
      "highlights": {
        "name": "<mark>Authentication</mark> Specialist",
        "description": "Handles user <mark>authentication</mark> and authorization"
      }
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Missing `q` parameter |
| 500 | INTERNAL_ERROR | Database or search error |

---

## Processes API

### GET /api/processes

List all processes with optional filtering and pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | - | Filter by process category |
| `limit` | integer | No | 20 | Results per page (max 100) |
| `offset` | integer | No | 0 | Pagination offset |
| `sort` | string | No | id | Sort field |
| `order` | string | No | asc | Sort order |

**Valid sort fields:** `id`, `processId`, `category`, `createdAt`, `updatedAt`

#### Response

```typescript
interface ProcessListItem {
  id: number;
  processId: string;
  description: string;
  category: string | null;
  filePath: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Example Request

```http
GET /api/processes?category=deployment&sort=updatedAt&order=desc&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "processId": "deploy-kubernetes",
      "description": "Deploy application to Kubernetes cluster",
      "category": "deployment",
      "filePath": "/processes/deployment/deploy-kubernetes.yaml",
      "taskCount": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### GET /api/processes/{id}

Get detailed information about a specific process.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | **Yes** | Process ID (must be positive integer) |

#### Response

```typescript
interface ProcessDetail {
  id: number;
  processId: string;
  description: string;
  category: string | null;
  filePath: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
  inputs: ProcessIO[];
  outputs: ProcessIO[];
  tasks: ProcessTask[];
  frontmatter: Record<string, unknown>;
}

interface ProcessIO {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

interface ProcessTask {
  id: string;
  type: string;
  description?: string;
  [key: string]: unknown;
}
```

#### Example Request

```http
GET /api/processes/1
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "processId": "deploy-kubernetes",
    "description": "Deploy application to Kubernetes cluster",
    "category": "deployment",
    "filePath": "/processes/deployment/deploy-kubernetes.yaml",
    "taskCount": 3,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z",
    "inputs": [
      {
        "name": "image",
        "type": "string",
        "description": "Docker image to deploy",
        "required": true
      },
      {
        "name": "replicas",
        "type": "integer",
        "description": "Number of replicas",
        "required": false
      }
    ],
    "outputs": [
      {
        "name": "deployment_url",
        "type": "string",
        "description": "URL of deployed application"
      }
    ],
    "tasks": [
      {
        "id": "build-image",
        "type": "build",
        "description": "Build Docker image"
      },
      {
        "id": "push-registry",
        "type": "push",
        "description": "Push to container registry"
      },
      {
        "id": "deploy",
        "type": "kubectl",
        "description": "Apply Kubernetes manifests"
      }
    ],
    "frontmatter": {
      "version": "1.0",
      "author": "platform-team"
    }
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | BAD_REQUEST | Invalid or missing ID parameter |
| 400 | BAD_REQUEST | ID must be a positive integer |
| 404 | NOT_FOUND | Process not found |
| 500 | INTERNAL_ERROR | Database error |

---

## Agents API

### GET /api/agents

List all agents with optional filtering and pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `specialization` | string | No | - | Filter by specialization name |
| `domain` | string | No | - | Filter by domain name |
| `expertise` | string | No | - | Filter by expertise (partial match) |
| `limit` | integer | No | 20 | Results per page (max 100) |
| `offset` | integer | No | 0 | Pagination offset |
| `sort` | string | No | name | Sort field |
| `order` | string | No | asc | Sort order |

**Valid sort fields:** `name`, `domain`, `specialization`, `role`, `createdAt`, `updatedAt`

#### Response

```typescript
interface AgentListItem {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  role: string | null;
  expertise: string[];
  specializationId: number | null;
  specializationName: string | null;
  domainId: number | null;
  domainName: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### Example Request

```http
GET /api/agents?domain=security&sort=name&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Authentication Specialist",
      "description": "Handles user authentication and authorization",
      "filePath": "/agents/security/authentication/specialist.md",
      "directory": "/agents/security/authentication",
      "role": "Security Engineer",
      "expertise": ["OAuth2", "JWT", "SSO", "MFA"],
      "specializationId": 3,
      "specializationName": "Authentication",
      "domainId": 1,
      "domainName": "Security",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-18T16:30:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### GET /api/agents/{slug}

Get detailed information about a specific agent by name.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | **Yes** | Agent name |

#### Response

```typescript
interface AgentDetail {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  role: string | null;
  expertise: string[];
  specializationId: number | null;
  specializationName: string | null;
  domainId: number | null;
  domainName: string | null;
  createdAt: string;
  updatedAt: string;
  content: string;
  frontmatter: Record<string, unknown>;
}
```

#### Example Request

```http
GET /api/agents/Authentication%20Specialist
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Authentication Specialist",
    "description": "Handles user authentication and authorization",
    "filePath": "/agents/security/authentication/specialist.md",
    "directory": "/agents/security/authentication",
    "role": "Security Engineer",
    "expertise": ["OAuth2", "JWT", "SSO", "MFA"],
    "specializationId": 3,
    "specializationName": "Authentication",
    "domainId": 1,
    "domainName": "Security",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-18T16:30:00Z",
    "content": "# Authentication Specialist\n\nThis agent handles all authentication-related tasks...",
    "frontmatter": {
      "version": "2.0",
      "tags": ["security", "auth", "identity"]
    }
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | BAD_REQUEST | Invalid or missing slug parameter |
| 404 | NOT_FOUND | Agent not found |
| 500 | INTERNAL_ERROR | Database error |

---

## Skills API

### GET /api/skills

List all skills with optional filtering and pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `specialization` | string | No | - | Filter by specialization name |
| `domain` | string | No | - | Filter by domain name |
| `category` | string | No | - | Filter by category (directory pattern match) |
| `limit` | integer | No | 20 | Results per page (max 100) |
| `offset` | integer | No | 0 | Pagination offset |
| `sort` | string | No | name | Sort field |
| `order` | string | No | asc | Sort order |

**Valid sort fields:** `name`, `domain`, `specialization`, `createdAt`, `updatedAt`

#### Response

```typescript
interface SkillListItem {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  specializationId: number | null;
  specializationName: string | null;
  domainId: number | null;
  domainName: string | null;
  allowedTools: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Example Request

```http
GET /api/skills?domain=development&sort=name&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "Code Review",
      "description": "Perform thorough code reviews",
      "filePath": "/skills/development/code-review.md",
      "directory": "/skills/development",
      "specializationId": 5,
      "specializationName": "Quality Assurance",
      "domainId": 2,
      "domainName": "Development",
      "allowedTools": ["git", "diff", "lint"],
      "createdAt": "2024-01-05T09:00:00Z",
      "updatedAt": "2024-01-15T11:20:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### GET /api/skills/{slug}

Get detailed information about a specific skill by name.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | **Yes** | Skill name |

#### Response

```typescript
interface SkillDetail {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  specializationId: number | null;
  specializationName: string | null;
  domainId: number | null;
  domainName: string | null;
  allowedTools: string[];
  createdAt: string;
  updatedAt: string;
  content: string;
  frontmatter: Record<string, unknown>;
}
```

#### Example Request

```http
GET /api/skills/Code%20Review
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Code Review",
    "description": "Perform thorough code reviews",
    "filePath": "/skills/development/code-review.md",
    "directory": "/skills/development",
    "specializationId": 5,
    "specializationName": "Quality Assurance",
    "domainId": 2,
    "domainName": "Development",
    "allowedTools": ["git", "diff", "lint"],
    "createdAt": "2024-01-05T09:00:00Z",
    "updatedAt": "2024-01-15T11:20:00Z",
    "content": "# Code Review Skill\n\nThis skill enables systematic code review...",
    "frontmatter": {
      "difficulty": "intermediate",
      "estimated_time": "30m"
    }
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | BAD_REQUEST | Invalid or missing slug parameter |
| 404 | NOT_FOUND | Skill not found |
| 500 | INTERNAL_ERROR | Database error |

---

## Domains API

### GET /api/domains

List all domains with hierarchy information and counts.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | - | Filter by category |
| `limit` | integer | No | 50 | Results per page (max 100) |
| `offset` | integer | No | 0 | Pagination offset |
| `sort` | string | No | name | Sort field |
| `order` | string | No | asc | Sort order |

**Valid sort fields:** `name`, `category`, `createdAt`, `updatedAt`

#### Response

```typescript
interface DomainListItem {
  id: number;
  name: string;
  path: string;
  category: string | null;
  specializationCount: number;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Example Request

```http
GET /api/domains?sort=name&order=asc
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Security",
      "path": "/domains/security",
      "category": "infrastructure",
      "specializationCount": 4,
      "agentCount": 12,
      "skillCount": 25,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    },
    {
      "id": 2,
      "name": "Development",
      "path": "/domains/development",
      "category": "engineering",
      "specializationCount": 6,
      "agentCount": 20,
      "skillCount": 45,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-19T15:30:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### GET /api/domains/{slug}

Get detailed information about a specific domain with its specializations.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | **Yes** | Domain name |

#### Response

```typescript
interface DomainDetail {
  id: number;
  name: string;
  path: string;
  category: string | null;
  specializationCount: number;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
  readmePath: string | null;
  referencesPath: string | null;
  specializations: SpecializationSummary[];
}

interface SpecializationSummary {
  id: number;
  name: string;
  path: string;
  agentCount: number;
  skillCount: number;
}
```

#### Example Request

```http
GET /api/domains/Security
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Security",
    "path": "/domains/security",
    "category": "infrastructure",
    "specializationCount": 4,
    "agentCount": 12,
    "skillCount": 25,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-20T12:00:00Z",
    "readmePath": "/domains/security/README.md",
    "referencesPath": "/domains/security/references.md",
    "specializations": [
      {
        "id": 3,
        "name": "Authentication",
        "path": "/domains/security/authentication",
        "agentCount": 3,
        "skillCount": 8
      },
      {
        "id": 4,
        "name": "Authorization",
        "path": "/domains/security/authorization",
        "agentCount": 2,
        "skillCount": 5
      }
    ]
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | BAD_REQUEST | Invalid or missing slug parameter |
| 404 | NOT_FOUND | Domain not found |
| 500 | INTERNAL_ERROR | Database error |

---

## Specializations API

### GET /api/specializations

List all specializations with optional domain filter.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `domain` | string | No | - | Filter by domain name |
| `limit` | integer | No | 50 | Results per page (max 100) |
| `offset` | integer | No | 0 | Pagination offset |
| `sort` | string | No | name | Sort field |
| `order` | string | No | asc | Sort order |

**Valid sort fields:** `name`, `domain`, `createdAt`, `updatedAt`

#### Response

```typescript
interface SpecializationListItem {
  id: number;
  name: string;
  path: string;
  domainId: number | null;
  domainName: string | null;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Example Request

```http
GET /api/specializations?domain=Security&sort=name
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Authentication",
      "path": "/domains/security/authentication",
      "domainId": 1,
      "domainName": "Security",
      "agentCount": 3,
      "skillCount": 8,
      "createdAt": "2024-01-02T00:00:00Z",
      "updatedAt": "2024-01-18T10:00:00Z"
    },
    {
      "id": 4,
      "name": "Authorization",
      "path": "/domains/security/authorization",
      "domainId": 1,
      "domainName": "Security",
      "agentCount": 2,
      "skillCount": 5,
      "createdAt": "2024-01-02T00:00:00Z",
      "updatedAt": "2024-01-17T14:00:00Z"
    }
  ],
  "meta": {
    "total": 4,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### GET /api/specializations/{slug}

Get detailed information about a specific specialization with its agents and skills.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | **Yes** | Specialization name |

#### Response

```typescript
interface SpecializationDetail {
  id: number;
  name: string;
  path: string;
  domainId: number | null;
  domainName: string | null;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
  readmePath: string | null;
  referencesPath: string | null;
  agents: AgentSummary[];
  skills: SkillSummary[];
}

interface AgentSummary {
  id: number;
  name: string;
  description: string;
  role: string | null;
}

interface SkillSummary {
  id: number;
  name: string;
  description: string;
}
```

#### Example Request

```http
GET /api/specializations/Authentication
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Authentication",
    "path": "/domains/security/authentication",
    "domainId": 1,
    "domainName": "Security",
    "agentCount": 3,
    "skillCount": 8,
    "createdAt": "2024-01-02T00:00:00Z",
    "updatedAt": "2024-01-18T10:00:00Z",
    "readmePath": "/domains/security/authentication/README.md",
    "referencesPath": null,
    "agents": [
      {
        "id": 5,
        "name": "Authentication Specialist",
        "description": "Handles user authentication and authorization",
        "role": "Security Engineer"
      },
      {
        "id": 6,
        "name": "OAuth Expert",
        "description": "Specializes in OAuth2 implementations",
        "role": "Integration Specialist"
      }
    ],
    "skills": [
      {
        "id": 15,
        "name": "JWT Token Management",
        "description": "Create and validate JWT tokens"
      },
      {
        "id": 16,
        "name": "SSO Integration",
        "description": "Implement single sign-on solutions"
      }
    ]
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | BAD_REQUEST | Invalid or missing slug parameter |
| 404 | NOT_FOUND | Specialization not found |
| 500 | INTERNAL_ERROR | Database error |

---

## Analytics API

### GET /api/analytics

Get dashboard metrics and statistics about the catalog.

#### Query Parameters

None

#### Response

```typescript
interface AnalyticsResponse {
  counts: {
    domains: number;
    specializations: number;
    agents: number;
    skills: number;
    processes: number;
    total: number;
  };
  distributions: {
    byDomain: EntityDistribution[];
    byCategory: EntityDistribution[];
    byType: EntityDistribution[];
  };
  recentActivity: RecentActivityItem[];
  databaseSize: number;
  lastIndexedAt: string | null;
}

interface EntityDistribution {
  name: string;
  count: number;
}

interface RecentActivityItem {
  type: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  id: number;
  name: string;
  updatedAt: string;
}
```

#### Example Request

```http
GET /api/analytics
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "counts": {
      "domains": 8,
      "specializations": 24,
      "agents": 45,
      "skills": 120,
      "processes": 35,
      "total": 232
    },
    "distributions": {
      "byDomain": [
        { "name": "Development", "count": 65 },
        { "name": "Security", "count": 37 },
        { "name": "Infrastructure", "count": 28 }
      ],
      "byCategory": [
        { "name": "deployment", "count": 12 },
        { "name": "testing", "count": 8 },
        { "name": "monitoring", "count": 6 }
      ],
      "byType": [
        { "name": "agents", "count": 45 },
        { "name": "skills", "count": 120 },
        { "name": "processes", "count": 35 },
        { "name": "domains", "count": 8 },
        { "name": "specializations", "count": 24 }
      ]
    },
    "recentActivity": [
      {
        "type": "agent",
        "id": 5,
        "name": "Authentication Specialist",
        "updatedAt": "2024-01-20T14:30:00Z"
      },
      {
        "type": "skill",
        "id": 12,
        "name": "Code Review",
        "updatedAt": "2024-01-20T13:45:00Z"
      },
      {
        "type": "process",
        "id": 1,
        "name": "deploy-kubernetes",
        "updatedAt": "2024-01-20T12:00:00Z"
      }
    ],
    "databaseSize": 2457600,
    "lastIndexedAt": "2024-01-20T10:00:00Z"
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 500 | INTERNAL_ERROR | Database error |

---

## Reindex API

### POST /api/reindex

Trigger a database rebuild/reindex operation.

#### Request Body

```typescript
interface ReindexRequest {
  force?: boolean;  // If true, performs full reindex; otherwise incremental
}
```

#### Example Request

```http
POST /api/reindex
Content-Type: application/json

{
  "force": true
}
```

#### Response

```typescript
interface ReindexResponse {
  success: boolean;
  statistics: {
    domainsIndexed: number;
    specializationsIndexed: number;
    agentsIndexed: number;
    skillsIndexed: number;
    processesIndexed: number;
    filesProcessed: number;
    errors: number;
    duration: number;
  };
  errors: Array<{ file: string; error: string }>;
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "statistics": {
      "domainsIndexed": 8,
      "specializationsIndexed": 24,
      "agentsIndexed": 45,
      "skillsIndexed": 120,
      "processesIndexed": 35,
      "filesProcessed": 232,
      "errors": 0,
      "duration": 1523
    },
    "errors": []
  }
}
```

#### Error Response Example (with indexing errors)

```json
{
  "success": true,
  "data": {
    "success": false,
    "statistics": {
      "domainsIndexed": 8,
      "specializationsIndexed": 24,
      "agentsIndexed": 44,
      "skillsIndexed": 118,
      "processesIndexed": 35,
      "filesProcessed": 229,
      "errors": 3,
      "duration": 1845
    },
    "errors": [
      {
        "file": "/agents/broken-agent.md",
        "error": "Invalid YAML frontmatter"
      },
      {
        "file": "/skills/invalid-skill.md",
        "error": "Missing required field: description"
      }
    ]
  }
}
```

---

### GET /api/reindex

Alternative GET endpoint for triggering reindex (useful for testing).

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | string | No | false | Set to "true" for full reindex |

#### Example Request

```http
GET /api/reindex?force=true
```

#### Response

Same as POST /api/reindex

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 500 | INTERNAL_ERROR | Indexing failed |

---

## Appendix: Type Definitions Summary

### Common Types

```typescript
// Standard API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

// API error structure
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination metadata
interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Common query parameters
interface ListQueryParams {
  limit?: number;   // Default: 20, Max: 100
  offset?: number;  // Default: 0
  sort?: string;
  order?: 'asc' | 'desc';
}
```

### Entity Types

| Entity | List Type | Detail Type |
|--------|-----------|-------------|
| Process | `ProcessListItem` | `ProcessDetail` |
| Agent | `AgentListItem` | `AgentDetail` |
| Skill | `SkillListItem` | `SkillDetail` |
| Domain | `DomainListItem` | `DomainDetail` |
| Specialization | `SpecializationListItem` | `SpecializationDetail` |

---

## Changelog

### Version 1.0.0

- Initial API specification
- Endpoints: search, processes, agents, skills, domains, specializations, analytics, reindex
- Standard response format with pagination support
- Comprehensive error handling
