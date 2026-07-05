import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Bot } from "grammy";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleStart } from "../src/bot/commands/start.js";
import type { BotContext } from "../src/bot/context.js";
import { loadConfig } from "../src/config.js";
import { openDb } from "../src/db/client.js";
import { users } from "../src/db/schema.js";
import { createHttpApp } from "../src/http.js";

describe("Boilerplate Config Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should successfully load valid config", () => {
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.BOT_MODE = "polling";
    process.env.PORT = "9000";

    const config = loadConfig();
    expect(config.TELEGRAM_BOT_TOKEN).toBe("123:abc");
    expect(config.BOT_MODE).toBe("polling");
    expect(config.PORT).toBe(9000);
  });

  it("should fail and exit when TELEGRAM_BOT_TOKEN is missing", () => {
    process.env.TELEGRAM_BOT_TOKEN = undefined;
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("should fail when BOT_MODE is webhook but webhook settings are missing", () => {
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.BOT_MODE = "webhook";
    process.env.PUBLIC_WEBHOOK_URL = undefined;
    process.env.TELEGRAM_WEBHOOK_SECRET = undefined;

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe("Boilerplate Database Tests", () => {
  const testDbPath = "./data/test.db";

  it("should initialize database and tables with migrations", () => {
    const { sqlite, drizzle } = openDb(testDbPath);
    migrate(drizzle, { migrationsFolder: "./drizzle" });

    // Test database access
    const allUsers = drizzle.select().from(users).all();
    expect(Array.isArray(allUsers)).toBe(true);

    sqlite.close();
  });
});

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

describe("Boilerplate Telegram Bot Start Handler Tests", () => {
  it("should handle start command, register new user, and reply", async () => {
    const { sqlite, drizzle } = openDb("./data/test.db");
    migrate(drizzle, { migrationsFolder: "./drizzle" });

    // Clear user table for test sanity
    drizzle.delete(users).run();

    const mockReply = vi.fn();
    const mockCtx = {
      from: {
        id: 99999,
        first_name: "TestUser",
        username: "test_username",
      },
      db: drizzle,
      reply: mockReply,
    } as unknown as BotContext;

    await handleStart(mockCtx);

    // Verify reply was sent
    expect(mockReply).toHaveBeenCalled();
    expect(mockReply.mock.calls[0][0]).toContain("Hello, TestUser!");

    // Verify user was inserted in DB
    const dbUser = drizzle.select().from(users).all();
    expect(dbUser.length).toBe(1);
    expect(dbUser[0].telegramId).toBe(99999);
    expect(dbUser[0].firstName).toBe("TestUser");

    sqlite.close();
  });
});
