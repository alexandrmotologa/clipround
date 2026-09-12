import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';

export async function handleStartCommand(ctx: Context): Promise<void> {
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL || 'http://localhost:8080';

  const keyboard = new InlineKeyboard()
    .webApp('Launch Studio', webAppUrl)
    .row()
    .text('Help & Formats', 'help_info');

  await ctx.reply(
    'Welcome to ClipRound.\n\n' +
    'Send or forward any video to convert it into a circular Telegram video note, compress it, or extract its audio.\n\n' +
    'You can also tap Launch Studio below to open the interactive circular crop editor.',
    { reply_markup: keyboard }
  );
}

export async function handleHelpCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    'ClipRound Bot Guide:\n\n' +
    '1. Send any MP4 or MOV video to this chat.\n' +
    '2. Choose an action from the menu:\n' +
    '   - Crop to Circular Video Note: opens the crop studio to center subjects and trim up to 60s.\n' +
    '   - Smart Compress: reduces file size to 10 MB or 25 MB for fast mobile sharing.\n' +
    '   - Extract Audio: downloads the audio track as MP3.\n\n' +
    'Telegram video notes are limited to 60 seconds and encoded in 1:1 H.264/AAC.'
  );
}
