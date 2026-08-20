export interface MemoryRow {
    project: string;
    key: string;
    content: string;
    tags: string[];
    updated_at: string;
}
export declare function createStore(root: string): {
    save: (project: string, key: string, content: string, tags: string[]) => MemoryRow;
    get: (project: string, key: string) => MemoryRow | null;
    search: (project: string, query: string, tags: string[], limit: number) => MemoryRow[];
    close: () => void;
};
export declare function selfcheck(): void;
