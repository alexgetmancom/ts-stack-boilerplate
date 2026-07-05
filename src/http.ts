import { sql } from "drizzle-orm";
import { webhookCallback } from "grammy";
import type { Bot } from "grammy";
import { Hono } from "hono";
import { logger } from "hono/logger";
import type { BotContext } from "./bot/context.js";
import type { Config } from "./config.js";
import type { DbClient } from "./db/client.js";

export function createHttpApp(config: Config, bot: Bot<BotContext> | null, db: DbClient): Hono {
  const app = new Hono();

  // Use Hono's official structured logger
  app.use(logger());

  // Health check: verification that HTTP server is up
  app.get("/healthz", (c) => c.text("ok\n"));

  // Readiness check: verification that database is online and reachable
  app.get("/readyz", async (c) => {
    try {
      db.run(sql`SELECT 1`);
      return c.text("ready\n");
    } catch (error) {
      console.error("❌ Readiness check failed: SQLite connection offline", error);
      return c.text("error\n", 500);
    }
  });

  // Webhook endpoint (only if BOT_MODE is webhook and bot is instantiated)
  if (config.BOT_MODE === "webhook" && bot) {
    app.post(
      "/telegram/webhook",
      webhookCallback(bot, "hono", {
        secretToken: config.TELEGRAM_WEBHOOK_SECRET,
      }),
    );
  }

  return app;
}
