# TypeScript App & Bot Boilerplate

A modern, highly performant, production-grade boilerplate for building Telegram bots, lightweight APIs, websites, and microservices in TypeScript.

## Features

- **Runtime**: Node.js 24+ (fully compatible with Bun).
- **Web Server**: [Hono](https://hono.dev/) - lightweight edge-native web server with built-in structured request logging.
- **Bot Engine**: [grammY](https://grammy.dev/) - modern and extremely fast.
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with **SQLite** (`better-sqlite3`) utilizing **WAL mode**, busy timeouts, and foreign key constraints to prevent database locks.
- **Validation**: [Zod](https://zod.dev/) for strict configuration validation on startup and API payloads.
- **Tooling**: [Biome.js](https://biomejs.dev/) for sub-millisecond linting and formatting, [Vitest](https://vitest.dev/) for unit testing.
- **Observability**: Structured JSON logging in production and human-readable logging in development.

---

## Folder Structure

```txt
├── .github/workflows/ci.yml # Automated CI pipeline (lint, compile, test, build)
├── drizzle/           # SQL migration files (committed to repository)
├── scripts/
│   └── manage-webhook.ts # Helper script to set, delete, and inspect webhooks
├── src/
│   ├── config.ts      # Env variables validation schema (Zod)
│   ├── logger.ts      # Structured JSON (prod) or console (dev) logger
│   ├── db/
│   │   ├── client.ts  # SQLite better-sqlite3 Drizzle setup (WAL mode)
│   │   └── schema.ts  # Database tables (Users, Logs)
│   ├── bot/
│   │   ├── index.ts   # Bot middleware & command registration
│   │   ├── context.ts # Custom context type injecting db and config
│   │   └── commands/  # Modular bot command handlers
│   ├── http.ts        # Hono app (health/readiness checks, webhook route)
│   └── index.ts       # Orchestrator (graceful shutdown handlers)
├── tsconfig.json      # Node Next module resolution config
├── biome.json         # Biome formatter & linter rules
├── Dockerfile         # Multi-stage production container build (runs as non-root)
├── compose.yaml       # Simple Docker Compose configuration
```

---

## Configuration & BOT_MODE

The app operates in one of three startup modes defined in your `.env` file:

1. **`polling`**: Runs the Telegram bot in long polling mode. Starts the Hono web server *only* to serve health/readiness endpoints on `PORT`. (Best for local development).
2. **`webhook`**: Mounts the bot callback endpoint on Hono. Does not start polling. (Best for production).
3. **`http-only`**: Exposes the Hono API and database checks, but disables the bot. **`TELEGRAM_BOT_TOKEN` is optional in this mode.** (Best for pure API/web services).

### Webhook Security
In `webhook` mode, the callback path is `/telegram/webhook`. Requests are validated using `TELEGRAM_WEBHOOK_SECRET` matching the `X-Telegram-Bot-Api-Secret-Token` header sent by Telegram, blocking malicious requests.

---

## Quick Start

### 1. Setup local environment
```bash
cp .env.local.example .env
```
Open `.env` and set `TELEGRAM_BOT_TOKEN`.

### 2. Install dependencies
```bash
pnpm install
```

### 3. Run migrations locally
```bash
pnpm run db:migrate
```
*Note: In production deployments, migrations run automatically on application startup, so no manual step is required.*

> [!WARNING]
> **Startup Migrations & Scale-Out Constraints**
> Performing migrations on startup is safe and recommended for **single-instance deployments** (such as a single VPS process or a single Docker container).
> If you scale out horizontally (multiple container replicas running concurrently), you risk race conditions and SQLite `SQLITE_BUSY` errors.
> For horizontal scaling:
> 1. Disable startup migrations in `src/index.ts` (comment out the `migrate` block).
> 2. Run migrations as an isolated deployment step (e.g., in your CI pipeline or using a single-run init-container before spinning up your main application replicas).

### 4. Run Development Server (polling mode)
```bash
pnpm run dev
```

---

## Webhook Management

To register or remove your webhook in Telegram, use the helper scripts:

```bash
# Register your webhook URL with Telegram (requires PUBLIC_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET)
# By default, this drops all pending Telegram updates to avoid queue backup.
pnpm run webhook:set

# Register webhook but KEEP pending updates:
pnpm run webhook:set --keep-pending

# Remove the webhook from Telegram:
pnpm run webhook:delete

# View current webhook configuration:
pnpm run webhook:info
```

---

## Docker Deployment

The application compiles to a production-safe, lightweight Docker image running as a non-root `node` user.

### Production Network Binding
For Docker environments, the Hono server must bind to all network interfaces. Ensure your production environment or `.env` file contains:
```ini
BIND_HOST=0.0.0.0
PORT=8080
```
This is configured by default inside `compose.yaml` (which forwards port `8080`).

To build and run the stack:
```bash
docker compose up -d --build
```

---

## Health Checks & Observability

The HTTP server exposes two health checking endpoints:
- **`GET /healthz`**: Simple liveness check returning `200 ok` (verifies the Node.js/Hono process is running).
- **`GET /readyz`**: Readiness check executing a lightweight query on SQLite (`SELECT 1`). Returns `500 error` if database connectivity is offline.
