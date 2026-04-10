---
name: security-review
description: Use when reviewing code for security vulnerabilities or implementing authentication/authorization
---

# Security Review

## Overview

Systematically identify and mitigate security vulnerabilities in code. Security reviews are mandatory for any code handling authentication, authorization, user input, or sensitive data.

## When to Use

**Always:**
- Reviewing code that handles authentication or authorization
- Reviewing code that processes user input
- Reviewing code that handles sensitive data (credentials, tokens, PII)
- Implementing authentication/authorization systems
- Adding new external APIs or integrations

**Common triggers:**
- New authentication flows
- Password reset or recovery
- Payment or billing code
- File upload handling
- Database queries with user input
- API endpoints with access control
- Session management

## The Process

### 1. Identify the Attack Surface

Map all entry points where untrusted input can enter the system:
- HTTP request parameters (query, body, headers)
- File uploads
- Database queries
- External API calls
- Environment variables
- Command-line arguments

### 2. Apply OWASP Top 10

Reference the current OWASP Top 10 for common vulnerability categories:

| Category | What to Check |
|----------|---------------|
| **A01: Broken Access Control** | Vertical/horizontal privilege escalation, IDOR, insecure direct object references |
| **A02: Cryptographic Failures** | Weak encryption, improper key management, sensitive data exposure |
| **A03: Injection** | SQL, NoSQL, OS command, LDAP, XPath injection |
| **A04: Insecure Design** | Missing security controls, business logic flaws |
| **A05: Security Misconfiguration** | Default credentials, verbose errors, missing patches |
| **A06: Vulnerable Components** | Outdated dependencies, unpatched libraries |
| **A07: Auth Failures** | Weak passwords, session fixation, credential handling |
| **A08: Data Integrity Failures** | Unsigned data, improper validation |
| **A09: Logging Failures** | Missing audit logs, logging sensitive data |
| **A10: SSRF** | Server-side requests to internal services |

### 3. Input Validation Checklist

- [ ] All input validated against allowlist where possible
- [ ] Length limits enforced
- [ ] Type validation (string, number, array, etc.)
- [ ] Format validation (email, URL, date, etc.)
- [ ] Input sanitized for context (HTML, SQL, shell)
- [ ] File uploads validated by content type, not extension
- [ ] Uploaded files stored outside web root with generated names

### 4. Authentication Checklist

- [ ] Passwords hashed with bcrypt/Argon2 (NOT MD5, SHA-1, SHA-256)
- [ ] Passwords meet complexity requirements (min 12 chars, mixed case, numbers, symbols)
- [ ] Account lockout after failed attempts (5-10 attempts)
- [ ] Rate limiting on login endpoints
- [ ] Multi-factor authentication available
- [ ] Session tokens are random, sufficient entropy (256-bit minimum)
- [ ] Sessions expire after inactivity (30 min typical)
- [ ] Secure session storage (server-side, not client-exposed)

### 5. Authorization Checklist

- [ ] Access control checks on every protected resource
- [ ] Role-based access control (RBAC) or similar enforced
- [ ] Least privilege principle followed
- [ ] IDOR vulnerabilities checked (users can only access their own resources)
- [ ] Horizontal privilege escalation prevented
- [ ] Vertical privilege escalation prevented

### 6. Secrets Management Checklist

- [ ] No hardcoded credentials in source code
- [ ] Secrets stored in environment variables or secrets manager
- [ ] API keys, tokens, credentials not logged
- [ ] Secrets not exposed in error messages
- [ ] Database credentials use least-privilege accounts
- [ ] Third-party API keys rotated periodically

### 7. Secure Coding Practices

**Never do this:**
```javascript
// SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Command Injection
exec(`grep ${userInput} /var/logs`);

// Path Traversal
fs.readFile(`uploads/${filename}`);

// XSS (reflected)
res.send(`<h1>Hello ${userName}</h1>`);

// Hardcoded secret
const apiKey = "sk-1234567890abcdef";
```

**Always do this:**
```javascript
// Parameterized SQL
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// Input validation
const schema = Joi.object({ userId: Joi.number().integer().positive() });
const { error, value } = schema.validate({ userId });

// Sanitized output
res.send(`<h1>Hello ${escapeHtml(userName)}</h1>`);

// Environment variables
const apiKey = process.env.API_KEY;

// Path validation
const safePath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
```

## Common Vulnerabilities

### Injection

| Type | Bad | Good |
|------|-----|------|
| SQL | `WHERE id = ${input}` | `WHERE id = ?` |
| NoSQL | `{ username: input }` | `{ username: sanitize(input) }` |
| Command | `exec(input)` | `execFile([arg])` |
| LDAP | `uid=${input},ou=users` | Escape LDAP special chars |

### Authentication

| Issue | Fix |
|-------|-----|
| Plain text passwords | bcrypt with cost factor 10+ |
| No rate limiting | Implement rate limiter (5 req/sec) |
| Predictable tokens | `crypto.randomBytes(32)` |
| Missing session expiry | 30-minute inactivity timeout |
| Overly permissive CORS | Restrict to specific origins |

### Authorization

| Issue | Fix |
|-------|-----|
| Missing access check | Add check to every protected route |
| Client-side only | Enforce on server, verify on every request |
| IDOR | Verify ownership before access |
| Static role checks | Query-based role verification |

### Data Exposure

| Issue | Fix |
|-------|-----|
| Sensitive in logs | Never log passwords, tokens, PII |
| Verbose errors | Generic errors, detailed on server logs only |
| Cache sensitive data | Set no-store for auth responses |
| Missing HTTPS | Redirect HTTP to HTTPS, HSTS |

## Review Checklist

Before marking work complete:

- [ ] All user input validated and sanitized
- [ ] Authentication uses secure password hashing
- [ ] Sessions expire and use secure tokens
- [ ] Authorization enforced on all protected resources
- [ ] No hardcoded secrets in code
- [ ] Dependencies are up-to-date
- [ ] Security headers configured (CSP, X-Frame-Options, HSTS)
- [ ] No sensitive data in logs
- [ ] Error messages don't leak information

## Secure Defaults

When implementing new features, always:

1. **Deny by default** — require explicit permission for access
2. **Fail securely** — errors should not grant additional access
3. **Validate on server** — never trust client-side validation
4. **Log security events** — failed logins, access denied, etc.
5. **Use HTTPS** — all auth flows must be over TLS
6. **Keep sessions short** — 30 minutes or less
7. **Use secure random** — `crypto.randomBytes()`, not `Math.random()`

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Code Review Guide: https://owasp.org/www-project-code-review-guide/
- CWE Top 25: https://cwe.mitre.org/data/published/cwe_top_25/
