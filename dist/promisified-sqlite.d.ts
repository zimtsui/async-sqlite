import Startable from 'startable';
declare class Database extends Startable {
    private filePath;
    private db?;
    constructor(filePath: string);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    sql<T>(clause: string): Promise<T>;
}
export { Database as default, Database, };
