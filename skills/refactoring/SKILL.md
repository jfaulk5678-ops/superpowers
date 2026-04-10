---
name: refactoring
description: "Use when improving existing code structure, simplifying logic, or cleaning up technical debt."
---

# Refactoring Skill

## Overview

Refactor existing code to improve structure and maintainability while preserving behavior. Follow safe, incremental steps that keep tests passing throughout.

## When to Refactor

Refactor when you encounter:

- **Duplicated code** — patterns repeated 3+ times
- **Long functions** — doing multiple things (SRP violations)
- **Tight coupling** — changes require cascading modifications
- **Poor names** — unclear intent despite working code
- **Missing tests** — code works but has no test coverage
- **Outdated patterns** — using deprecated approaches

Do NOT refactor:
- Code you don't understand
- Code without tests (that you added)
- Code outside your scope
- Working features "just because"

<ANTI-PATTERN>
"Doing a big refactor to clean things up" — large rewrites introduce bugs and miss deadlines.
</ANTI-PATTERN>

## Safe Refactoring Steps

### Boy Scout Rule

Leave code cleaner than you found it. Small, focused improvements:

```
1. Fix a naming issue you encounter
2. Extract one clear helper function
3. Remove obvious duplication (one instance)
4. Add a test for uncovered behavior
```

Limit to one small change per session. Batch similar small refactors together.

### Workflow

```
digraph refactoring {
    "Identify target" [shape=box];
    "Add test first" [shape=diamond];
    "Make small change" [shape=box];
    "Verify tests pass" [shape=diamond];
    "Commit" [shape=box];

    "Identify target" -> "Add test first";
    "Add test first" -> "Make small change";
    "Make small change" -> "Verify tests pass";
    "Verify tests pass" -> "Commit" [label="yes"];
    "Verify tests pass" -> "Make small change" [label="no, fix"];
}
```

### Step Details

1. **Identify target** — specific function, file, or pattern to improve
2. **Add test first** — verify current behavior before changes
3. **Make small change** — one improvement at a time
4. **Verify tests pass** — confirm behavior preserved
5. **Commit** — small, focused commit with context

## Testing During Refactor

### Before Starting

- Ensure existing tests pass
- Add missing tests for untested code you're touching
- Understand what's being tested

### During Changes

- Run tests after EVERY change
- Keep tests green — never commit failing tests
- Add tests for new behavior you extract

### After Completing

- All original tests pass
- New tests cover extracted code
- Behavior is identical

<STRICT-RULE>
No refactor without test coverage. If code lacks tests, add them first.
</STRICT-RULE>

## Preserving Behavior

### Verification Checklist

- [ ] Input/output unchanged
- [ ] Error cases unchanged
- [ ] Side effects unchanged
- [ ] Performance unchanged (acceptable degradation only)
- [ ] All existing tests pass

### Behavioral Tests

Test both happy path and edge cases:
- Normal inputs produce expected outputs
- Invalid inputs produce same errors
- Boundary conditions unchanged

## Avoiding Big Rewrites

### The Trap

"While we're at it, let's just rewrite this entire module"

### Prevention

- **Time box refactors** — set limits, stop when reached
- **One item at a time** — never "clean up several things"
- **Commit frequently** — small commits are reversible
- **Feature flag risky changes** — ship in small increments

### When a Rewrite Seems Needed

Instead of rewriting:
1. Wrap old code with adapters
2. Add new implementation alongside
3. Switch callers incrementally
4. Remove old code after full migration

<GUIDANCE>
If rewrite seems necessary, escalate for discussion. Big rewrites require approval.
</GUIDANCE>

## Common Patterns

### Extract Function

```javascript
// Before: inline logic in loop
for (const item of items) {
  if (item.price > 100) {
    const discount = item.price * 0.1;
    const final = item.price - discount;
    results.push(final);
  }
}

// After: extracted with test
function calculateDiscount(price) {
  if (price <= 100) return 0;
  return price * 0.1;
}
```

### Rename for Clarity

```javascript
// Before: obscure name
function p(i) { return i * 1.2; }

// After: clear intent
function calculateTax(amount) { return amount * TAX_RATE; }
```

### Break Up Long Function

Identify distinct responsibilities:
1. Validation
2. Computation
3. Formatting
4. Output

Extract each into separate functions with clear names.

### Remove Duplication

```
Same pattern 3+ times? Extract to shared function.

Pattern variations? Use parameters or strategy pattern.
```

## Key Principles

- **Small changes** — one improvement at a time
- **Tests first** — verify behavior, then improve
- **Preserve behavior** — if tests pass, keep passing
- **Commit often** — small, reversible commits
- **Boy scout rule** — leave cleaner than found
- **Time box** — limit session scope
- **No rewrites** — incremental improvement only