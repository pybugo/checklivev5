import 'dotenv/config';

export const CONFIG = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID || null,
  intervalMinutes: Number(process.env.CHECK_INTERVAL_MINUTES || 15),
  alertChannelId: process.env.ALERT_CHANNEL_ID || null,
};

export function assertConfig() {
  const missing = [];
  if (!CONFIG.token) missing.push('DISCORD_TOKEN');
  if (!CONFIG.clientId) missing.push('DISCORD_CLIENT_ID');
  if (missing.length) throw new Error(`Missing env: ${missing.join(', ')}`);
}
