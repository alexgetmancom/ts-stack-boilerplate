import { webhookCallback } from "grammy";
import type { Bot } from "grammy";
import { Hono } from "hono";
import { logger } from "hono/logger";
import type { BotContext } from "./bot/context.js";
import type { Config } from "./config.js";

export function createHttpApp(config: Config, bot: Bot<BotContext>): Hono {
  const app = new Hono();

  // Use Hono's official structured logger
  app.use(logger());

  // Health checks
  app.get("/healthz", (c) => c.text("ok\n"));
  app.get("/readyz", (c) => c.text("ready\n"));

  // Webhook endpoint (only if BOT_MODE is webhook)
  if (config.BOT_MODE === "webhook") {
    app.post(
      "/telegram/webhook",
      webhookCallback(bot, "hono", {
        secretToken: config.TELEGRAM_WEBHOOK_SECRET,
      }),
    );
  }

  return app;
}
