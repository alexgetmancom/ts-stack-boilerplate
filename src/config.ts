import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    BOT_MODE: z.enum(["polling", "webhook", "http-only"]).default("polling"),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_API_BASE_URL: z.string().default("https://api.telegram.org"),
    PORT: z.coerce.number().default(8080),
    BIND_HOST: z.string().default("127.0.0.1"),
    DATABASE_URL: z.string().default("./data/bot.db"),
    TELEGRAM_WEBHOOK_SECRET: z.string().min(32).optional(),
    PUBLIC_WEBHOOK_URL: z.string().url().optional(),
  })
  .refine(
    (data) => {
      if (data.BOT_MODE !== "http-only" && !data.TELEGRAM_BOT_TOKEN) {
        return false;
      }
      return true;
    },
    {
      message: "TELEGRAM_BOT_TOKEN is required when BOT_MODE is 'polling' or 'webhook'",
      path: ["TELEGRAM_BOT_TOKEN"],
    },
  )
  .refine(
    (data) => {
      if (data.BOT_MODE === "webhook") {
        return !!data.TELEGRAM_WEBHOOK_SECRET && !!data.PUBLIC_WEBHOOK_URL;
      }
      return true;
    },
    {
      message: "Both TELEGRAM_WEBHOOK_SECRET and PUBLIC_WEBHOOK_URL are required when BOT_MODE is 'webhook'",
      path: ["BOT_MODE"],
    },
  );

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Configuration validation failed:", result.error.format());
    process.exit(1);
  }
  return result.data;
}
