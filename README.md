# JobBoard

A full-featured job board built as a learning project for a modern TypeScript monorepo stack.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 15 + Auth.js v5 |
| Backend | NestJS (REST + GraphQL) |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis (ioredis) |
| Jobs | Inngest |
| Email/SMS | Brevo |
| Storage | DigitalOcean Spaces (S3-compatible) |
| Payments | Stripe |

## Project Structure

```
jobboard/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── db/           # Drizzle schema + client
│   ├── inngest/      # Inngest client + functions
│   ├── email/        # Brevo email client
│   ├── storage/      # DO Spaces client
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utilities
└── ...
```

## Getting Started

```bash
# 1. Copy env files
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 2. Install dependencies
pnpm install

# 3. Start local services (requires Docker)
docker compose up -d

# 4. Push DB schema
pnpm db:push

# 5. Start dev servers
pnpm dev
```

## Development

- `pnpm dev` — Start all apps
- `pnpm build` — Build all apps
- `pnpm db:studio` — Open Drizzle Studio
- `pnpm db:generate` — Generate migrations
- `pnpm db:migrate` — Run migrations
