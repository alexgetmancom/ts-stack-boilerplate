import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_API_BASE_URL: z.string().default("https://api.telegram.org"),
  PORT: z.coerce.number().default(8080),
  BIND_HOST: z.string().default("127.0.0.1"),
  DATABASE_URL: z.string().default("./data/bot.db"),
  ENABLE_BOT_POLLING: z.coerce.boolean().default(true),
  ENABLE_HTTP_SERVER: z.coerce.boolean().default(true),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Configuration validation failed:", result.error.format());
    process.exit(1);
  }
  return result.data;
}
