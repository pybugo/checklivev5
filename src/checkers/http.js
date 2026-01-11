import axios from 'axios';

/**
 * Lightweight fetch helper for public pages (no bypass/captcha).
 * - allowRedirects=false helps detect 301/302 to login/changed username.
 */
export async function fetchText(url, { timeoutMs = 15000, allowRedirects = true } = {}) {
  const res = await axios.get(url, {
    timeout: timeoutMs,
    maxRedirects: allowRedirects ? 5 : 0,
    validateStatus: () => true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  const finalUrl = res.request?.res?.responseUrl || url;
  const location = res.headers?.location || null;
  return { status: res.status, url: finalUrl, location, text, headers: res.headers };
}
