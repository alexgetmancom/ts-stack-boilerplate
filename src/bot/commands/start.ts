import { eq } from "drizzle-orm";
import type { BotContext } from "../context.js";
import { users } from "../../db/schema.js";

export async function handleStart(ctx: BotContext): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const username = ctx.from?.username || null;
  const firstName = ctx.from?.first_name || null;
  const now = new Date().toISOString();

  // Try to find user
  const existingUser = ctx.db.select().from(users).where(eq(users.telegramId, telegramId)).get();

  if (!existingUser) {
    ctx.db.insert(users).values({
      telegramId,
      username,
      firstName,
      createdAt: now,
      updatedAt: now,
    }).run();
    console.log(`Registered new user: ${telegramId} (${username || "anonymous"})`);
  } else {
    // Update profile
    ctx.db.update(users)
      .set({ username, firstName, updatedAt: now })
      .where(eq(users.telegramId, telegramId))
      .run();
  }

  await ctx.reply(`Hello, ${firstName || "User"}! Welcome to the Telegram Bot Boilerplate!`);
}
