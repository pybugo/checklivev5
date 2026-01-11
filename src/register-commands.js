import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { CONFIG, assertConfig } from './config.js';

assertConfig();

const commands = [
  new SlashCommandBuilder().setName('menu').setDescription('Mở menu nút thao tác'),
  new SlashCommandBuilder()
    .setName('tiktok_add')
    .setDescription('Thêm TikTok username/link để theo dõi')
    .addStringOption(o => o.setName('user_or_url').setDescription('Ví dụ: @abcxyz hoặc https://www.tiktok.com/@abcxyz').setRequired(true))
    .addStringOption(o => o.setName('note').setDescription('Ghi chú (tuỳ chọn)').setRequired(false))
    .addNumberOption(o => o.setName('price').setDescription('Giá (tuỳ chọn)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('fb_add')
    .setDescription('Thêm Facebook UID/link để theo dõi')
    .addStringOption(o => o.setName('user_or_url').setDescription('Ví dụ: 1000... hoặc https://facebook.com/...').setRequired(true))
    .addStringOption(o => o.setName('note').setDescription('Ghi chú (tuỳ chọn)').setRequired(false))
    .addNumberOption(o => o.setName('price').setDescription('Giá (tuỳ chọn)').setRequired(false)),
  new SlashCommandBuilder().setName('list').setDescription('Xem danh sách đang theo dõi'),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Xoá mục theo dõi theo ID')
    .addStringOption(o => o.setName('id').setDescription('ID của mục').setRequired(true)),
  new SlashCommandBuilder().setName('check').setDescription('Check ngay tất cả mục (có rate limit)'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check nhanh 1 mục theo ID')
    .addStringOption(o => o.setName('id').setDescription('ID nội bộ').setRequired(true)),
  new SlashCommandBuilder()
    .setName('set_channel')
    .setDescription('Set kênh để bot gửi thông báo (admin)')
    .addStringOption(o => o.setName('channel_id').setDescription('ID kênh Discord').setRequired(true)),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.token);

(async () => {
  try {
    if (CONFIG.guildId) {
      await rest.put(Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId), { body: commands });
      console.log('✅ Registered guild commands');
    } else {
      await rest.put(Routes.applicationCommands(CONFIG.clientId), { body: commands });
      console.log('✅ Registered global commands (có thể mất vài phút để hiện)');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
