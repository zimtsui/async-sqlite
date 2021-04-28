import sqlite from 'sqlite3';
import Startable from 'startable';
declare module 'sqlite3' {
    interface TypedStatement<T extends object> extends sqlite.Statement {
        getAsync(): Promise<T>;
    }
    interface Database {
        closeAsync(): Promise<void>;
        allAsync<T extends object | null>(clause: string): Promise<T[]>;
        prepareAsync<T extends object>(clause: string): Promise<TypedStatement<T>>;
    }
}
declare class Database extends Startable {
    private filePath;
    private db;
    constructor(filePath: string);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    sql<T extends object | null = null>(clause: string): Promise<T[]>;
    step<T extends object>(clause: string): AsyncGenerator<T>;
}
export { Database as default, Database, };
