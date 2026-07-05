# TypeScript Telegram Bot Boilerplate

A modern, highly performant, and type-safe boilerplate for building Telegram bots.

## Features

- **Runtime**: Node.js 22+ (fully compatible with Bun).
- **Bot Engine**: [grammY](https://grammy.dev/) - modern and extremely fast.
- **Server**: [Hono](https://hono.dev/) - lightweight edge-native web server for webhooks and health checks.
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with **SQLite** (`better-sqlite3`) utilizing **WAL mode** and busy timeouts to prevent locking.
- **Validation**: [Zod](https://zod.dev/) for environment configurations and API payloads.
- **Quality**: [Biome.js](https://biomejs.dev/) for sub-millisecond linting and formatting, [Vitest](https://vitest.dev/) for testing.

---

## Folder Structure

```txt
├── src/
│   ├── config.ts          # Environment variables validation schema (Zod)
│   ├── logger.ts          # Lightweight Console logger with timestamp
│   ├── db/
│   │   ├── client.ts      # SQLite better-sqlite3 Drizzle bootstrap (WAL mode enabled)
│   │   └── schema.ts      # DB schema definitions (Users, Logs)
│   ├── bot/
│   │   ├── index.ts       # Bot instantiation & middleware injection (injects db & config)
│   │   ├── context.ts     # Extends grammY context type with db client
│   │   └── commands/      # Bot commands (e.g. handleStart)
│   ├── http.ts            # Hono application (health checks & webhook callback endpoint)
│   └── index.ts           # Orchestrator (graceful SIGINT/SIGTERM shutdowns)
├── drizzle.config.ts      # Drizzle migration builder configuration
├── Dockerfile             # Multi-stage production container build
├── compose.yaml           # Deployment stack configuration
```

---

## Quick Start

### 1. Setup local environment
```bash
cp .env.example .env
```
Fill in the `TELEGRAM_BOT_TOKEN`.

### 2. Install dependencies
```bash
pnpm install
```

### 3. Build DB Schema & Migrate
Generate migrations:
```bash
pnpm run db:generate
```
Run migrations:
```bash
pnpm run db:migrate
```

### 4. Run Development Server (with auto-reload)
```bash
pnpm run dev
```

---

## Development Guides

### Injected Context
The database (`ctx.db`) and validated config (`ctx.config`) are injected into the grammY context for every update. In any command or callback handler, you can query SQLite directly:

```typescript
// src/bot/commands/example.ts
import { users } from "../../db/schema.js";

export async function handleExample(ctx: BotContext) {
  // Access typed DB client directly from context:
  const allUsers = ctx.db.select().from(users).all();
  await ctx.reply(`We have ${allUsers.length} registered users!`);
}
```

### Adding Bot Commands
1. Create a file under `src/bot/commands/mycommand.ts` containing the handler logic.
2. In `src/bot/index.ts`, import the handler and register it:
   ```typescript
   bot.command("mycommand", handleMyCommand);
   ```

### Code Formatting & Linting
Run Biome formatter and linter:
```bash
pnpm run lint
# Auto fix formatting and safe lint warnings:
pnpm run lint:write
```
