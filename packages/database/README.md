# NEB Starter - Database Package

A shared database package that provides type-safe access to the database from your server.

## Overview

This package uses Prisma ORM to define the database schema and provide a type-safe client for database operations. By default, it's configured to use PostgreSQL via Neon, but can be easily adapted to use other database providers.

## Features

- **Prisma ORM** - Type-safe database access
- **Shared Schema** - Single source of truth for database structure
- **Migration Support** - Tools for schema migrations
- **Type Generation** - Automatic TypeScript type generation

## Setup

### Prerequisites

- A PostgreSQL database (or another supported database)
- Database connection string

### Environment Variables

Copy the sample environment file and update the connection string:

```bash
cp .env.sample .env
```

For local development with SQLite, you can use:

```
DATABASE_URL="file:./dev.db"
```

Then update the provider in `prisma/schema.prisma` to `sqlite`.

## Usage

### Importing the Client

In your application code (server), import the database client:

```typescript
import { db } from "database";

// Example query
const users = await db.user.findMany();
```

### Schema Definition

The database schema is defined in `prisma/schema.prisma`. Here's an example of the current models:

## Schema Management

### Generating the Client

After changing the schema, generate the Prisma client:

```bash
npx prisma generate
```

This command is automatically run during `postinstall` for the package.

### Creating Migrations

To create a migration when changing the schema:

```bash
npx prisma migrate dev --name your_migration_name
```

### Applying Migrations

In development, migrations are applied automatically with `migrate dev`. For production:

```bash
npx prisma migrate deploy
```

### Direct Schema Push

For rapid development without migration history:

```bash
npx prisma db push
```

## Switching Database Providers

To use a different database provider:

1. Update the `provider` in `prisma/schema.prisma`
2. Update the `DATABASE_URL` in `.env`
3. Run `npx prisma generate` to update the client

## Best Practices

- Keep the schema definition centralized in this package
- Use transactions for operations that require atomicity
- Leverage Prisma's relations for efficient data loading
- Use middleware for cross-cutting concerns like logging or caching
