import { Startable } from 'startable';
import { StatementIterator } from './interfaces';
declare class Database extends Startable {
    private filePath;
    private db?;
    private iterators;
    private statements;
    constructor(filePath: string);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    sql<T extends object | null = null>(clause: string, ...params: any[]): Promise<T[]>;
    open<T extends object>(clause: string, ...params: any[]): Promise<StatementIterator<T>>;
    private step;
    close(iterator: StatementIterator<object>): Promise<void>;
}
export { Database as default, Database, };
