import { Bot } from "grammy";
import type { Config } from "../config.js";
import type { DbClient } from "../db/client.js";
import type { BotContext } from "./context.js";
import { handleStart } from "./commands/start.js";

export function createBot(config: Config, db: DbClient): Bot<BotContext> {
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
    console.error(`Error in bot execution context: ${err.message}`, err.error);
  });

  return bot;
}
