import { EmbedBuilder } from 'discord.js';
import { fmtVNDate, humanizeDuration, parseCount } from './util.js';

export function statusEmoji(status) {
  if (status === 'OK') return '🟢';
  if (status === 'DIE') return '🔴';
  if (status === 'SUSPECT') return '🟠';
  if (status === 'REDIRECT') return '🔁';
  return '🟡';
}

export function statusLabel(status) {
  if (status === 'OK') return 'SỐNG';
  if (status === 'DIE') return 'DIE';
  if (status === 'SUSPECT') return 'SUSPECT';
  if (status === 'REDIRECT') return 'REDIRECT';
  return 'UNKNOWN';
}

export function platformLabel(p) {
  return p === 'tiktok' ? 'TIKTOK V2' : 'FACEBOOK';
}

function fmtNum(n) {
  if (n == null) return 'Không rõ';
  const x = typeof n === 'string' ? parseCount(n) : n;
  if (x == null || Number.isNaN(x)) return 'Không rõ';
  return x.toLocaleString('vi-VN');
}

export function buildStatusEmbed(item, check) {
  const created = item.createdAt ? fmtVNDate(item.createdAt) : '—';
  const last = check?.checkedAt ? fmtVNDate(check.checkedAt) : (item.lastCheckedAt ? fmtVNDate(item.lastCheckedAt) : '—');

  let lived = 'Chưa rõ thời điểm bắt đầu';
  const currentStatus = check?.status || item.lastStatus;
  if (item.createdAt && currentStatus === 'OK') {
    const ms = Date.now() - new Date(item.createdAt).getTime();
    lived = humanizeDuration(ms);
  }

  const displayName = item.name || (check?.meta?.displayName ?? null) || 'Không rõ 💗';
  const avatarUrl = item.avatarUrl || (check?.meta?.avatarUrl ?? null) || null;

  const follower = item.followerCount ?? check?.meta?.followerCount ?? null;
  const following = item.followingCount ?? check?.meta?.followingCount ?? null;
  const friends = item.friendCount ?? check?.meta?.friendCount ?? null;

  const e = new EmbedBuilder()
    .setTitle(`${statusEmoji(check.status)} ${platformLabel(item.platform)} • ${statusLabel(check.status)}`)
    .setDescription(item.url);

  if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) e.setThumbnail(avatarUrl);

  const fields = [
    { name: '👤 User', value: item.display || item.key || '—', inline: false },
    { name: '🪪 Tên', value: String(displayName), inline: false },
  ];

  if (item.platform === 'tiktok') {
    fields.push(
      { name: '👥 Follower', value: fmtNum(follower), inline: true },
      { name: '📋 Following', value: fmtNum(following), inline: true },
    );
  } else {
    fields.push(
      { name: '🤝 Bạn bè', value: fmtNum(friends), inline: true },
      { name: '👥 Follower', value: fmtNum(follower), inline: true },
    );
  }

  fields.push(
    { name: '💰 Giá', value: item.price != null ? String(item.price) : '0', inline: true },
    { name: '📝 Ghi chú', value: item.note || '—', inline: false },
    { name: '⏳ Đã sống được', value: lived, inline: false },
    { name: '🆕 Tạo', value: created, inline: true },
    { name: '🔁 Check gần đây', value: last, inline: true },
    { name: '🔎 Trạng thái', value: `**${statusLabel(check.status)}**  \`${check.reason || '—'}\``, inline: false },
    { name: '🆔 ID nội bộ', value: `\`${item.id}\``, inline: false },
  );

  e.addFields(...fields);
  return e;
}

export function buildListEmbed(items) {
  const e = new EmbedBuilder().setTitle('📋 Danh sách đang theo dõi');
  if (!items.length) {
    e.setDescription('Chưa có mục nào. Dùng `/menu` hoặc `/tiktok_add` / `/fb_add`.');
    return e;
  }
  const lines = items.slice(0, 25).map((x, i) => {
    const st = x.lastStatus || 'UNKNOWN';
    const lab = statusLabel(st);
    const last = x.lastCheckedAt ? fmtVNDate(x.lastCheckedAt) : '—';
    const name = x.name ? ` • ${x.name}` : '';
    return `${i+1}. \`${x.id}\` • **${platformLabel(x.platform)}** • ${x.display || x.key}${name} • ${statusEmoji(st)} **${lab}** • last: ${last}`;
  });
  e.setDescription(lines.join('\n'));
  e.setFooter({ text: `Tổng: ${items.length}` });
  return e;
}
