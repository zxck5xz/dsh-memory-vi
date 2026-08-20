# dsh-memory-vi

Per-project long-term memory for DeepSeek Harness (DSH), backed by SQLite.

The plugin registers three tools: `memory_save`, `memory_recall`, `memory_search`.
Memories are scoped per project (derived from the session working directory), so
each project keeps its own long-term context across sessions.

- No native dependencies: uses `node:sqlite` (Node 22.19+ / 24+).
- Data lives in `$DSH_HOME/memory/memory.db` (default `~/.dsh/memory/memory.db`).

## Install

```sh
dsh plugin --profile desktop add "github:zxck5xz/dsh-memory-vi#main"
```

Restart `dsh web` (or the desktop app) after adding.

## Usage

Ask the model to remember things in a session, e.g.:

- "Lưu lại rằng dự án này dùng port 3000" → `memory_save`
- "Nhớ lại kiến trúc của dự án này" → `memory_search` / `memory_recall`

## Tools

| Tool | Purpose |
| --- | --- |
| `memory_save` | Save a memory: `content` (required), `key` (optional), `tags` (optional). |
| `memory_recall` | Retrieve one memory by `key`. |
| `memory_search` | Keyword search across `content`/`key`, optional `tags` filter, `limit` (default 10). |

## Configuration

```yaml
# profile cordis.patch.yml
- id: dsh-memory-vi
  name: dsh-memory-vi
  config:
    root: C:/data/memory   # optional; defaults to $DSH_HOME/memory
```

## Development

```sh
npm install
npm run build   # tsc -> lib/
npm test        # runs db selfcheck
```

## License

MIT