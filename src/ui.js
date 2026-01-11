import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

export const UI = {
  MENU_OPEN: 'menu_open',
  BTN_ADD_TT: 'btn_add_tt',
  BTN_ADD_FB: 'btn_add_fb',
  BTN_LIST: 'btn_list',
  BTN_CHECK: 'btn_check',
  BTN_REMOVE: 'btn_remove',
  MODAL_ADD_TT: 'modal_add_tt',
  MODAL_ADD_FB: 'modal_add_fb',
  MODAL_REMOVE: 'modal_remove',
};

export function buildMenuComponents() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(UI.BTN_ADD_TT).setLabel('➕ Thêm TikTok V2').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(UI.BTN_ADD_FB).setLabel('➕ Thêm Facebook').setStyle(ButtonStyle.Primary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(UI.BTN_LIST).setLabel('📋 Danh sách').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(UI.BTN_CHECK).setLabel('🔁 Check ngay').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(UI.BTN_REMOVE).setLabel('🗑️ Xoá').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}

export function modalAddTikTok() {
  const m = new ModalBuilder().setCustomId(UI.MODAL_ADD_TT).setTitle('Thêm TikTok V2');
  const input = new TextInputBuilder()
    .setCustomId('user_or_url')
    .setLabel('Gửi @username hoặc link TikTok')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('@abcxyz hoặc https://www.tiktok.com/@abcxyz');

  const note = new TextInputBuilder()
    .setCustomId('note')
    .setLabel('Ghi chú (tuỳ chọn)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const price = new TextInputBuilder()
    .setCustomId('price')
    .setLabel('Giá (tuỳ chọn)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('Ví dụ: 20');

  m.addComponents(
    new ActionRowBuilder().addComponents(input),
    new ActionRowBuilder().addComponents(note),
    new ActionRowBuilder().addComponents(price),
  );
  return m;
}

export function modalAddFacebook() {
  const m = new ModalBuilder().setCustomId(UI.MODAL_ADD_FB).setTitle('Thêm Facebook');
  const input = new TextInputBuilder()
    .setCustomId('user_or_url')
    .setLabel('Gửi UID hoặc link Facebook')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('1000... hoặc https://facebook.com/....');

  const note = new TextInputBuilder()
    .setCustomId('note')
    .setLabel('Ghi chú (tuỳ chọn)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const price = new TextInputBuilder()
    .setCustomId('price')
    .setLabel('Giá (tuỳ chọn)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('Ví dụ: 0');

  m.addComponents(
    new ActionRowBuilder().addComponents(input),
    new ActionRowBuilder().addComponents(note),
    new ActionRowBuilder().addComponents(price),
  );
  return m;
}

export function modalRemove() {
  const m = new ModalBuilder().setCustomId(UI.MODAL_REMOVE).setTitle('Xoá theo ID');
  const input = new TextInputBuilder()
    .setCustomId('id')
    .setLabel('ID nội bộ cần xoá')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('vd: tt_... hoặc fb_...');

  m.addComponents(new ActionRowBuilder().addComponents(input));
  return m;
}
