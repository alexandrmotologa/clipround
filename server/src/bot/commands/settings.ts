import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';

export interface UserPreferences {
  dimension: 480 | 384;
  audioBoost: number;
}

// In-memory preferences map for active sessions
export const userPreferences = new Map<number, UserPreferences>();

export async function handleSettingsCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const current = userPreferences.get(userId) || { dimension: 480, audioBoost: 1.0 };

  const keyboard = new InlineKeyboard()
    .text(
      current.dimension === 480 ? 'Resolution: 480x480 (HD)' : 'Resolution: 480x480',
      'set_res_480'
    )
    .text(
      current.dimension === 384 ? 'Resolution: 384x384 (Fast)' : 'Resolution: 384x384',
      'set_res_384'
    )
    .row()
    .text(
      current.audioBoost === 1.5 ? 'Audio: Boost 1.5x' : 'Audio: Normal (1.0x)',
      'toggle_audio_boost'
    );

  await ctx.reply(
    'ClipRound Preferences:\n\n' +
    `Current resolution: ${current.dimension}x${current.dimension}\n` +
    `Audio gain default: ${current.audioBoost}x\n\n` +
    'Tap below to toggle settings:',
    { reply_markup: keyboard }
  );
}
