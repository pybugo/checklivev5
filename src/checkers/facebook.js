import { fetchText } from './http.js';

const DIE_PATTERNS = [
  /the link you followed may be broken/i,
  /content_not_found/i,
  /this content isn\'t available right now/i,
  /sorry, this page isn\'t available/i,
  /page isn\'t available/i,
  /Trang này không khả dụng/i,
  /Nội dung hiện không khả dụng/i,
  /Liên kết bạn theo dõi có thể đã bị hỏng/i,
  /Account disabled/i,
];

const UNKNOWN_PATTERNS = [
  /log in to facebook/i,
  /đăng nhập facebook/i,
  /you must log in/i,
  /checkpoint/i,
  /temporary block/i,
];

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

export async function checkFacebook({ url }) {
  const noRedirect = await fetchText(url, { timeoutMs: 15000, allowRedirects: false });

  if ([301, 302, 303, 307, 308].includes(noRedirect.status)) {
    return { status: 'UNKNOWN', reason: `redirect_${noRedirect.status}` };
  }

  const page = await fetchText(url, { timeoutMs: 15000, allowRedirects: true });

  if (page.status === 404) return { status: 'DIE', reason: 'http_404' };
  if (page.status === 429) return { status: 'UNKNOWN', reason: 'rate_limited_429' };
  if (page.status >= 500) return { status: 'UNKNOWN', reason: `http_${page.status}` };

  const text = page.text || '';

  if (DIE_PATTERNS.some(r => r.test(text))) return { status: 'DIE', reason: 'die_text' };
  if (UNKNOWN_PATTERNS.some(r => r.test(text))) return { status: 'UNKNOWN', reason: 'login_wall_or_block' };

  if (/\/login\.php/i.test(page.url) || /\/login\//i.test(page.url)) {
    return { status: 'UNKNOWN', reason: 'redirect_login' };
  }

  // --- Metadata extraction (best-effort, public HTML) ---
  let displayName = null;
  let followerCount = null;
  let friendCount = null;
  let avatarUrl = null;

  // Title
  const title = text.match(/<title>([^<]+)<\/title>/i);
  if (title) displayName = title[1].replace(/\s*\|\s*Facebook\s*$/i, '').trim();

  // JSON-LD name
  const ld = [...text.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ld) {
    const data = safeJsonParse(m[1].trim());
    if (!data) continue;
    if (typeof data === 'object' && data.name && !displayName) displayName = String(data.name);
    // some pages include image
    if (typeof data === 'object' && data.image && !avatarUrl) avatarUrl = String(data.image);
  }

  // Avatar patterns
  const avatarPatterns = [
    /profilePicLarge":"([^"]+)"/i,
    /"profile_picture"\s*:\s*\{[^}]*"uri"\s*:\s*"([^"]+)"/i,
    /"picture"\s*:\s*\{[^}]*"uri"\s*:\s*"([^"]+)"/i,
  ];
  for (const r of avatarPatterns) {
    const m = text.match(r);
    if (m) {
      avatarUrl = m[1].replace(/\\\//g, '/');
      break;
    }
  }

  // Count patterns (very unreliable on FB; best-effort)
  const friend = text.match(/(\d[\d.,]*)\s*(?:bạn bè|friends)/i);
  if (friend) friendCount = friend[1];

  const follower = text.match(/(\d[\d.,]*)\s*(?:người theo dõi|followers)/i);
  if (follower) followerCount = follower[1];

  return {
    status: 'OK',
    reason: `http_${page.status}`,
    meta: {
      displayName,
      followerCount,
      friendCount,
      avatarUrl,
    }
  };
}
