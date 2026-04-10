---
name: logging-and-observability
description: Use when setting up application logging, metrics, monitoring, or debugging production issues
---

# Logging and Observability

## Overview

Effective observability means you can answer questions about your system without deploying new code. The three pillars—logs, metrics, and traces—work together to provide visibility into production systems.

## When to Use

Use this skill when:
- Setting up logging for a new service
- Investigating production incidents
- Designing metrics and alerting
- Debugging performance issues
- Building dashboards

Don't use for:
- Code review (see security-review skill)
- Test failures (see systematic-debugging skill)

## Core Principle

**Log for debugging, instrument for measurement.**

Logs tell you what happened. Metrics tell you how often. Traces tell you where.

## Logging Levels

Choose the right level for the right message:

| Level | Use When |
|-------|----------|
| **ERROR** | Something failed and needs attention |
| **WARN** | Unexpected but recoverable |
| **INFO** | Normal business events |
| **DEBUG** | Detailed troubleshooting info |

**Rules:**
- ERRORs should wake someone up (if alerting is set up)
- INFO should be sparse in production (filtered by default)
- DEBUG should never appear in production logs
- Every log should answer: "What decision would this change?"

## Structured Logging

Always log structured data, not concatenated strings:

```python
# Bad
logger.info(f"User {user_id} purchased {item_count} items")

# Good
logger.info("Purchase completed", extra={
    "user_id": user_id,
    "item_count": item_count,
    "total": total,
    "currency": "USD"
})
```

**Required fields for every log:**
- `timestamp`: When it happened
- `level`: ERROR/WARN/INFO/DEBUG
- `message`: What happened (not "processing request")
- `context`: Relevant identifiers (user_id, request_id, etc.)

**Context propagation:**
- Request IDs should flow through all services
- Correlation IDs link related log entries
- Use these to trace requests across services

## Metrics

### The Four Golden Signals

Monitor these for any service:

| Signal | Measures | Alert Threshold |
|--------|----------|------------------|
| **Latency** | Response time | p95 > 500ms |
| **Errors** | Failure rate | > 1% |
| **Traffic** | Requests/second | Near capacity |
| **Saturation** | Resource usage | > 80% |

### Metric Types

**Counters:** Number of occurrences (e.g., requests, errors)
```python
requests_total.increment()  # Always increasing
```

**Gauges:** Current value at a point in time (e.g., memory usage)
```python
memory_used.set(current_mb)  # Can go up or down
```

**Histograms:** Distribution of values (e.g., request latency)
```python
request_duration.observe(duration_ms)  # Buckets for percentiles
```

### Naming Conventions

```
<service>_<component>_<metric_name>_total
<service>_<component>_<metric_name>_seconds
```

- Use underscores, not camelCase
- Use _total suffix for counters
- Use _seconds suffix for durations
- Be consistent across services

## Tracing

Distributed tracing tracks requests across service boundaries:

```
[Service A] ──HTTP──> [Service B] ──RPC──> [Service C]
   │                  │                   │
   +─ span A          +─ span B           +─ span C
```

**Span structure:**
- `trace_id`: Unique request identifier
- `span_id`: This operation's identifier
- `parent_id`: Calling span (if any)
- `operation_name`: What happened
- `start_time`, `end_time`: Duration
- `tags`: Key-value metadata

**Best practices:**
- Add trace context to all outgoing requests
- Instrument external calls (DB, HTTP, queue)
- Tag spans with relevant context (user_id, endpoint)
- Don't trace 100% of requests if high volume (sample intelligently)

## Alerting

### Alert Design Principles

**Every alert should have:**
1. A clear action (who responds)
2. A specific threshold (what triggers)
3. A runbook link (what to do)

**Alert fatigue kills observability.**

### Common Alert Rules

```yaml
# High error rate
- name: high_error_rate
  metric: errors_total / requests_total
  threshold: > 0.01  # 1%
  duration: 5m

# High latency
- name: slow_requests
  metric: request_duration_p95_seconds
  threshold: > 1.0  # 1 second
  duration: 5m

# Resource saturation
- name: memory_saturation
  metric: memory_usage_percent
  threshold: > 80
  duration: 5m
```

**Never alert on:**
- First occurrences (wait for duration)
- Metrics without runbooks
- Alerts you ignore

## Debugging Production Issues

### Investigation Workflow

1. **Start with metrics** - What changed? When?
2. **Find related logs** - Use trace/request IDs
3. **Check traces** - Where in the path is the issue?
4. **Add context** - What was the request?

### What to Log for Debugging

Log these events:
- Entry/exit of significant operations
- External calls (with duration and status)
- Validation failures
- Rate limiting events
- Key business milestones

Don't log:
- Every function call (noise)
- Sensitive data (PII, secrets)
- Repeated failures (spam)

### Common Patterns

**Request/response logging:**
```python
def handle_request(req):
    logger.info("Request started", extra={"request_id": req.id})
    try:
        result = process(req)
        logger.info("Request completed", extra={
            "request_id": req.id,
            "duration_ms": timer.elapsed()
        })
        return result
    except Exception as e:
        logger.error("Request failed", extra={
            "request_id": req.id,
            "error": str(e)
        }, exc_info=True)
        raise
```

**Performance logging:**
```python
# At operation boundaries
start = time.now()
result = db.query(...)
logger.debug("DB query", extra={
    "query": query[:200],  # Truncate long queries
    "duration_ms": (time.now() - start) * 1000,
    "rows": len(result)
})
```

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Logging at INFO in hot path | Performance hit | Use DEBUG |
| Missing request IDs | Can't trace | Add to all logs |
| Not logging durations | No performance data | Time all operations |
| Alerting on first failure | Alert fatigue | Use duration thresholds |
| Logging PII | Compliance violation | Scrub sensitive data |
| No structured format | Can't search | Use JSON/logfmt |

## Quick Reference

| Need | Tool |
|------|------|
| What happened? | Logs |
| How often? | Counters |
| How slow? | Latency histogram |
| Where in stack? | Traces |
| What's broken? | Alerts |

## Real-World Impact

Good observability reduces incident time:
- With logs + metrics: 30 min → 10 min
- Adding traces: 10 min → 3 min
- Proper alerts: 3 min → 30 sec
