---
name: api-design
description: Use when designing or building APIs, REST endpoints, or GraphQL schemas
---

# API Design

## Overview

Design APIs that are intuitive, consistent, and evolvable. Prioritize developer experience and backward compatibility.

**Core principle:** Your API is a product. Design it for its consumers.

## When to Use

- Designing new REST or GraphQL APIs
- Adding endpoints to existing APIs
- Creating API contracts or schemas
- Refactoring API structure
- Any work involving HTTP interfaces

## REST Fundamentals

### Resource-Oriented Design

Resources are nouns, not verbs:

```
GET    /users          # List users
POST   /users          # Create user
GET    /users/{id}     # Get user
PATCH  /users/{id}     # Update user
DELETE /users/{id}     # Delete user
```

<Good>
```
GET /orders/{orderId}/items
POST /orders/{orderId}/cancel
```
Resources with actions through HTTP methods
</Good>

<Bad>
```
GET /getUsers
POST /createUser
GET /getUserById
```
Verb-based endpoints
</Bad>

### HTTP Semantics

Use HTTP methods correctly:

| Method | Idempotent | Use For |
|--------|------------|---------|
| GET | Yes | Retrieval, no side effects |
| POST | No | Creating, one-time actions |
| PUT | Yes | Full replace |
| PATCH | No | Partial updates |
| DELETE | Yes | Removal |

**GET requests must be safe:** No side effects, cacheable.

### Collections and Pagination

```
GET /users?page=2&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

<Good>
```
GET /users?offset=40&limit=20
```
Offset-based for deep pagination
</Good>

<Bad>
```
GET /users?skip=40&take=20
```
Non-standard parameters
</Bad>

### Query Parameters

Filtering, sorting, and field selection:
```
GET /users?status=active&sort=createdAt desc&fields=id,name,email
```

- `filter`: Deprecated, use specific params
- `sort`: Direction required
- `fields`: Reduce payload

### Response Envelope

Standard wrapper for consistent client experience:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "abc-123"
  }
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

## GraphQL Patterns

### Schema Design

Type-first design. Define types, then queries/mutations.

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User
  users(filter: UserFilter, limit: Int, offset: Int): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

### Naming Conventions

- Use camelCase
- Singletons: `user`, not `userById`
- Lists: `users` not `userList`
- Mutations: Verb-noun `createUser`, `updateUser`, `deleteUser`

### Input Types

Wrap mutation inputs:

```graphql
input CreateUserInput {
  name: String!
  email: String!
  role: UserRole = USER
}

input UpdateUserInput {
  name: String
  email: String
}
```

Nullable for optional fields. Non-null for required.

### Connections Pattern

For lists with pagination:

```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### N+1 Prevention

Use DataLoader or equivalent:

```typescript
// Instead of resolving each user individually
async function getUsersWithPosts(userIds: string[]) {
  return dataloader.loadMany(userIds);
}
```

Batch requests, cache within request.

### Mutations and Errors

Return errors in payload:

```graphql
type CreateUserPayload {
  user: User
  errors: [ValidationError!]!
}

type ValidationError {
  field: String!
  message: String!
}
```

<Good>
```graphql
mutation {
  createUser(input: {...}) {
    user { id }
    errors { field message }
  }
}
```
Client checks errors, partial success
</Good>

<Bad>
```graphql
mutation {
  createUser(input: {...}) {
    ... on User { id }
    ... on ValidationError { field message }
  }
}
```
Using union for errors complicates client
</Bad>

## API Versioning

### URL Path Versioning

Most common, most visible:

```
/api/v1/users
/api/v2/users
```

**Rules:**
- Default version for API consumers
- Deprecate versions explicitly
- Support minimum 2 versions
- Set sunset headers on deprecated versions

### Header Versioning

For less breaking changes:

```
Accept: application/vnd.api+json; version=2
```

### Query Parameter

Less common, simple:

```
/users?version=2
```

Avoid for new APIs.

### Deprecation Strategy

1. Announce deprecation in response headers:
   ```
   Deprecation: Sat, 01 Jan 2025 00:00:00 GMT
   Sunset: Sat, 01 Jan 2025 00:00:00 GMT
   Link: <https://api.example.com/v2/users>; rel="successor-version"
   ```

2. Provide migration window (6-12 months)

3. Monitor usage, don't remove until <1% active

4. Document breaking changes per version

### What Requires New Version

