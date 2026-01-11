# Discord Bot Check Sống/Chết (TikTok + Facebook) — v2

Bạn yêu cầu: **check TikTok giống Facebook** → chỉ cần thử truy cập user/ID:
- truy cập được (không phải 404/unavailable) ⇒ **SỐNG**
- không truy cập được / 404 / unavailable ⇒ **DIE**
- gặp tường đăng nhập/anti-bot ⇒ **UNKNOWN** (không khẳng định)

Bot có **Menu UI** kiểu “bấm nút” (Discord Buttons + Modals):
- **Menu**: thêm TikTok / thêm Facebook / danh sách / check ngay / xoá
- Vẫn giữ **slash commands** dự phòng.

## 1) Cài đặt
```bash
npm i
cp .env.example .env
# điền DISCORD_TOKEN + DISCORD_CLIENT_ID (+ DISCORD_GUILD_ID nếu muốn)
npm run register
npm start
```

## 2) Lệnh
### Menu UI
- `/menu` → hiện bảng nút thao tác

### Slash commands (dự phòng)
- `/tiktok_add user_or_url note price`
- `/fb_add user_or_url note price`
- `/list`
- `/remove id`
- `/check`

## 3) Data & các field giống hình
Bot sẽ lưu:
- User/URL, Note, Price
- Trạng thái (SỐNG/DIE/UNKNOWN)
- `Đã sống được:` tính từ lúc thêm tới hiện tại (nếu chưa DIE)
- `Check gần đây:` thời điểm check gần nhất
- `Tạo:` thời điểm thêm mục

> Follower: không có API public ổn định, nên bot sẽ để `Không rõ` (đúng theo ảnh bạn gửi).

## 4) Host free
Upload source, set start command: `npm start`, set env vars như `.env`.

---
Best-effort public checking. Không bypass captcha/anti-bot.


## Railway note
- Railway đôi khi cần process lắng nghe `PORT` để báo service online. Bản v3 có health server `GET /` trả `ok`.


## Metadata
- Bot v5 cố gắng lấy **Tên / Avatar / follower/following** từ trang public (best-effort). Nếu gặp login wall/captcha sẽ ra UNKNOWN hoặc thiếu số liệu.
