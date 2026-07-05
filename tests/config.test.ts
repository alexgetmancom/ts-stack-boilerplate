import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config.js";

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

  it("should fail and exit when TELEGRAM_BOT_TOKEN is missing in polling/webhook mode", () => {
    process.env.TELEGRAM_BOT_TOKEN = undefined;
    process.env.BOT_MODE = "polling";
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("should successfully load config when BOT_MODE is http-only and token is missing", () => {
    process.env.TELEGRAM_BOT_TOKEN = undefined;
    process.env.BOT_MODE = "http-only";

    const config = loadConfig();
    expect(config.TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(config.BOT_MODE).toBe("http-only");
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
