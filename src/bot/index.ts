import { Bot } from "grammy";
import type { Config } from "../config.js";
import type { DbClient } from "../db/client.js";
import { log } from "../logger.js";
import { handleStart } from "./commands/start.js";
import type { BotContext } from "./context.js";

export function createBot(config: Config, db: DbClient): Bot<BotContext> {
  if (!config.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to instantiate the bot.");
  }

  const bot = new Bot<BotContext>(config.TELEGRAM_BOT_TOKEN, {
    client: {
      apiRoot: config.TELEGRAM_API_BASE_URL,
    },
  });

  // Middleware to inject db and config
  bot.use(async (ctx, next) => {
    ctx.db = db;
    ctx.config = config;
    await next();
  });

  // Register commands
  bot.command("start", handleStart);

  // Error boundary
  bot.catch((err) => {
    log("error", "Error in bot execution context", {
      message: err.message,
      error: String(err.error),
    });
  });

  return bot;
}
