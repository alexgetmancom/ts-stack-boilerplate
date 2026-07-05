import { serve } from "@hono/node-server";
import { loadConfig } from "./config.js";
import { openDb } from "./db/client.js";
import { createBot } from "./bot/index.js";
import { createHttpApp } from "./http.js";

const config = loadConfig();
const db = openDb(config.DATABASE_URL);
const bot = createBot(config, db.drizzle);

// Start bot polling
if (config.ENABLE_BOT_POLLING) {
  void bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 grammY bot polling started for @${botInfo.username}`);
    },
  });
}

// Start HTTP server
let server: ReturnType<typeof serve> | undefined;
if (config.ENABLE_HTTP_SERVER) {
  server = serve(
    {
      fetch: createHttpApp(config, bot).fetch,
      port: config.PORT,
      hostname: config.BIND_HOST,
    },
    (info) => {
      console.log(`🌐 HTTP server listening on http://${info.address}:${info.port}`);
    }
  );
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`\nStopping services (signal: ${signal})...`);
  
  if (bot.isRunning()) {
    await bot.stop();
    console.log("🤖 grammY bot polling stopped.");
  }
  
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        console.log("🌐 HTTP server closed.");
        resolve();
      });
    });
  }
  
  db.sqlite.close();
  console.log("💾 SQLite connection closed.");
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
