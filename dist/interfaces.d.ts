declare module 'sqlite3' {
    interface Statement<T extends object = any> {
        getAsync(): Promise<T | undefined>;
        finalizeAsync(): Promise<void>;
    }
    interface Database {
        closeAsync(): Promise<void>;
        allAsync<T extends object | null>(clause: string, ...params: any[]): Promise<T[]>;
        prepareAsync<T extends object>(clause: string, ...params: any[]): Promise<Statement<T>>;
    }
}
export interface StatementIterator<T> extends AsyncIterator<T> {
}
