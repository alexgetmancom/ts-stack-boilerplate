import { serve } from "@hono/node-server";
import { createBot } from "./bot/index.js";
import { loadConfig } from "./config.js";
import { openDb } from "./db/client.js";
import { createHttpApp } from "./http.js";
import { log } from "./logger.js";

const config = loadConfig();
const db = openDb(config.DATABASE_URL);
const bot = createBot(config, db.drizzle);

// Start bot polling if in polling mode
if (config.BOT_MODE === "polling") {
  void bot.start({
    onStart: (botInfo) => {
      log("info", "grammY bot polling started", { username: botInfo.username });
    },
  });
} else if (config.BOT_MODE === "webhook") {
  log("info", "grammY bot configured in WEBHOOK mode");
} else {
  log("info", "Running in HTTP-ONLY mode (bot disabled)");
}

// Start HTTP server (runs in all modes to serve health checks / webhook requests)
const server = serve(
  {
    fetch: createHttpApp(config, bot).fetch,
    port: config.PORT,
    hostname: config.BIND_HOST,
  },
  (info) => {
    log("info", `HTTP server listening on http://${info.address}:${info.port}`, {
      host: info.address,
      port: info.port,
      mode: config.BOT_MODE,
    });
  },
);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  log("info", "Stopping services", { signal });

  if (config.BOT_MODE === "polling" && bot.isRunning()) {
    await bot.stop();
    log("info", "grammY bot polling stopped");
  }

  await new Promise<void>((resolve) => {
    server.close(() => {
      log("info", "HTTP server closed");
      resolve();
    });
  });

  db.sqlite.close();
  log("info", "SQLite connection closed");
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
