import { Client, GatewayIntentBits, Partials, PermissionFlagsBits } from 'discord.js';
import cron from 'node-cron';
import http from 'http';
import { CONFIG, assertConfig } from './config.js';
import { addItem, listItems, removeItem, updateItem, getConfig, setConfig, getItem } from './storage.js';
import { normalizeTikTok, normalizeFacebook, genId, nowIso } from './util.js';
import { checkTikTok } from './checkers/tiktok.js';
import { checkFacebook } from './checkers/facebook.js';
import { buildStatusEmbed, buildListEmbed } from './format.js';
import { UI, buildMenuComponents, modalAddTikTok, modalAddFacebook, modalRemove } from './ui.js';

assertConfig();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

async function runCheckForItem(item) {
  const checkedAt = nowIso();
  try {
    let r;
    if (item.platform === 'tiktok') r = await checkTikTok({ url: item.url, username: item.key });
    else if (item.platform === 'facebook') r = await checkFacebook({ url: item.url });
    else r = { status: 'UNKNOWN', reason: 'unknown_platform' };

    return { ...r, checkedAt };
  } catch (e) {
    return { status: 'UNKNOWN', reason: (e?.message || 'error').slice(0, 80), checkedAt };
  }
}

async function sendAlert(item, checkResult) {
  const embed = buildStatusEmbed(item, checkResult);

  const cfg = getConfig();
  const targetChannelId = cfg.alertChannelId || CONFIG.alertChannelId;
  if (targetChannelId) {
    const ch = await client.channels.fetch(targetChannelId).catch(() => null);
    if (ch) {
      await ch.send({ embeds: [embed] }).catch(() => {});
      return;
    }
  }
  if (item.ownerId) {
    const user = await client.users.fetch(item.ownerId).catch(() => null);
    if (user) await user.send({ embeds: [embed] }).catch(() => {});
  }
}

async function checkAll({ forceNotify = false } = {}) {
  const items = listItems();
  for (const item of items) {
    // soft rate limit between checks
    await new Promise(r => setTimeout(r, 1200));

    const result = await runCheckForItem(item);
    const prev = item.lastStatus || null;

    updateItem(item.id, {
      lastStatus: result.status,
      lastReason: result.reason,
      lastCheckedAt: result.checkedAt,
    });

    const shouldNotify = forceNotify || !prev || prev !== result.status;
    if (shouldNotify) await sendAlert(item, result);
  }
}

client.on('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  const n = Math.max(5, Math.min(180, CONFIG.intervalMinutes || 15));
  const expr = `*/${n} * * * *`;
  cron.schedule(expr, () => checkAll({ forceNotify: false }).catch(console.error));
  console.log(`⏱️ Scheduled checks every ${n} minutes (${expr})`);
});

async function handleAdd(platform, interaction, input, note, price) {
  const norm = platform === 'tiktok' ? normalizeTikTok(input) : normalizeFacebook(input);
  const id = genId(platform === 'tiktok' ? 'tt' : 'fb');

  const item = addItem({
    id,
    platform,
    key: norm.key,
    display: norm.display,
    url: norm.url,
    note: note || '',
    price: (price === undefined || price === null || price === '') ? 0 : Number(price),
    followerCount: null,
    followingCount: null,
    friendCount: null,
    avatarUrl: null,
    name: null,
    ownerId: interaction.user.id,
    createdAt: nowIso(),
    lastStatus: null,
  });

  const result = await runCheckForItem(item);
  updateItem(id, { lastStatus: result.status, lastReason: result.reason, lastCheckedAt: result.checkedAt });

  return { item, result };
}

