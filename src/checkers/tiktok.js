import { fetchText } from './http.js';

const DIE_PATTERNS = [
  /couldn\'t find this account/i,
  /couldn't find this account/i,
  /account not found/i,
  /user not found/i,
  /tài khoản này không khả dụng/i,
  /this account may have been banned/i,
  /account suspended/i,
];

const UNKNOWN_PATTERNS = [
  /verify to continue/i,
  /captcha/i,
  /access denied/i,
  /forbidden/i,
  /something went wrong/i,
];

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

export async function checkTikTok({ url, username }) {
  // Redirect detection
  const pageNoRedirect = await fetchText(url, { timeoutMs: 15000, allowRedirects: false });
  if ([301, 302, 303, 307, 308].includes(pageNoRedirect.status)) {
    return { status: 'REDIRECT', reason: `redirect_${pageNoRedirect.status}` };
  }

  const page = await fetchText(url, { timeoutMs: 15000, allowRedirects: true });

  if (page.status === 404) return { status: 'DIE', reason: 'http_404' };
  if (page.status === 429) return { status: 'UNKNOWN', reason: 'rate_limited_429' };
  if (page.status >= 500) return { status: 'UNKNOWN', reason: `http_${page.status}` };

  const text = page.text || '';
  if (DIE_PATTERNS.some(r => r.test(text))) return { status: 'DIE', reason: 'die_text' };
  if (UNKNOWN_PATTERNS.some(r => r.test(text))) return { status: 'UNKNOWN', reason: 'anti_bot_or_error' };

  // --- Metadata extraction (best-effort, public HTML) ---
  let displayName = null;
  let followerCount = null;
  let followingCount = null;
  let avatarUrl = null;

  // Method 1: __UNIVERSAL_DATA_FOR_REHYDRATION__
  const uni = text.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/i);
  if (uni) {
    const data = safeJsonParse(uni[1].trim());
    const userInfo = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
    const user = userInfo?.user;
    const stats = userInfo?.stats;
    if (user) {
      displayName = displayName || user.nickname || null;
      avatarUrl = avatarUrl || user.avatarLarger || user.avatarMedium || user.avatarThumb || null;
    }
    if (stats) {
      followerCount = followerCount ?? stats.followerCount ?? null;
      followingCount = followingCount ?? stats.followingCount ?? null;
    }
  }

  // Method 2: SIGI_STATE embedded JSON
  if (!displayName || !avatarUrl || followerCount == null || followingCount == null) {
    const sigi = text.match(/<script\s+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/i);
    if (sigi) {
      const data = safeJsonParse(sigi[1].trim());
      const users = data?.UserModule?.users || null;
      if (users && typeof users === 'object') {
        for (const k of Object.keys(users)) {
          const u = users[k];
          if (!u) continue;
          if (username && u.uniqueId && String(u.uniqueId).toLowerCase() !== String(username).toLowerCase()) continue;
          displayName = displayName || u.nickname || null;
          avatarUrl = avatarUrl || u.avatarLarger || u.avatarMedium || u.avatarThumb || null;
          followerCount = followerCount ?? u.followerCount ?? null;
          followingCount = followingCount ?? u.followingCount ?? null;
          break;
        }
      }
    }
  }

  // Fallback: title tag
  if (!displayName) {
    const title = text.match(/<title>([^<]+)<\/title>/i);
    if (title) displayName = title[1].replace(/\s*\|\s*TikTok\s*$/i, '').trim();
  }

  return {
    status: 'OK',
    reason: `http_${page.status}`,
    meta: {
      displayName,
      followerCount,
      followingCount,
      avatarUrl,
    }
  };
}
