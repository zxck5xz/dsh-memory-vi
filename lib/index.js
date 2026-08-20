import { defineTool } from '@deepseek-ai/dsh-tools';
import z from '@deepseek-ai/schemastery';
import { homedir } from 'node:os';
import path from 'node:path';
import { createStore } from './db.js';
export const name = 'dsh-memory-vi';
export const inject = ['tools'];
function defaultRoot() {
    const home = process.env.DSH_HOME || path.join(homedir(), '.dsh');
    return path.join(home, 'memory');
}
export const Config = z.object({
    root: z.string().default(defaultRoot()),
});
function projectOf(exec) {
    const e = exec;
    const cwd = e.agent?.session?.header?.cwd;
    return cwd ? path.basename(cwd).toLowerCase() || 'default' : 'default';
}
function textBlock(text) {
    return [{ type: 'text', text }];
}
const memoryOutput = {
    schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            project: { type: 'string', required: true },
            key: { type: 'string', required: true },
            content: { type: 'string', required: true },
            tags: { type: 'array', items: { type: 'string' }, required: true },
            updated_at: { type: 'string', required: true },
        },
    },
    render(_args, value) {
        const m = value;
        return textBlock(`${m.project}/${m.key} (${m.updated_at}): ${m.content}`);
    },
};
export function apply(ctx, config) {
    ctx.effect(() => {
        const store = createStore(config.root);
        ctx.tools.register(defineTool({
            name: 'memory_save',
            description: 'Save a long-term memory for the current project (derived from the session working directory). Recall later with memory_search or memory_recall.',
            parameters: {
                content: { type: 'string', description: 'The memory content to store.' },
                key: { type: 'string', description: 'Optional short identifier; auto-generated when omitted.' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags for filtering.' },
            },
            output: memoryOutput,
            async execute({ content = '', key, tags }, exec) {
                return store.save(projectOf(exec), key || `mem-${Date.now()}`, content, tags ?? []);
            },
        }));
        ctx.tools.register(defineTool({
            name: 'memory_recall',
            description: 'Retrieve one saved memory by its key for the current project.',
            parameters: {
                key: { type: 'string', description: 'The memory key to retrieve.' },
            },
            output: memoryOutput,
            async execute({ key = '' }, exec) {
                const project = projectOf(exec);
                return store.get(project, key) ?? { project, key, content: '', tags: [], updated_at: '' };
            },
        }));
        ctx.tools.register(defineTool({
            name: 'memory_search',
            description: 'Search saved memories of the current project by keyword and/or tags.',
            parameters: {
                query: { type: 'string', description: 'Keyword to match against content or key.' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags filter (all must match).' },
                limit: { type: 'integer', description: 'Maximum number of results (default 10).' },
            },
            output: {
                schema: { type: 'array', items: memoryOutput.schema },
                render(_args, value) {
                    const rows = value;
                    if (!rows.length)
                        return textBlock('no memories found');
                    return textBlock(rows.map((m) => `${m.project}/${m.key} (${m.updated_at}): ${m.content}`).join('\n'));
                },
            },
            async execute({ query, tags, limit }, exec) {
                return store.search(projectOf(exec), query ?? '', tags ?? [], limit ?? 10);
            },
        }));
        return () => store.close();
    });
}