| Breaking Change | Version Bump Required |
|-----------------|----------------------|
| New required field | Yes |
| Field removed | Yes |
| Response format changed | Yes |
| New enum value | No |
| New optional field | No |
| New endpoint | No |
| Error format changed | Yes |

<Good>
Adding new optional field in response: OK in current version
Adding required field in request: New version required
</Good>

## Error Handling

### HTTP Status Codes

| Status | Use For |
|--------|---------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST create |
| 204 | Successful DELETE, no content |
| 400 | Bad request, invalid input |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but unauthorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, stale state) |
| 422 | Valid request, business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal error (never expose) |

### Error Response Format

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with id '123' not found",
    "details": {
      "resourceId": "123",
      "resourceType": "user"
    },
    "requestId": "req-abc-123"
  }
}
```

### Error Codes

Human-readable codes (UPPER_SNAKE_CASE for REST, camelCase for GraphQL):

```
VALIDATION_ERROR
RESOURCE_NOT_FOUND
DUPLICATE_ENTRY
RATE_LIMIT_EXCEEDED
INSUFFICIENT_PERMISSIONS
```

**Rules:**
- Document all error codes
- Consistent across endpoints
- Include actionable message
- Include request ID for debugging

### Field-Level Errors

For validation failures:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": [
      {
        "path": "email",
        "message": "Invalid email format"
      },
      {
        "path": "age",
        "message": "Must be greater than 0"
      }
    ]
  }
}
```

### GraphQL Errors

```json
{
  "errors": [
    {
      "message": "Field 'email' is required",
      "locations": [{ "line": 3, "column": 5 }],
      "path": ["createUser", "email"],
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "email"
      }
    }
  ]
}
```

Add extensions for machine-readable codes.

## Authentication

### Authentication Methods

| Method | Use Case |
|--------|----------|
| API Keys | Server-to-server, not user-specific |
| JWT | Stateless, mobile apps |
| OAuth 2.0 | Third-party access, SSO |
| Session Cookie | Browser applications |

### API Keys

For service-to-service:

```
Header: X-API-Key: sk_live_abc123
```

<Good>
```
Authorization: ApiKey sk_live_abc123
```
Standard header format
</Good>

### JWT

Stateless tokens with claims:

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user123",
    "exp": 1705334400,
    "roles": ["user"],
    "permissions": ["read", "write"]
  }
}
```

**Rules:**
- Short expiration (15 min - 24 hours)
- Use refresh tokens for extended sessions
- Include permissions, not roles
- Verify signature, expiration, issuer, audience

### OAuth 2.0

For third-party authorization:

```
Authorization: Bearer eyJhbGci...
```

Flows:
- **Authorization Code:** Web apps, most secure
- **Client Credentials:** Service-to-service
- **Device Code:** IoT, no browser

### Authorization

After authentication, check permissions:

```typescript
// Middleware or decorator
function requirePermission(permission: string) {
  return (request: Request) => {
    const user = request.user;
    if (!user.permissions.includes(permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
```

### Scopes

OAuth scopes for fine-grained access:

```
GET /posts        # posts:read
POST /posts       # posts:write
DELETE /posts     # posts:admin
```

### Rate Limiting

Protect resources:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705334400
Retry-After: 3600
```

Strategy:
- Per-user or per-API key
- Document limits clearly
- Return 429 with retry-after
- Consider tiered limits

## Documentation

### OpenAPI Specification

Document all endpoints:

```yaml
/users:
  get:
    summary: List users
    description: Returns a paginated list of users
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
          maximum: 100
    responses:
      200:
        description: Successful response
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserList'
```

### Response Examples

Include examples for all responses:

```yaml
components:
  examples:
    UserResponse:
      value:
        data:
          - id: 1
            name: John Doe
            email: john@example.com
```

## Checklist

Before completing API design:

- [ ] Resources are noun-based
- [ ] HTTP methods used correctly
- [ ] Consistent naming convention
- [ ] Pagination implemented for lists
- [ ] Error responses documented
- [ ] HTTP status codes appropriate
- [ ] Authentication method selected
- [ ] Authorization checked after auth
- [ ] Rate limiting documented
- [ ] Versioning strategy defined
- [ ] OpenAPI spec updated
- [ ] Breaking changes considered for versioning

## When Stuck

| Problem | Solution |
|---------|----------|
| Confused about verb vs noun | Ask "what is the resource?" not "what is the action?" |
| Not sure about versioning | Default to URL path, add later if needed |
| Error codes unclear | List all error cases per endpoint first |
| Auth/authz confusion | Auth = who are you? Authz = what can you do? |