import type { Context } from "grammy";
import type { Config } from "../config.js";
import type { DbClient } from "../db/client.js";

export type BotContext = Context & {
  db: DbClient;
  config: Config;
};
