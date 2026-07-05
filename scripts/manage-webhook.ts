import { Bot } from "grammy";
import { loadConfig } from "../src/config.js";

const config = loadConfig();
const action = process.argv[2];

if (!action || !["set", "delete", "info"].includes(action)) {
  console.error("❌ Usage: tsx scripts/manage-webhook.ts <set|delete|info>");
  process.exit(1);
}

const bot = new Bot(config.TELEGRAM_BOT_TOKEN, {
  client: { apiRoot: config.TELEGRAM_API_BASE_URL },
});

async function main() {
  try {
    const botInfo = await bot.api.getMe();
    console.log(`🤖 Connected to bot: @${botInfo.username}`);

    if (action === "info") {
      const webhookInfo = await bot.api.getWebhookInfo();
      console.log("ℹ️ Webhook info:", JSON.stringify(webhookInfo, null, 2));
    } else if (action === "delete") {
      console.log("⏳ Deleting webhook...");
      await bot.api.deleteWebhook();
      console.log("✅ Webhook successfully deleted.");
    } else if (action === "set") {
      if (!config.PUBLIC_WEBHOOK_URL) {
        console.error("❌ PUBLIC_WEBHOOK_URL must be defined in .env to set the webhook.");
        process.exit(1);
      }
      if (!config.TELEGRAM_WEBHOOK_SECRET) {
        console.error("❌ TELEGRAM_WEBHOOK_SECRET must be defined in .env to set the webhook.");
        process.exit(1);
      }

      const webhookUrl = `${config.PUBLIC_WEBHOOK_URL.replace(/\/$/, "")}/telegram/webhook`;
      console.log(`⏳ Setting webhook to: ${webhookUrl}`);
      
      await bot.api.setWebhook(webhookUrl, {
        secret_token: config.TELEGRAM_WEBHOOK_SECRET,
        drop_pending_updates: true,
      });
      console.log("✅ Webhook successfully set!");
    }
  } catch (error) {
    console.error("❌ Error managing webhook:", error);
    process.exit(1);
  }
}

void main();
