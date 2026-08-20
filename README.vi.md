# dsh-memory-vi

Bộ nhớ dài hạn theo dự án cho DeepSeek Harness (DSH), lưu bằng SQLite.

Plugin đăng ký ba tool: `memory_save`, `memory_recall`, `memory_search`. Bộ nhớ được
phân theo project (lấy từ thư mục làm việc của session), nên mỗi project giữ context
riêng xuyên suốt các session.

- Không phụ thuộc native: dùng `node:sqlite` (Node 22.19+ / 24+).
- Dữ liệu nằm tại `$DSH_HOME/memory/memory.db` (mặc định `~/.dsh/memory/memory.db`).

## Cài đặt

```sh
dsh plugin --profile desktop add "github:zxck5xz/dsh-memory-vi#main"
```

Sau khi cài, khởi động lại `dsh web` (hoặc app desktop).

## Cách dùng

Nhờ model ghi nhớ trong session, ví dụ:

- "Lưu lại rằng dự án này dùng port 3000" → `memory_save`
- "Nhớ lại kiến trúc của dự án này" → `memory_search` / `memory_recall`

## Các tool

| Tool | Chức năng |
| --- | --- |
| `memory_save` | Lưu một memory: `content` (bắt buộc), `key` (tùy chọn), `tags` (tùy chọn). |
| `memory_recall` | Lấy một memory theo `key`. |
| `memory_search` | Tìm theo từ khóa trong `content`/`key`, lọc theo `tags`, `limit` (mặc định 10). |

## Cấu hình

```yaml
# profile cordis.patch.yml
- id: dsh-memory-vi
  name: dsh-memory-vi
  config:
    root: C:/data/memory   # tùy chọn; mặc định $DSH_HOME/memory
```

## Phát triển

```sh
npm install
npm run build   # tsc -> lib/
npm test        # chạy selfcheck cho db
```

## License

MIT