import Startable from 'startable';
declare module 'sqlite3' {
    interface Database {
        closeAsync(): Promise<void>;
        allAsync<T>(clause: string): Promise<T[]>;
    }
}
declare class Database extends Startable {
    private filePath;
    private db;
    constructor(filePath: string);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    sql<T = void>(clause: string): Promise<T[]>;
}
export { Database as default, Database, };
