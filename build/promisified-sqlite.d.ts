import { Startable } from 'startable';
declare module 'sqlite3' {
    interface Statement<T extends {} = any> {
        getAsync(): Promise<T | undefined>;
        finalizeAsync(): Promise<void>;
    }
    interface Database {
        closeAsync(): Promise<void>;
        allAsync<T extends {} | null>(clause: string, ...params: any[]): Promise<T[]>;
        prepareAsync<T extends {}>(clause: string, ...params: any[]): Promise<Statement<T>>;
    }
}
declare class Database extends Startable {
    private filePath;
    private db?;
    private iterators;
    private statements;
    constructor(filePath: string);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    sql<T extends {} | null = null>(clause: string, ...params: any[]): Promise<T[]>;
    open<T extends {}>(clause: string, ...params: any[]): Promise<AsyncIterator<T>>;
    private step;
    close(iterator: AsyncIterator<{}>): Promise<void>;
}
export { Database, };
