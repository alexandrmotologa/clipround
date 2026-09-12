import { Bot } from 'grammy';
import { handleStartCommand, handleHelpCommand } from './commands/start.js';
import { handleIncomingVideo, handleCallbackQuery } from './videoReceiver.js';

let botInstance: Bot | null = null;

export function getBotInstance(): Bot | null {
  return botInstance;
}

export async function initTelegramBot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token === 'mock_token' || token.trim() === '') {
    console.log('[ClipRound Bot] Running in local studio mode (no live Telegram Bot Token configured).');
    return;
  }

  try {
    const bot = new Bot(token);
    botInstance = bot;

    bot.command('start', handleStartCommand);
    bot.command('help', handleHelpCommand);

    bot.on(['message:video', 'message:document'], handleIncomingVideo);
    bot.on('callback_query:data', handleCallbackQuery);

    bot.catch((err) => {
      console.error('[ClipRound Bot] Error caught in bot loop:', err);
    });

    console.log('[ClipRound Bot] Starting Telegram long polling...');
    // Start polling in background without blocking server listen
    bot.start({
      drop_pending_updates: true,
      onStart: (info) => {
        console.log(`[ClipRound Bot] Connected as @${info.username}`);
      },
    });
  } catch (err) {
    console.warn(`[ClipRound Bot] Failed to initialize bot: ${(err as Error).message}`);
    botInstance = null;
  }
}
