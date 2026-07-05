import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Bot } from "grammy";
import { describe, expect, it } from "vitest";
import type { BotContext } from "../src/bot/context.js";
import { openDb } from "../src/db/client.js";
import { createHttpApp } from "../src/http.js";

describe("Boilerplate HTTP Routes Tests", () => {
  it("should return ok/ready for health checks", async () => {
    const mockConfig = {
      BOT_MODE: "polling" as const,
      TELEGRAM_BOT_TOKEN: "123:abc",
      TELEGRAM_API_BASE_URL: "https://api.telegram.org",
      PORT: 8080,
      BIND_HOST: "127.0.0.1",
      DATABASE_URL: "./data/test-http.db",
    };
    const { sqlite, drizzle } = openDb(mockConfig.DATABASE_URL);
    migrate(drizzle, { migrationsFolder: "./drizzle" });

    const mockBot = new Bot<BotContext>(mockConfig.TELEGRAM_BOT_TOKEN);
    const app = createHttpApp(mockConfig, mockBot, drizzle);

    const resHealth = await app.request("/healthz");
    expect(resHealth.status).toBe(200);
    expect(await resHealth.text()).toBe("ok\n");

    const resReady = await app.request("/readyz");
    expect(resReady.status).toBe(200);
    expect(await resReady.text()).toBe("ready\n");

    sqlite.close();
  });
});