client.on('interactionCreate', async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;

      if (name === 'menu') {
        await interaction.reply({
          content: '📌 **TRUNG TÂM CHECK V2**\nTại đây bạn có thể:\n• Thêm TikTok/Facebook để theo dõi\n• Xem danh sách\n• Check ngay\n• Xoá theo ID\n👉 Bấm nút bên dưới:',
          components: buildMenuComponents(),
          ephemeral: true,
        });
        return;
      }

      if (name === 'tiktok_add') {
        const input = interaction.options.getString('user_or_url', true);
        const note = interaction.options.getString('note', false) || '';
        const price = interaction.options.getNumber('price', false);

        await interaction.deferReply({ ephemeral: true });
        const { item, result } = await handleAdd('tiktok', interaction, input, note, price ?? 0);
        await interaction.editReply({ content: `✅ Đã thêm TikTok V2 (ID: \`${item.id}\`)`, embeds: [buildStatusEmbed(item, result)] });
        return;
      }

      if (name === 'fb_add') {
        const input = interaction.options.getString('user_or_url', true);
        const note = interaction.options.getString('note', false) || '';
        const price = interaction.options.getNumber('price', false);

        await interaction.deferReply({ ephemeral: true });
        const { item, result } = await handleAdd('facebook', interaction, input, note, price ?? 0);
        await interaction.editReply({ content: `✅ Đã thêm Facebook (ID: \`${item.id}\`)`, embeds: [buildStatusEmbed(item, result)] });
        return;
      }

      if (name === 'list') {
        const items = listItems();
        await interaction.reply({ embeds: [buildListEmbed(items)], ephemeral: true });
        return;
      }

      if (name === 'remove') {
        const id = interaction.options.getString('id', true);
        const ok = removeItem(id);
        await interaction.reply({ content: ok ? `🗑️ Đã xoá \`${id}\`` : `❌ Không thấy ID: \`${id}\``, ephemeral: true });
        return;
      }

      if (name === 'status') {
  const id = interaction.options.getString('id', true);
  const item = getItem(id);
  if (!item) {
    await interaction.reply({ content: `❌ Không thấy ID: \`${id}\``, ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  const result = await runCheckForItem(item);
  updateItem(item.id, { lastStatus: result.status, lastReason: result.reason, lastCheckedAt: result.checkedAt });
  await interaction.editReply({ embeds: [buildStatusEmbed(item, result)] });
  return;
}

if (name === 'set_channel') {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: '❌ Lệnh này chỉ dùng trong server.', ephemeral: true });
    return;
  }
  const member = interaction.member;
  const hasPerm =
    member?.permissions?.has?.(PermissionFlagsBits.ManageGuild) ||
    member?.permissions?.has?.(PermissionFlagsBits.Administrator);

  if (!hasPerm) {
    await interaction.reply({ content: '❌ Bạn cần quyền Manage Server/Administrator.', ephemeral: true });
    return;
  }

  const channelId = interaction.options.getString('channel_id', true).trim();
  setConfig({ alertChannelId: channelId });
  await interaction.reply({ content: `✅ Đã set kênh thông báo: \`${channelId}\``, ephemeral: true });
  return;
}

if (name === 'check') {
        await interaction.reply({ content: '⏳ Đang check tất cả mục...', ephemeral: true });
        await checkAll({ forceNotify: true });
        await interaction.followUp({ content: '✅ Xong.', ephemeral: true });
        return;
      }
    }

    // Button clicks
    if (interaction.isButton()) {
      if (interaction.customId === UI.BTN_ADD_TT) {
        await interaction.showModal(modalAddTikTok());
        return;
      }
      if (interaction.customId === UI.BTN_ADD_FB) {
        await interaction.showModal(modalAddFacebook());
        return;
      }
      if (interaction.customId === UI.BTN_REMOVE) {
        await interaction.showModal(modalRemove());
        return;
      }
      if (interaction.customId === UI.BTN_LIST) {
        const items = listItems();
        await interaction.reply({ embeds: [buildListEmbed(items)], ephemeral: true });
        return;
      }
      if (interaction.customId === UI.BTN_CHECK) {
        await interaction.reply({ content: '⏳ Đang check tất cả mục...', ephemeral: true });
        await checkAll({ forceNotify: true });
        await interaction.followUp({ content: '✅ Xong.', ephemeral: true });
        return;
      }
    }

    // Modal submits
    if (interaction.isModalSubmit()) {
      if (interaction.customId === UI.MODAL_ADD_TT) {
        const input = interaction.fields.getTextInputValue('user_or_url');
        const note = interaction.fields.getTextInputValue('note') || '';
        const price = interaction.fields.getTextInputValue('price') || '0';

        await interaction.deferReply({ ephemeral: true });
        const { item, result } = await handleAdd('tiktok', interaction, input, note, price);
        await interaction.editReply({ content: `✅ Đã thêm TikTok V2 (ID: \`${item.id}\`)`, embeds: [buildStatusEmbed(item, result)] });
        return;
      }

      if (interaction.customId === UI.MODAL_ADD_FB) {
        const input = interaction.fields.getTextInputValue('user_or_url');
        const note = interaction.fields.getTextInputValue('note') || '';
        const price = interaction.fields.getTextInputValue('price') || '0';

        await interaction.deferReply({ ephemeral: true });
        const { item, result } = await handleAdd('facebook', interaction, input, note, price);
        await interaction.editReply({ content: `✅ Đã thêm Facebook (ID: \`${item.id}\`)`, embeds: [buildStatusEmbed(item, result)] });
        return;
      }

      if (interaction.customId === UI.MODAL_REMOVE) {
        const id = interaction.fields.getTextInputValue('id');
        const ok = removeItem(id);
        await interaction.reply({ content: ok ? `🗑️ Đã xoá \`${id}\`` : `❌ Không thấy ID: \`${id}\``, ephemeral: true });
        return;
      }
    }
  } catch (e) {
    const msg = `❌ Lỗi: ${(e?.message || e).toString().slice(0, 180)}`;
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(CONFIG.token);
