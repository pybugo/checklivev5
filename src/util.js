import crypto from 'crypto';

export function genId(prefix='itm') {
  const rand = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${Date.now()}_${rand}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function fmtVNDate(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} - ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export function humanizeDuration(ms) {
  if (ms <= 0) return '0s';
  const sec = Math.floor(ms/1000);
  const d = Math.floor(sec/86400);
  const h = Math.floor((sec%86400)/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s && parts.length < 3) parts.push(`${s}s`);
  return parts.join(' ');
}

export function normalizeTikTok(input) {
  const s = input.trim();
  const m1 = s.match(/^@?([a-zA-Z0-9._]{2,24})$/);
  if (m1) {
    const username = m1[1];
    return { key: username, display: `@${username}`, url: `https://www.tiktok.com/@${username}` };
  }
  const m2 = s.match(/tiktok\.com\/@([a-zA-Z0-9._]{2,24})/i);
  if (m2) {
    const username = m2[1];
    return { key: username, display: `@${username}`, url: `https://www.tiktok.com/@${username}` };
  }
  throw new Error('TikTok input invalid. Gửi @username hoặc link https://www.tiktok.com/@username');
}

export function normalizeFacebook(input) {
  const s = input.trim();
  const m1 = s.match(/^\d{6,32}$/);
  if (m1) {
    const uid = m1[0];
    return { key: uid, display: uid, url: `https://www.facebook.com/${uid}` };
  }
  if (/^https?:\/\//i.test(s)) {
    const clean = s.replace(/\?.*$/, '');
    return { key: clean, display: clean, url: clean };
  }
  if (/^[a-zA-Z0-9.]{3,}$/i.test(s)) {
    return { key: s, display: s, url: `https://www.facebook.com/${s}` };
  }
  throw new Error('Facebook input invalid. Gửi UID số hoặc link profile.');
}

export function parseCount(input) {
  if (input == null) return null;
  if (typeof input === 'number') return input;
  const s = String(input).trim();
  if (!s) return null;

  // remove spaces and dots in VN formats, keep commas for thousands
  const t = s.replace(/\s+/g, '').replace(/\.(?=\d{3}\b)/g, '');

  // K/M/B suffix
  const m = t.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([KMB])$/i);
  if (m) {
    const num = parseFloat(m[1].replace(',', '.'));
    const suf = m[2].toUpperCase();
    const mult = suf === 'K' ? 1e3 : (suf === 'M' ? 1e6 : 1e9);
    return Math.round(num * mult);
  }

  // plain digits with commas
  const d = t.replace(/,/g, '');
  if (/^\d+$/.test(d)) return parseInt(d, 10);

  return null;
}
