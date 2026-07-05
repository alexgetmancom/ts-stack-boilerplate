import { Hono } from "hono";
import { webhookCallback } from "grammy";
import type { Bot } from "grammy";
import type { Config } from "./config.js";
import type { BotContext } from "./bot/context.js";

export function createHttpApp(config: Config, bot: Bot<BotContext>): Hono {
  const app = new Hono();

  // Logging middleware
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    console.log(`[HTTP] ${c.req.method} ${c.req.path} - ${c.res.status} (${Date.now() - start}ms)`);
  });

  // Health checks
  app.get("/healthz", (c) => c.text("ok\n"));
  app.get("/readyz", (c) => c.text("ready\n"));

  // Webhook endpoint
  app.post("/webhook", webhookCallback(bot, "hono"));

  return app;
}
