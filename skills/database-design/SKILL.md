---
name: database-design
description: Use when designing database schemas, data models, or需要进行数据库设计
---

# Database Design

## Overview

**Core principle:** Design schemas that accurately model your domain, ensure data integrity, and scale with your application.

This skill covers relational database design patterns for schema design, migrations, relationships, indexing, and data integrity.

## When to Use

Use when:
- Creating new database tables or modifying existing schemas
- Designing data models for new features
- Writing database migrations
- Modeling relationships between entities
- Adding indexes for query optimization
- Implementing data integrity constraints

Don't use when:
- Working with NoSQL/document stores (different patterns)
- Simple key-value storage needs
- Already have a well-designed schema and need only minor changes

## Schema Design

### Core Principles

1. **Single Source of Truth**: Each piece of data lives in exactly one table
2. **Normalized by Default**: Avoid redundancy unless justified by performance
3. **Meaningful Names**: Tables, columns, and constraints have clear, descriptive names
4. **Appropriate Types**: Use correct data types (VARCHAR vs TEXT, TIMESTAMP vs DATE, etc.)

### Common Patterns

| Pattern | Use When |
|---------|----------|
| Entity table | Core business objects (users, orders, products) |
| Junction table | Many-to-many relationships |
| Audit table | Tracking changes over time |
| Lookup table | Enumerated values or static data |
| Soft delete | Need to recover deleted records |

### Naming Conventions

```sql
-- Tables: plural, snake_case
CREATE TABLE users ();
CREATE TABLE order_items ();

-- Columns: snake_case, descriptive
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Foreign keys: {table}_id
CREATE TABLE orders (
    user_id BIGINT REFERENCES users(id)
);
```

## Migrations

### Safe Migration Practices

1. **Always Use Transactions**: Wrap migrations in transactions where possible
2. **Never Modify Existing Migrations**: Create new migrations for changes
3. **Keep Backward Compatibility**: Deploy schema changes before code changes
4. **Test in Staging First**: Run migrations against staging data

### Migration Pattern

```sql
-- BAD: Modifying column that may have data
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);

-- GOOD: Multi-step migration for type changes
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN email_new VARCHAR(255);

-- Step 2: Migrate data
UPDATE users SET email_new = email WHERE email IS NOT NULL;

-- Step 3: Swap columns (atomic in same transaction)
BEGIN;
ALTER TABLE users RENAME COLUMN email TO email_old;
ALTER TABLE users RENAME COLUMN email_new TO email;
COMMIT;

-- Step 4: Drop old column (separate migration)
ALTER TABLE users DROP COLUMN email_old;
```

### Schema Versioning

```sql
-- Track migration history
CREATE TABLE schema_migrations (
    version VARCHAR(14) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);
```

## Relationships

### One-to-Many

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    total DECIMAL(10,2) NOT NULL
);
```

### Many-to-Many

```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Junction table
CREATE TABLE order_items (
    order_id BIGINT NOT NULL REFERENCES orders(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, product_id)
);
```

### One-to-One

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    avatar_url VARCHAR(500)
);
```

## Indexing

### When to Index

| Scenario | Index Type |
|----------|------------|
| WHERE clauses on column | B-tree (default) |
| Full-text search | GIN or GiST |
| Geospatial queries | GIST |
| Exact matches | Hash (for memory tables) |
| Composite queries | Composite index |

### Common Patterns

```sql
-- Index for WHERE clause
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Index for frequently combined filters
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- Unique constraint (implicit index)
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- Partial index for filtered queries
CREATE INDEX idx_active_orders ON orders(created_at)
    WHERE status = 'active';

-- Covering index for query optimization
CREATE INDEX idx_orders_user_status ON orders(user_id, status)
    INCLUDE (total, created_at);
```

### What NOT to Index

- Columns with low cardinality (boolean, status with few values)
- Columns rarely used in WHERE clauses
- Tables with infrequent reads
- Avoid over-indexing (impacts INSERT/UPDATE performance)

## Data Integrity Patterns

### Constraints

```sql
-- NOT NULL
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL
);

-- UNIQUE
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- CHECK
ALTER TABLE orders ADD CONSTRAINT ck_orders_positive_total
    CHECK (total >= 0);

-- Foreign Key
CREATE TABLE order_items (
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id)
);
```

### Cascade Actions

| Action | Behavior |
|--------|----------|
| ON DELETE RESTRICT | Prevent deletion of referenced row |
| ON DELETE CASCADE | Delete child rows when parent deleted |
| ON DELETE SET NULL | Set foreign key to NULL |
| ON DELETE SET DEFAULT | Set foreign key to default value |

### Common Integrity Patterns

```sql
-- Soft delete (preferred over hard delete)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT ck_deleted CHECK (
        (deleted_at IS NULL) OR (deleted_at IS NOT NULL)
    )
);

-- Timestamp tracking
CREATE TABLE orders (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enforce via trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| No primary keys | Always define explicit primary keys |
| Missing foreign keys | Use FOREIGN KEY constraints for relationships |
| Over-normalized schemas | Denormalize for read-heavy scenarios |
| Under-normalized schemas | Normalize to reduce redundancy |
| No indexes on foreign keys | Index foreign key columns |
| Using TEXT for everything | Use appropriate data types |
| No migration rollback plan | Always have a rollback strategy |

## Quick Reference

```
Schema Design:
- Normalize by default
- Use meaningful names
- Appropriate data types

Migrations:
- Use transactions
- Never modify existing migrations
- Test in staging first

Relationships:
- One-to-many: foreign key on "many" side
- Many-to-many: junction table
- One-to-one: shared primary key or unique FK

Indexing:
- Index WHERE columns
- Composite indexes for combined filters
- Don't over-index

Data Integrity:
- NOT NULL for required fields
- UNIQUE for unique values
- CHECK for custom constraints
- Foreign keys for relationships