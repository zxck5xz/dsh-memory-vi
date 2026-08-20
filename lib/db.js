import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
function toMemory(row) {
    return { ...row, tags: JSON.parse(row.tags) };
}
function escapeLike(s) {
    return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
export function createStore(root) {
    mkdirSync(root, { recursive: true });
    const db = new DatabaseSync(path.join(root, 'memory.db'));
    db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      project TEXT NOT NULL,
      key TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (project, key)
    )
  `);
    const upsert = db.prepare(`
    INSERT INTO memories (project, key, content, tags, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(project, key) DO UPDATE SET
      content = excluded.content,
      tags = excluded.tags,
      updated_at = excluded.updated_at
  `);
    const select = db.prepare(`
    SELECT project, key, content, tags, updated_at FROM memories
    WHERE project = ? AND key = ?
  `);
    const searchStmt = db.prepare(`
    SELECT project, key, content, tags, updated_at FROM memories
    WHERE project = ? AND (key LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')
    ORDER BY updated_at DESC
  `);
    function save(project, key, content, tags) {
        const updated_at = new Date().toISOString();
        upsert.run(project, key, content, JSON.stringify(tags), updated_at);
        return { project, key, content, tags, updated_at };
    }
    function get(project, key) {
        const row = select.get(project, key);
        return row ? toMemory(row) : null;
    }
    function search(project, query, tags, limit) {
        const like = `%${escapeLike(query)}%`;
        const rows = searchStmt.all(project, like, like);
        // ponytail: tag filter in JS; move to json_each if the table grows
        return rows
            .filter((r) => tags.every((t) => toMemory(r).tags.includes(t)))
            .slice(0, limit)
            .map(toMemory);
    }
    function close() {
        db.close();
    }
    return { save, get, search, close };
}
export function selfcheck() {
    const root = mkdtempSync(path.join(tmpdir(), 'dsh-memory-'));
    const store = createStore(root);
    store.save('proj-a', 'k1', 'hello world', ['greet']);
    store.save('proj-a', 'k2', 'buy milk', []);
    store.save('proj-b', 'k1', 'other project', []);
    assert.equal(store.get('proj-a', 'k1').content, 'hello world');
    assert.equal(store.get('proj-b', 'k1').content, 'other project');
    store.save('proj-a', 'k1', 'hello world v2', ['greet']);
    assert.equal(store.get('proj-a', 'k1').content, 'hello world v2');
    assert.equal(store.search('proj-a', 'world', [], 10).length, 1);
    assert.equal(store.search('proj-a', '', [], 10).length, 2);
    assert.equal(store.search('proj-a', 'milk', [], 10)[0].key, 'k2');
    assert.equal(store.search('proj-a', '', ['greet'], 10).length, 1);
    assert.equal(store.search('proj-b', 'world', [], 10).length, 0);
    assert.equal(store.get('proj-a', 'nope'), null);
    store.close();
    console.log('selfcheck ok');
}
