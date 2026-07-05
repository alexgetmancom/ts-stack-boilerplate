import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it, vi } from "vitest";
import { handleStart } from "../src/bot/commands/start.js";
import type { BotContext } from "../src/bot/context.js";
import { createBot } from "../src/bot/index.js";
import { openDb } from "../src/db/client.js";
import { users } from "../src/db/schema.js";

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

describe("Boilerplate Telegram Bot Instantiation Tests", () => {
  it("should fail to instantiate bot if token is missing", () => {
    const mockConfig = {
      BOT_MODE: "polling" as const,
      TELEGRAM_BOT_TOKEN: undefined,
      TELEGRAM_API_BASE_URL: "https://api.telegram.org",
      PORT: 8080,
      BIND_HOST: "127.0.0.1",
      DATABASE_URL: "./data/test.db",
    };
    const { sqlite, drizzle } = openDb("./data/test.db");

    expect(() => createBot(mockConfig, drizzle)).toThrow("TELEGRAM_BOT_TOKEN is required to instantiate the bot.");

    sqlite.close();
  });
});
